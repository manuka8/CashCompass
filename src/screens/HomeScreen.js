import React, { useState, useContext, useEffect, useCallback } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    StatusBar,
    Alert
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Svg, { G, Circle } from "react-native-svg"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { ThemeContext, THEMES } from "../context/ThemeContext"
import { AuthContext } from "../context/AuthContext"
import { getCurrencySymbol } from "../utils/constants"
import { supabase } from "../services/supabase"

const { width } = Dimensions.get("window")

export default function HomeScreen() {
    const { theme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)
    const navigation = useNavigation()
    const [viewType, setViewType] = useState("Monthly") // Daily, Weekly, Monthly, Yearly
    const [loading, setLoading] = useState(true)
    const [transactions, setTransactions] = useState([])
    const [recentTransactions, setRecentTransactions] = useState([])
    const [budgets, setBudgets] = useState([])
    const [budgetStats, setBudgetStats] = useState([])
    const [totals, setTotals] = useState({
        income: 0,
        expense: 0,
        transfer: 0,
        balance: 0
    })

    const currencySymbol = getCurrencySymbol(user?.user_metadata?.currency)

    // Helper to get local YYYY-MM-DD
    const getLocalDateString = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Dynamic Totals calculation based on transactions
    const calculateTotals = (data) => {
        let income = 0
        let expense = 0
        let transfer = 0

        data.forEach(t => {
            const amt = parseFloat(t.amount) || 0
            if (t.type === "Income") income += amt
            else if (t.type === "Expense") expense += amt
            else if (t.type === "Transfer") transfer += amt
        })

        setTotals({
            income,
            expense,
            transfer,
            balance: income - expense - transfer
        })
    }

    const fetchHomeData = useCallback(async () => {
        setLoading(true)
        try {
            const now = new Date()
            let startDate = new Date()

            if (viewType === "Daily") {
                startDate.setHours(0, 0, 0, 0)
            } else if (viewType === "Weekly") {
                startDate.setDate(now.getDate() - 7)
            } else if (viewType === "Monthly") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            } else if (viewType === "Yearly") {
                startDate = new Date(now.getFullYear(), 0, 1)
            }

            // Fetch transactions for the period
            const { data: periodTrans, error: periodError } = await supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)
                .gte("date", getLocalDateString(startDate))
                .order("date", { ascending: false })

            if (periodError) throw periodError
            setTransactions(periodTrans || [])
            calculateTotals(periodTrans || [])

            // Fetch last 5 recent transactions (regardless of period)
            const { data: recent, error: recentError } = await supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("date", { ascending: false })
                .order("time", { ascending: false })
                .limit(5)

            if (recentError) throw recentError
            setRecentTransactions(recent || [])

        } catch (error) {
            console.error("Error fetching home data:", error)
        } finally {
            setLoading(false)
        }
    }, [viewType, user.id])

    // Use useFocusEffect to refresh when the screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchHomeData()
        }, [fetchHomeData])
    )

    // Chart Logic
    const totalActivity = totals.income + totals.expense + totals.transfer
    const incomePercent = totalActivity > 0 ? (totals.income / totalActivity) : 0
    const expensePercent = totalActivity > 0 ? (totals.expense / totalActivity) : 0
    const transferPercent = totalActivity > 0 ? (totals.transfer / totalActivity) : 0

    const size = 180
    const strokeWidth = 15
    const center = size / 2
    const radius = center - strokeWidth
    const circumference = 2 * Math.PI * radius

    // Individual offsets and rotations for a multi-color doughnut
    // Segments are handled by rotating each segments start point
    const incomeStroke = circumference * (1 - incomePercent) || circumference
    const expenseStroke = circumference * (1 - expensePercent) || circumference
    const transferStroke = circumference * (1 - transferPercent) || circumference

    const incomeRotation = -90
    const expenseRotation = incomeRotation + (incomePercent * 360)
    const transferRotation = expenseRotation + (expensePercent * 360)

    const fetchBudgetsAndSpending = useCallback(async () => {
        setLoading(true)
        // Fetch budgets
        const { data: budgetData } = await supabase
            .from("budgets")
            .select("*")
            .eq("user_id", user.id)

        if (!budgetData) {
            setLoading(false)
            return
        }

        const stats = []
        for (let b of budgetData) {
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

            // Calculate percentages for both if they exist
            let maxPercent = b.max_amount ? Math.min((currentTotal / b.max_amount) * 100, 100) : 0
            let minPercent = b.min_amount ? Math.min((currentTotal / b.min_amount) * 100, 100) : 0

            stats.push({
                ...b,
                currentTotal,
                maxPercent,
                minPercent
            })
        }
        setBudgets(budgetData)
        setBudgetStats(stats)
        setLoading(false)
    }, [user.id])

    useFocusEffect(
        useCallback(() => {
            fetchBudgetsAndSpending()
        }, [fetchBudgetsAndSpending])
    )

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} />

            {/* Top Navigation Bar */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.iconBtn}>
                        <Text style={{ fontSize: 24, color: theme.text }}>☰</Text>
                    </TouchableOpacity>
                    <Image source={theme.logo} style={styles.logo} resizeMode="contain" />
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.notificationBtn}
                        onPress={() => navigation.navigate("Notifications")}
                    >
                        <Text style={{ fontSize: 20 }}>🔔</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.profileContainer}
                        onPress={() => navigation.navigate("Settings")}
                    >
                        <View style={[styles.profilePic, { backgroundColor: theme.primary }]}>
                            <Text style={styles.profileInitial}>
                                {user?.user_metadata?.full_name?.charAt(0) || "U"}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Hero Section - Summary Cards */}
                <View style={styles.heroSection}>
                    <View style={[styles.balanceCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.cardLabel, { color: theme.subtext }]}>Total Balance</Text>
                        <Text style={[styles.balanceText, { color: theme.text }]}>
                            {currencySymbol}{totals.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Text>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={[styles.statsCardShort, { backgroundColor: theme.card }]}>
                            <View style={[styles.statsIcon, { backgroundColor: "rgba(46, 204, 113, 0.1)" }]}>
                                <Text style={{ color: "#2ECC71" }}>↓</Text>
                            </View>
                            <View>
                                <Text style={[styles.statsLabel, { color: theme.subtext }]}>Income</Text>
                                <Text style={[styles.statsValue, { color: "#2ECC71" }]}>{currencySymbol}{totals.income.toFixed(0)}</Text>
                            </View>
                        </View>
                        <View style={[styles.statsCardShort, { backgroundColor: theme.card }]}>
                            <View style={[styles.statsIcon, { backgroundColor: "rgba(231, 76, 60, 0.1)" }]}>
                                <Text style={{ color: "#E74C6C" }}>↑</Text>
                            </View>
                            <View>
                                <Text style={[styles.statsLabel, { color: theme.subtext }]}>Expense</Text>
                                <Text style={[styles.statsValue, { color: "#E74C6C" }]}>{currencySymbol}{totals.expense.toFixed(0)}</Text>
                            </View>
                        </View>
                        <View style={[styles.statsCardShort, { backgroundColor: theme.card, marginTop: 12 }]}>
                            <View style={[styles.statsIcon, { backgroundColor: "rgba(52, 152, 219, 0.1)" }]}>
                                <Text style={{ color: "#3498DB" }}>⇄</Text>
                            </View>
                            <View>
                                <Text style={[styles.statsLabel, { color: theme.subtext }]}>Transfer</Text>
                                <Text style={[styles.statsValue, { color: "#3498DB" }]}>{currencySymbol}{totals.transfer.toFixed(0)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Analytics Section - Doughnut Chart */}
                <View style={styles.analyticsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>Budget Status</Text>
                    {budgetStats.length === 0 ? (
                        <TouchableOpacity
                            style={[styles.emptyBudgetCard, { borderColor: theme.border }]}
                            onPress={() => navigation.navigate("BudgetPlanner")}
                        >
                            <Text style={[styles.emptyBudgetText, { color: theme.subtext }]}>No budgets set. Tap to start planning.</Text>
                        </TouchableOpacity>
                    ) : (
                        budgetStats.map(stat => (
                            <View key={stat.id} style={[styles.budgetStatCard, { backgroundColor: theme.card }]}>
                                <View style={styles.budgetStatHeader}>
                                    <Text style={[styles.budgetStatTitle, { color: theme.text }]}>
                                        {stat.type === "Category" ? stat.category : stat.type} ({stat.period})
                                    </Text>
                                    <Text style={[styles.budgetStatAmount, { color: theme.text }]}>
                                        {currencySymbol}{stat.currentTotal.toFixed(0)}
                                    </Text>
                                </View>

                                {stat.min_amount && (
                                    <View style={styles.limitRow}>
                                        <Text style={[styles.limitLabel, { color: theme.subtext }]}>Goal: {currencySymbol}{stat.min_amount}</Text>
                                        <View style={[styles.progressBarBg, { backgroundColor: theme.border, height: 6 }]}>
                                            <View style={[
                                                styles.progressBarFill,
                                                { width: `${stat.minPercent}%`, backgroundColor: stat.minPercent >= 100 ? "#2ECC71" : "#F1C40F" }
                                            ]} />
                                        </View>
                                    </View>
                                )}

                                {stat.max_amount && (
                                    <View style={[styles.limitRow, { marginTop: 8 }]}>
                                        <Text style={[styles.limitLabel, { color: theme.subtext }]}>Limit: {currencySymbol}{stat.max_amount}</Text>
                                        <View style={[styles.progressBarBg, { backgroundColor: theme.border, height: 6 }]}>
                                            <View style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${stat.maxPercent}%`,
                                                    backgroundColor: stat.maxPercent > 90 ? "#E74C6C" : stat.maxPercent > 70 ? "#F1C40F" : theme.primary
                                                }
                                            ]} />
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.analyticsSection}>
                    <View style={styles.analyticsHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Analytics</Text>
                        <View style={[styles.toggleContainer, { backgroundColor: theme.border }]}>
                            {["Daily", "Weekly", "Monthly", "Yearly"].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setViewType(type)}
                                    style={[
                                        styles.toggleBtn,
                                        viewType === type && { backgroundColor: theme.primary }
                                    ]}
                                >
                                    <Text style={[
                                        styles.toggleBtnText,
                                        { color: viewType === type ? "#FFF" : theme.subtext }
                                    ]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                        <View style={styles.chartWrapper}>
                            <Svg width={size} height={size}>
                                <G rotation="-90" origin={`${center}, ${center}`}>
                                    {/* Background Circle */}
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        stroke={theme.border}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    {/* Income Segment */}
                                    {totalActivity > 0 && incomePercent > 0 && (
                                        <G rotation={incomeRotation} origin={`${center}, ${center}`}>
                                            <Circle
                                                cx={center}
                                                cy={center}
                                                r={radius}
                                                stroke="#2ECC71"
                                                strokeWidth={strokeWidth}
                                                fill="none"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={incomeStroke}
                                                strokeLinecap="round"
                                            />
                                        </G>
                                    )}
                                    {/* Expense Segment */}
                                    {totalActivity > 0 && expensePercent > 0 && (
                                        <G rotation={expenseRotation} origin={`${center}, ${center}`}>
                                            <Circle
                                                cx={center}
                                                cy={center}
                                                r={radius}
                                                stroke="#E74C6C"
                                                strokeWidth={strokeWidth}
                                                fill="none"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={expenseStroke}
                                                strokeLinecap="round"
                                            />
                                        </G>
                                    )}
                                    {/* Transfer Segment */}
                                    {totalActivity > 0 && transferPercent > 0 && (
                                        <G rotation={transferRotation} origin={`${center}, ${center}`}>
                                            <Circle
                                                cx={center}
                                                cy={center}
                                                r={radius}
                                                stroke="#3498DB"
                                                strokeWidth={strokeWidth}
                                                fill="none"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={transferStroke}
                                                strokeLinecap="round"
                                            />
                                        </G>
                                    )}
                                </G>
                            </Svg>
                            <View style={styles.chartOverlay}>
                                <Text style={[styles.chartPercentage, { color: theme.text }]}>
                                    {totalActivity > 0 ? "Totals" : "0%"}
                                </Text>
                                <Text style={[styles.chartLabel, { color: theme.subtext }]}>
                                    {viewType} Overview
                                </Text>
                            </View>
                        </View>

                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#2ECC71" }]} />
                                <Text style={[styles.legendText, { color: theme.text }]}>Income ({(incomePercent * 100).toFixed(0)}%)</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#E74C6C" }]} />
                                <Text style={[styles.legendText, { color: theme.text }]}>Expense ({(expensePercent * 100).toFixed(0)}%)</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#3498DB" }]} />
                                <Text style={[styles.legendText, { color: theme.text }]}>Transfer ({(transferPercent * 100).toFixed(0)}%)</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Recent Transactions Section */}
                <View style={styles.recentTransactionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Records")}>
                            <Text style={[styles.seeMoreBtn, { color: theme.primary }]}>See More</Text>
                        </TouchableOpacity>
                    </View>

                    {recentTransactions.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                            <Text style={{ color: theme.subtext }}>No transactions yet.</Text>
                        </View>
                    ) : (
                        recentTransactions.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.transactionItem, { backgroundColor: theme.card }]}
                                onPress={() => navigation.navigate("RecordDetail", { record: item })}
                            >
                                <View style={styles.transactionLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: theme.primary + "15" }]}>
                                        <Text style={{ fontSize: 18 }}>📝</Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.transactionCategory, { color: theme.text }]}>{item.category}</Text>
                                        <Text style={[styles.transactionDate, { color: theme.subtext }]}>{item.date}</Text>
                                    </View>
                                </View>
                                <Text style={[
                                    styles.transactionAmount,
                                    { color: (item.type === "Expense" || item.type === "Transfer") ? "#E74C6C" : "#2ECC71" }
                                ]}>
                                    {(item.type === "Expense" || item.type === "Transfer") ? "-" : "+"}{currencySymbol}{parseFloat(item.amount).toFixed(2)}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

            </ScrollView>

            {/* Floating Action Button (FAB) */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate("AddExpense")}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        paddingTop: 5,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    logo: {
        width: 150,
        height: 50,
        marginLeft: 12,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconBtn: {
        padding: 8,
    },
    profileContainer: {
        marginLeft: 8,
    },
    profilePic: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    profileInitial: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    heroSection: {
        marginBottom: 24,
    },
    balanceCard: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    balanceText: {
        fontSize: 32,
        fontWeight: "bold",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    statsCardShort: {
        width: (width - 55) / 2,
        padding: 16,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    statsIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    statsLabel: {
        fontSize: 11,
        fontWeight: "600",
    },
    statsValue: {
        fontSize: 15,
        fontWeight: "bold",
    },
    analyticsSection: {
        marginTop: 8,
    },
    analyticsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    toggleContainer: {
        flexDirection: "row",
        padding: 4,
        borderRadius: 12,
    },
    toggleBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    toggleBtnText: {
        fontSize: 12,
        fontWeight: "700",
    },
    emptyBudgetCard: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        backgroundColor: "transparent",
    },
    emptyBudgetText: {
        fontSize: 14,
        textAlign: "center",
        opacity: 0.8,
    },
    budgetStatCard: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        marginTop: 10,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    budgetStatHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
        alignItems: "center",
    },
    budgetStatTitle: {
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    budgetStatAmount: {
        fontSize: 13,
        fontWeight: "800",
    },
    progressBarBg: {
        height: 10,
        borderRadius: 5,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 5,
    },
    limitRow: {
        width: "100%",
    },
    limitLabel: {
        fontSize: 10,
        fontWeight: "600",
        marginBottom: 4,
    },
    chartCard: {
        padding: 24,
        borderRadius: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    chartWrapper: {
        width: 180,
        height: 180,
        justifyContent: "center",
        alignItems: "center",
    },
    chartOverlay: {
        position: "absolute",
        alignItems: "center",
    },
    chartPercentage: {
        fontSize: 28,
        fontWeight: "bold",
    },
    chartLabel: {
        fontSize: 12,
    },
    chartLegend: {
        flexDirection: "row",
        marginTop: 24,
        width: "100%",
        justifyContent: "center",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 12,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: "600",
    },
    fab: {
        position: "absolute",
        bottom: 30,
        right: 30,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#2ECC71",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    fabIcon: {
        fontSize: 32,
        color: "#FFF",
        fontWeight: "300",
    },
    recentTransactionsSection: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    seeMoreBtn: {
        fontSize: 14,
        fontWeight: "700",
    },
    transactionItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    transactionLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    transactionCategory: {
        fontSize: 15,
        fontWeight: "bold",
    },
    transactionDate: {
        fontSize: 11,
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: "bold",
    },
    emptyState: {
        padding: 30,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    }
})
