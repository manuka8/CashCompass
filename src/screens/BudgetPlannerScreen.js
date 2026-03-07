import React, { useState, useContext, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StatusBar,
    Alert,
    ActivityIndicator,
    Modal,
    Dimensions
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Dropdown } from "react-native-element-dropdown"
import { ThemeContext } from "../context/ThemeContext"
import { AuthContext } from "../context/AuthContext"
import { supabase } from "../services/supabase"
import { TRANSACTION_CATEGORIES, getCurrencySymbol } from "../utils/constants"

const { height } = Dimensions.get("window")

const BUDGET_TYPES = [
    { label: "Total Balance", value: "Total Balance" },
    { label: "Expense Limit", value: "Expense" },
    { label: "Income Goal", value: "Income" },
    { label: "Category Limit", value: "Category" },
]

const PERIODS = [
    { label: "Daily", value: "Daily" },
    { label: "Monthly", value: "Monthly" },
    { label: "Yearly", value: "Yearly" },
    //   { label: "Specific Date", value: "Specific Date" },
]

export default function BudgetPlannerScreen() {
    const { theme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)
    const navigation = useNavigation()

    const [budgets, setBudgets] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [activePeriod, setActivePeriod] = useState("Monthly")

    // New Budget Form
    const [type, setType] = useState("Expense")
    const [period, setPeriod] = useState("Monthly")
    const [category, setCategory] = useState(null)
    const [minAmount, setMinAmount] = useState("")
    const [maxAmount, setMaxAmount] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [isBlocking, setIsBlocking] = useState(false)

    const currencySymbol = getCurrencySymbol(user?.user_metadata?.currency)

    const fetchBudgets = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from("budgets")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

        if (!error) setBudgets(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchBudgets()
    }, [])

    const handleCreate = async () => {
        if (!minAmount && !maxAmount) {
            Alert.alert("Error", "Please enter at least one limit (Min or Max)")
            return
        }

        if (period === "Specified Date" && (!startDate || !endDate)) {
            Alert.alert("Error", "Please select start and end dates")
            return
        }

        // Check for duplicates/conflicts
        const isDuplicate = budgets.some(b =>
            b.type === type &&
            b.period === period &&
            (type !== "Category" || b.category === category) &&
            (period !== "Specified Date" || (b.start_date === startDate && b.end_date === endDate))
        )

        if (isDuplicate) {
            Alert.alert("Duplicate Budget", "A budget with this configuration already exists. Please delete the existing one first.")
            return
        }

        const { error } = await supabase.from("budgets").insert({
            user_id: user.id,
            type,
            period,
            category: type === "Category" ? category : null,
            min_amount: minAmount ? parseFloat(minAmount) : null,
            max_amount: maxAmount ? parseFloat(maxAmount) : null,
            start_date: period === "Specified Date" ? startDate : null,
            end_date: period === "Specified Date" ? endDate : null,
            is_blocking: isBlocking
        })

        if (error) {
            Alert.alert("Error", error.message)
        } else {
            setShowModal(false)
            fetchBudgets()
            resetForm()
        }
    }

    const resetForm = () => {
        setType("Expense")
        setPeriod("Monthly")
        setCategory(null)
        setMinAmount("")
        setMaxAmount("")
        setStartDate("")
        setEndDate("")
        setIsBlocking(false)
    }

    const deleteBudget = async (id) => {
        const { error } = await supabase.from("budgets").delete().eq("id", id)
        if (!error) fetchBudgets()
    }

    const filteredBudgets = budgets.filter(b => b.period === activePeriod)

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Text style={{ fontSize: 24, color: theme.text }}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Budget Planner</Text>
                <TouchableOpacity onPress={() => setShowModal(true)} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
                    <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Period Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
                {PERIODS.concat([{ label: "Custom", value: "Specified Date" }]).map(p => (
                    <TouchableOpacity
                        key={p.value}
                        style={[styles.tab, activePeriod === p.value && { borderBottomColor: theme.primary }]}
                        onPress={() => setActivePeriod(p.value)}
                    >
                        <Text style={[styles.tabText, { color: activePeriod === p.value ? theme.primary : theme.subtext }]}>{p.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
                ) : filteredBudgets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 50, marginBottom: 20 }}>📊</Text>
                        <Text style={[styles.emptyText, { color: theme.subtext }]}>No budgets for {activePeriod}</Text>
                        <Text style={[styles.emptySubText, { color: theme.subtext }]}>Plan your spending and save more effectively.</Text>
                    </View>
                ) : (
                    filteredBudgets.map(budget => (
                        <View key={budget.id} style={[styles.budgetCard, { backgroundColor: theme.card }]}>
                            <View style={styles.budgetHeader}>
                                <View>
                                    <Text style={[styles.budgetType, { color: theme.text }]}>{budget.type}</Text>
                                    <Text style={[styles.budgetPeriod, { color: theme.subtext }]}>
                                        {budget.period === "Specified Date" ? `${budget.start_date} to ${budget.end_date}` : budget.period}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => deleteBudget(budget.id)}>
                                    <Text style={{ color: "#FF4D4D" }}>🗑️</Text>
                                </TouchableOpacity>
                            </View>

                            {budget.category && (
                                <View style={[styles.categoryBadge, { backgroundColor: theme.primary + "10" }]}>
                                    <Text style={{ color: theme.primary, fontSize: 12 }}>{budget.category}</Text>
                                </View>
                            )}

                            <View style={styles.budgetAmountRow}>
                                {budget.min_amount && (
                                    <View>
                                        <Text style={[styles.amountLabel, { color: theme.subtext }]}>Min Goal</Text>
                                        <Text style={[styles.budgetAmount, { color: "#2ECC71" }]}>{currencySymbol}{budget.min_amount.toLocaleString()}</Text>
                                    </View>
                                )}
                                {budget.max_amount && (
                                    <View>
                                        <Text style={[styles.amountLabel, { color: theme.subtext }]}>Max Limit</Text>
                                        <Text style={[styles.budgetAmount, { color: "#FF4D4D" }]}>{currencySymbol}{budget.max_amount.toLocaleString()}</Text>
                                    </View>
                                )}
                                {budget.is_blocking && (
                                    <View style={styles.blockingBadge}>
                                        <Text style={styles.blockingText}>🔒 Blocking</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Create Modal */}
            <Modal visible={showModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Create Budget</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={{ color: theme.primary, fontWeight: "bold" }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.formSection}>
                                <Text style={[styles.label, { color: theme.subtext }]}>Budget Type</Text>
                                <Dropdown
                                    style={[styles.dropdown, { borderColor: theme.border }]}
                                    data={BUDGET_TYPES}
                                    labelField="label"
                                    valueField="value"
                                    value={type}
                                    onChange={item => setType(item.value)}
                                    placeholderStyle={{ color: theme.subtext }}
                                    selectedTextStyle={{ color: theme.text }}
                                />
                            </View>

                            {type === "Category" && (
                                <View style={styles.formSection}>
                                    <Text style={[styles.label, { color: theme.subtext }]}>Category</Text>
                                    <Dropdown
                                        style={[styles.dropdown, { borderColor: theme.border }]}
                                        data={TRANSACTION_CATEGORIES}
                                        labelField="label"
                                        valueField="value"
                                        value={category}
                                        onChange={item => setCategory(item.value)}
                                        placeholderStyle={{ color: theme.subtext }}
                                        selectedTextStyle={{ color: theme.text }}
                                    />
                                </View>
                            )}

                            <View style={styles.formSection}>
                                <Text style={[styles.label, { color: theme.subtext }]}>Period</Text>
                                <Dropdown
                                    style={[styles.dropdown, { borderColor: theme.border }]}
                                    data={PERIODS.concat([{ label: "Specified Date", value: "Specified Date" }])}
                                    labelField="label"
                                    valueField="value"
                                    value={period}
                                    onChange={item => setPeriod(item.value)}
                                    placeholderStyle={{ color: theme.subtext }}
                                    selectedTextStyle={{ color: theme.text }}
                                />
                            </View>

                            {period === "Specified Date" && (
                                <View style={styles.dateRangeRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, { color: theme.subtext }]}>From</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={theme.subtext}
                                            value={startDate}
                                            onChangeText={setStartDate}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, { color: theme.subtext }]}>To</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={theme.subtext}
                                            value={endDate}
                                            onChangeText={setEndDate}
                                        />
                                    </View>
                                </View>
                            )}

                            <View style={styles.dualAmountRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: theme.subtext }]}>Min Goal ({currencySymbol})</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                        keyboardType="numeric"
                                        placeholder="Optional"
                                        placeholderTextColor={theme.subtext}
                                        value={minAmount}
                                        onChangeText={setMinAmount}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: theme.subtext }]}>Max Limit ({currencySymbol})</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                        keyboardType="numeric"
                                        placeholder="Optional"
                                        placeholderTextColor={theme.subtext}
                                        value={maxAmount}
                                        onChangeText={setMaxAmount}
                                    />
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <TouchableOpacity
                                    style={styles.blockingRow}
                                    onPress={() => setIsBlocking(!isBlocking)}
                                >
                                    <View style={[styles.checkbox, isBlocking && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                                        {isBlocking && <Text style={{ color: "#FFF", fontSize: 10 }}>✓</Text>}
                                    </View>
                                    <Text style={[styles.blockingLabel, { color: theme.text }]}>Block transaction if limit exceeded</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.primary }]} onPress={handleCreate}>
                                <Text style={styles.createBtnText}>Create Plan</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: { fontSize: 20, fontWeight: "bold" },
    iconBtn: { padding: 5 },
    tabBar: { flexDirection: "row", paddingHorizontal: 10, borderBottomWidth: 1, marginBottom: 5 },
    tab: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 2, borderBottomColor: "transparent" },
    tabText: { fontSize: 13, fontWeight: "600" },
    addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
    addBtnText: { color: "#FFF", fontSize: 24, fontWeight: "bold" },
    scrollContent: { padding: 20 },
    emptyState: { alignItems: "center", justifyContent: "center", marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    emptySubText: { fontSize: 14, textAlign: "center", opacity: 0.7, paddingHorizontal: 40 },
    budgetCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    budgetHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    budgetType: { fontSize: 16, fontWeight: "bold" },
    budgetPeriod: { fontSize: 12, marginTop: 2 },
    categoryBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
    budgetAmountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 },
    amountLabel: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
    budgetAmount: { fontSize: 22, fontWeight: "800" },
    dualAmountRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
    dateRangeRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
    blockingBadge: { backgroundColor: "#FF4D4D20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    blockingText: { color: "#FF4D4D", fontSize: 10, fontWeight: "bold" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { height: height * 0.85, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: "bold" },
    formSection: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
    dropdown: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
    input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
    toggleRow: { flexDirection: "row", gap: 10 },
    toggleBtn: { flex: 1, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
    toggleText: { fontSize: 12, fontWeight: "600" },
    blockingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#E2E8F0", justifyContent: "center", alignItems: "center" },
    blockingLabel: { fontSize: 14, fontWeight: "600" },
    createBtn: { height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginTop: 20, marginBottom: 40 },
    createBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" }
})
