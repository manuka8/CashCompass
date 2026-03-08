import React, { useState, useContext, useEffect, useCallback } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    StatusBar,
    ActivityIndicator,
    TextInput,
    Modal,
    Dimensions,
    ScrollView
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { Dropdown } from "react-native-element-dropdown"
import { ThemeContext } from "../context/ThemeContext"
import { TRANSACTION_CATEGORIES, TRANSACTION_TYPES, getCurrencySymbol } from "../utils/constants"
import { supabase } from "../services/supabase"
import { AuthContext } from "../context/AuthContext"

const { height } = Dimensions.get("window")

export default function RecordScreen() {
    const { theme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)
    const navigation = useNavigation()

    const currencySymbol = getCurrencySymbol(user?.user_metadata?.currency)

    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Filters
    const [showFilters, setShowFilters] = useState(false)
    const [filterType, setFilterType] = useState(null)
    const [filterCategory, setFilterCategory] = useState(null)
    const [filterSubCategory, setFilterSubCategory] = useState(null)
    const [minAmount, setMinAmount] = useState("")
    const [maxAmount, setMaxAmount] = useState("")
    const [dateRange, setDateRange] = useState("All") // All, Today, Month, Year

    const [availableSubCategories, setAvailableSubCategories] = useState([])

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("date", { ascending: false })
                .order("time", { ascending: false })

            if (filterType) query = query.eq("type", filterType)
            if (filterCategory) query = query.eq("category", filterCategory)
            if (filterSubCategory) query = query.eq("sub_category", filterSubCategory)
            if (minAmount) query = query.gte("amount", parseFloat(minAmount))
            if (maxAmount) query = query.lte("amount", parseFloat(maxAmount))

            const now = new Date()
            if (dateRange === "Today") {
                const today = now.toISOString().split('T')[0]
                query = query.eq("date", today)
            } else if (dateRange === "Month") {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                query = query.gte("date", firstDay)
            } else if (dateRange === "Year") {
                const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
                query = query.gte("date", firstDay)
            }

            const { data, error } = await query

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error("Error fetching transactions:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchTransactions()
        }, [filterType, filterCategory, filterSubCategory, dateRange, minAmount, maxAmount])
    )

    const onRefresh = () => {
        setRefreshing(true)
        fetchTransactions()
    }

    const resetFilters = () => {
        setFilterType(null)
        setFilterCategory(null)
        setFilterSubCategory(null)
        setMinAmount("")
        setMaxAmount("")
        setDateRange("All")
        setAvailableSubCategories([])
        setShowFilters(false)
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.recordCard, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate("RecordDetail", { record: item })}
        >
            <View style={styles.recordLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.primary + "20" }]}>
                    <Text style={styles.recordIcon}>📝</Text>
                </View>
                <View>
                    <Text style={[styles.recordCategory, { color: theme.text }]}>{item.category}</Text>
                    <Text style={[styles.recordSub, { color: theme.subtext }]}>{item.sub_category}</Text>
                </View>
            </View>
            <View style={styles.recordRight}>
                <Text style={[
                    styles.recordAmount,
                    { color: (item.type === "Expense" || item.type === "Transfer") ? "#E74C6C" : "#2ECC71" }
                ]}>
                    {(item.type === "Expense" || item.type === "Transfer") ? "-" : "+"}{currencySymbol}{item.amount.toFixed(2)}
                </Text>
                <Text style={[styles.recordDate, { color: theme.subtext }]}>{item.date}</Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Text style={{ fontSize: 24, color: theme.text }}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Transactions</Text>
                <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.iconBtn}>
                    <Text style={{ fontSize: 20 }}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Date Range Quick Filter */}
            <View style={styles.quickFilter}>
                {["All", "Today", "Month", "Year"].map((range) => (
                    <TouchableOpacity
                        key={range}
                        style={[
                            styles.quickTab,
                            dateRange === range && { backgroundColor: theme.primary }
                        ]}
                        onPress={() => setDateRange(range)}
                    >
                        <Text style={[
                            styles.quickTabText,
                            { color: dateRange === range ? "#FFF" : theme.subtext }
                        ]}>
                            {range}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={{ color: theme.subtext, fontSize: 16 }}>No transactions found</Text>
                        </View>
                    }
                />
            )}

            {/* Filter Modal */}
            <Modal
                visible={showFilters}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilters(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Filters</Text>
                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <Text style={{ color: theme.primary, fontWeight: "bold" }}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.filterSection}>
                                <Text style={[styles.filterLabel, { color: theme.subtext }]}>Type</Text>
                                <Dropdown
                                    style={[styles.dropdown, { borderColor: theme.border }]}
                                    placeholderStyle={{ color: theme.subtext }}
                                    selectedTextStyle={{ color: theme.text }}
                                    data={TRANSACTION_TYPES}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="All Types"
                                    value={filterType}
                                    onChange={item => setFilterType(item.value)}
                                />
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={[styles.filterLabel, { color: theme.subtext }]}>Category</Text>
                                <Dropdown
                                    style={[styles.dropdown, { borderColor: theme.border }]}
                                    placeholderStyle={{ color: theme.subtext }}
                                    selectedTextStyle={{ color: theme.text }}
                                    data={TRANSACTION_CATEGORIES}
                                    search
                                    labelField="label"
                                    valueField="value"
                                    placeholder="All Categories"
                                    value={filterCategory}
                                    onChange={item => {
                                        setFilterCategory(item.value)
                                        setAvailableSubCategories(item.subCategories || [])
                                    }}
                                />
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={[styles.filterLabel, { color: theme.subtext }]}>Sub-category</Text>
                                <Dropdown
                                    style={[styles.dropdown, { borderColor: theme.border }]}
                                    placeholderStyle={{ color: theme.subtext }}
                                    selectedTextStyle={{ color: theme.text }}
                                    data={availableSubCategories}
                                    search
                                    labelField="label"
                                    valueField="value"
                                    placeholder="All Sub-categories"
                                    value={filterSubCategory}
                                    onChange={item => setFilterSubCategory(item.value)}
                                    disable={!filterCategory}
                                />
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={[styles.filterLabel, { color: theme.subtext }]}>Amount Range</Text>
                                <View style={styles.rangeRow}>
                                    <TextInput
                                        style={[styles.rangeInput, { color: theme.text, borderColor: theme.border }]}
                                        placeholder="Min"
                                        placeholderTextColor={theme.subtext}
                                        keyboardType="numeric"
                                        value={minAmount}
                                        onChangeText={setMinAmount}
                                    />
                                    <Text style={{ color: theme.subtext, marginHorizontal: 10 }}>to</Text>
                                    <TextInput
                                        style={[styles.rangeInput, { color: theme.text, borderColor: theme.border }]}
                                        placeholder="Max"
                                        placeholderTextColor={theme.subtext}
                                        keyboardType="numeric"
                                        value={maxAmount}
                                        onChangeText={setMaxAmount}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.resetBtn, { borderColor: theme.primary }]}
                                onPress={resetFilters}
                            >
                                <Text style={{ color: theme.primary, fontWeight: "bold" }}>Reset Filters</Text>
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
    quickFilter: {
        flexDirection: "row",
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    quickTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    quickTabText: { fontWeight: "600", fontSize: 13 },
    listContent: { padding: 20, paddingBottom: 100 },
    recordCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    recordLeft: { flexDirection: "row", alignItems: "center" },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    recordIcon: { fontSize: 20 },
    recordCategory: { fontSize: 16, fontWeight: "bold" },
    recordSub: { fontSize: 12, marginTop: 2 },
    recordRight: { alignItems: "flex-end" },
    recordAmount: { fontSize: 16, fontWeight: "700" },
    recordDate: { fontSize: 11, marginTop: 4 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        height: height * 0.7,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: "bold" },
    filterSection: { marginBottom: 20 },
    filterLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
    dropdown: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    rangeRow: { flexDirection: "row", alignItems: "center" },
    rangeInput: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        textAlign: "center",
    },
    resetBtn: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 30,
    }
})
