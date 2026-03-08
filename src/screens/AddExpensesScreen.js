import React, { useState, useContext, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    Alert,
    ActivityIndicator,
    StatusBar
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Dropdown } from "react-native-element-dropdown"
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated"
import { ThemeContext } from "../context/ThemeContext"
import { TRANSACTION_CATEGORIES, TRANSACTION_TYPES, getCurrencySymbol } from "../utils/constants"
import { supabase } from "../services/supabase"
import { AuthContext } from "../context/AuthContext"

const { width } = Dimensions.get("window")

export default function AddExpensesScreen({ navigation }) {
    const { theme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)

    const currencySymbol = getCurrencySymbol(user?.user_metadata?.currency)

    const [activeTab, setActiveTab] = useState("Expense")
    const [amount, setAmount] = useState("")
    const [category, setCategory] = useState(null)
    const [subCategory, setSubCategory] = useState(null)
    const [note, setNote] = useState("")
    const [loading, setLoading] = useState(false)
    const [budgets, setBudgets] = useState([])
    const [budgetWarning, setBudgetWarning] = useState(null)
    const [isBlocked, setIsBlocked] = useState(false)

    const [availableSubCategories, setAvailableSubCategories] = useState([])

    // Animation values
    const indicatorPosition = useSharedValue(0)

    useEffect(() => {
        const tabIndex = TRANSACTION_TYPES.findIndex(t => t.value === activeTab)
        indicatorPosition.value = withSpring(tabIndex * (width / 3))

        // Reset selections on tab change
        setCategory(null)
        setSubCategory(null)
        setBudgetWarning(null)
        setIsBlocked(false)
    }, [activeTab])

    const fetchBudgets = async () => {
        const { data, error } = await supabase
            .from("budgets")
            .select("*")
            .eq("user_id", user.id)

        if (!error) setBudgets(data || [])
    }

    useEffect(() => {
        fetchBudgets()
    }, [])

    const checkBudget = async (inputAmount) => {
        if (!inputAmount || isNaN(inputAmount)) {
            setBudgetWarning(null)
            setIsBlocked(false)
            return
        }

        const amt = parseFloat(inputAmount)
        let relevantBudgets = budgets.filter(b => {
            if (b.type === "Expense" && (activeTab === "Expense" || activeTab === "Transfer")) return true
            if (b.type === "Income" && activeTab === "Income") return true
            if (b.type === "Category" && b.category === category) return true
            return false
        })

        if (relevantBudgets.length === 0) {
            setBudgetWarning(null)
            setIsBlocked(false)
            return
        }

        // Check each relevant budget
        for (let b of relevantBudgets) {
            // Calculate current total for the period
            const now = new Date()
            let startDate = new Date()
            let endDate = new Date()

            if (b.period === "Daily") {
                startDate.setHours(0, 0, 0, 0)
                endDate.setHours(23, 59, 59, 999)
            } else if (b.period === "Monthly") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
            } else if (b.period === "Yearly") {
                startDate = new Date(now.getFullYear(), 0, 1)
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
            } else if (b.period === "Specified Date") {
                startDate = new Date(b.start_date)
                endDate = new Date(b.end_date)
                endDate.setHours(23, 59, 59, 999)
            }

            let query = supabase
                .from("transactions")
                .select("amount")
                .eq("user_id", user.id)
                .gte("date", getLocalDateString(startDate))
                .lte("date", getLocalDateString(endDate))

            if (b.type === "Category") {
                query = query.eq("category", b.category)
            } else if (b.type === "Expense") {
                query = query.in("type", ["Expense", "Transfer"])
            } else {
                query = query.eq("type", b.type)
            }

            const { data: trans } = await query

            const currentTotal = (trans || []).reduce((sum, t) => sum + parseFloat(t.amount), 0)
            const projectedTotal = currentTotal + amt

            if (b.max_amount && projectedTotal > b.max_amount) {
                setBudgetWarning(`🚨 Limit Exceeded: This will bring your ${b.period} ${b.type === 'Category' ? b.category : b.type} total to ${currencySymbol}${projectedTotal.toLocaleString()}, which is above your limit of ${currencySymbol}${b.max_amount.toLocaleString()}.`)
                if (b.is_blocking) {
                    setIsBlocked(true)
                    return // Stop checking if blocked
                }
            } else if (b.min_amount && projectedTotal < b.min_amount) {
                setBudgetWarning(`💡 Goal Check: You'll be at ${currencySymbol}${projectedTotal.toLocaleString()}, which is still below your ${b.period} target of ${currencySymbol}${b.min_amount.toLocaleString()}. Keep going!`)
            } else if (b.max_amount && projectedTotal > b.max_amount * 0.8) {
                setBudgetWarning(`⚠️ Warning: You've used over 80% of your ${b.period} ${b.type === 'Category' ? b.category : b.type} limit (${currencySymbol}${b.max_amount.toLocaleString()}).`)
            }
        }
        setBudgetWarning(null)
        setIsBlocked(false)
    }

    useEffect(() => {
        checkBudget(amount)
    }, [amount, category])

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorPosition.value }],
    }))

    const handleCategoryChange = (item) => {
        setCategory(item.value)
        setAvailableSubCategories(item.subCategories || [])
        setSubCategory(null)
    }

    // Helper to get local YYYY-MM-DD
    const getLocalDateString = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const handleSave = async () => {
        if (!amount || !category || !subCategory) {
            Alert.alert("Error", "Please fill in amount, category, and sub-category")
            return
        }

        setLoading(true)
        const now = new Date()
        const date = getLocalDateString(now)
        const time = now.toTimeString().split(' ')[0]

        const { error } = await supabase.from("transactions").insert({
            user_id: user.id,
            amount: parseFloat(amount),
            type: activeTab,
            category: category,
            sub_category: subCategory,
            note: note,
            date: date,
            time: time,
        })

        if (error) {
            Alert.alert("Error", "Failed to save transaction: " + error.message)
        } else {
            // Create notification if warning exists
            if (budgetWarning) {
                await supabase.from("notifications").insert({
                    user_id: user.id,
                    title: "Budget Limit Warning",
                    message: budgetWarning,
                    type: "Budget Warning"
                })
            }

            Alert.alert("Success", "Transaction saved successfully!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ])
        }
        setLoading(false)
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={[styles.backText, { color: theme.text }]}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Add Transaction</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {TRANSACTION_TYPES.map((type) => (
                    <TouchableOpacity
                        key={type.value}
                        style={styles.tab}
                        onPress={() => setActiveTab(type.value)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === type.value ? theme.primary : theme.subtext }
                        ]}>
                            {type.label}
                        </Text>
                    </TouchableOpacity>
                ))}
                <Animated.View style={[styles.indicator, { backgroundColor: theme.primary }, indicatorStyle]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeIn.delay(200)} style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.label, { color: theme.subtext }]}>Amount</Text>
                    <View style={styles.amountContainer}>
                        <Text style={[styles.currencySymbol, { color: theme.primary }]}>{currencySymbol}</Text>
                        <TextInput
                            style={[styles.amountInput, { color: theme.text }]}
                            placeholder="0.00"
                            placeholderTextColor={theme.subtext}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus
                        />
                    </View>
                    {budgetWarning && (
                        <View style={[styles.warningContainer, { backgroundColor: isBlocked ? "#FF4D4D20" : "#F1C40F20" }]}>
                            <Text style={[styles.warningText, { color: isBlocked ? "#FF4D4D" : "#D4AC0D" }]}>
                                {isBlocked ? "🚫 " : "⚠️ "}{budgetWarning}
                            </Text>
                            {isBlocked && <Text style={styles.blockNote}>Transaction is blocked by your budget planner.</Text>}
                        </View>
                    )}
                </Animated.View>

                <Animated.View entering={FadeIn.delay(300)} style={[styles.formCard, { backgroundColor: theme.card }]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.subtext }]}>Category</Text>
                        <Dropdown
                            style={[styles.dropdown, { borderColor: theme.border }]}
                            placeholderStyle={[styles.placeholderStyle, { color: theme.subtext }]}
                            selectedTextStyle={[styles.selectedTextStyle, { color: theme.text }]}
                            inputSearchStyle={styles.inputSearchStyle}
                            data={TRANSACTION_CATEGORIES}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Category"
                            searchPlaceholder="Search..."
                            value={category}
                            onChange={handleCategoryChange}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.subtext }]}>Sub-category</Text>
                        <Dropdown
                            style={[styles.dropdown, { borderColor: theme.border }]}
                            placeholderStyle={[styles.placeholderStyle, { color: theme.subtext }]}
                            selectedTextStyle={[styles.selectedTextStyle, { color: theme.text }]}
                            inputSearchStyle={styles.inputSearchStyle}
                            data={availableSubCategories}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Sub-category"
                            searchPlaceholder="Search..."
                            value={subCategory}
                            onChange={item => setSubCategory(item.value)}
                            disable={!category}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.subtext }]}>Note (Optional)</Text>
                        <TextInput
                            style={[styles.noteInput, { color: theme.text, borderColor: theme.border }]}
                            placeholder="What was this for?"
                            placeholderTextColor={theme.subtext}
                            multiline
                            numberOfLines={3}
                            value={note}
                            onChangeText={setNote}
                        />
                    </View>
                </Animated.View>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: isBlocked ? theme.subtext : theme.primary }]}
                    onPress={handleSave}
                    disabled={loading || isBlocked}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Transaction</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    backText: {
        fontSize: 24,
    },
    tabContainer: {
        flexDirection: "row",
        height: 50,
        position: "relative",
    },
    tab: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    tabText: {
        fontWeight: "600",
        fontSize: 16,
    },
    indicator: {
        position: "absolute",
        bottom: 0,
        height: 3,
        width: width / 3,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 30,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 10,
    },
    amountContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: "bold",
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: "bold",
        textAlign: "center",
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    dropdown: {
        height: 56,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
        borderRadius: 8,
    },
    noteInput: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        height: 100,
        textAlignVertical: "top",
    },
    saveBtn: {
        height: 60,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    saveBtnText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    warningContainer: {
        marginTop: 15,
        padding: 12,
        borderRadius: 12,
    },
    warningText: {
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
    },
    blockNote: {
        fontSize: 11,
        color: "#FF4D4D",
        textAlign: "center",
        marginTop: 4,
        fontWeight: "600"
    }
})
