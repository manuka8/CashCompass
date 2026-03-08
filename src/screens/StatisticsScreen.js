import React, { useState, useContext, useEffect, useMemo } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Alert,
    Platform
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { ThemeContext } from "../context/ThemeContext"
import { AuthContext } from "../context/AuthContext"
import { getCurrencySymbol } from "../utils/constants"
import { supabase } from "../services/supabase"
import { LineChart, BarChart } from "react-native-chart-kit"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"

const { width } = Dimensions.get("window")

const TABS = ["Yearly", "Monthly", "Weekly", "Daily"]

export default function StatisticsScreen() {
    const { theme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)
    const navigation = useNavigation()
    const [selectedTab, setSelectedTab] = useState("Monthly")
    const [loading, setLoading] = useState(true)
    const [transactions, setTransactions] = useState([])

    const currencySymbol = getCurrencySymbol(user?.user_metadata?.currency)

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("date", { ascending: true })

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error("Error fetching transactions:", error)
            Alert.alert("Error", "Could not fetch transaction data.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const statsData = useMemo(() => {
        if (!transactions.length) return null

        const now = new Date()
        let filtered = []
        let labels = []
        let incomeData = []
        let expenseData = []

        if (selectedTab === "Yearly") {
            // Last 12 months
            const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
            filtered = transactions.filter(t => new Date(t.date) >= yearAgo)

            // Group by month
            const months = []
            for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
                const monthName = d.toLocaleString('default', { month: 'short' })
                months.push({ name: monthName, income: 0, expense: 0, date: d })
            }

            filtered.forEach(t => {
                const tDate = new Date(t.date)
                const mIdx = months.findIndex(m => m.date.getMonth() === tDate.getMonth() && m.date.getFullYear() === tDate.getFullYear())
                if (mIdx !== -1) {
                    if (t.type === "Income") months[mIdx].income += parseFloat(t.amount)
                    else if (t.type === "Expense") months[mIdx].expense += parseFloat(t.amount)
                }
            })
            labels = months.map(m => m.name)
            incomeData = months.map(m => m.income)
            expenseData = months.map(m => m.expense)

        } else if (selectedTab === "Monthly") {
            // Current month grouped by weeks (approx)
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            filtered = transactions.filter(t => new Date(t.date) >= startOfMonth)

            const weeks = [
                { name: "W1", income: 0, expense: 0 },
                { name: "W2", income: 0, expense: 0 },
                { name: "W3", income: 0, expense: 0 },
                { name: "W4", income: 0, expense: 0 },
                { name: "W5", income: 0, expense: 0 },
            ]

            filtered.forEach(t => {
                const day = new Date(t.date).getDate()
                const weekIdx = Math.min(Math.floor((day - 1) / 7), 4)
                if (t.type === "Income") weeks[weekIdx].income += parseFloat(t.amount)
                else if (t.type === "Expense") weeks[weekIdx].expense += parseFloat(t.amount)
            })
            labels = weeks.map(w => w.name)
            incomeData = weeks.map(w => w.income)
            expenseData = weeks.map(w => w.expense)

        } else if (selectedTab === "Weekly") {
            // Last 7 days
            const weekAgo = new Date()
            weekAgo.setDate(now.getDate() - 6)
            weekAgo.setHours(0, 0, 0, 0)
            filtered = transactions.filter(t => new Date(t.date) >= weekAgo)

            const days = []
            for (let i = 0; i < 7; i++) {
                const d = new Date(weekAgo)
                d.setDate(weekAgo.getDate() + i)
                days.push({ name: d.toLocaleString('default', { weekday: 'short' }), income: 0, expense: 0, date: d })
            }

            filtered.forEach(t => {
                const tDate = new Date(t.date)
                const dIdx = days.findIndex(d => d.date.toDateString() === tDate.toDateString())
                if (dIdx !== -1) {
                    if (t.type === "Income") days[dIdx].income += parseFloat(t.amount)
                    else if (t.type === "Expense") days[dIdx].expense += parseFloat(t.amount)
                }
            })
            labels = days.map(d => d.name)
            incomeData = days.map(d => d.income)
            expenseData = days.map(d => d.expense)

        } else if (selectedTab === "Daily") {
            // Current day stats
            const todayStr = now.toISOString().split('T')[0]
            filtered = transactions.filter(t => t.date === todayStr)

            // For bar chart, we might show categories or just income/expense
            labels = ["Income", "Expense"]
            const income = filtered.reduce((sum, t) => t.type === "Income" ? sum + parseFloat(t.amount) : sum, 0)
            const expense = filtered.reduce((sum, t) => t.type === "Expense" ? sum + parseFloat(t.amount) : sum, 0)
            incomeData = [income]
            expenseData = [expense]
        }

        // Calculate highest/lowest within filtered range
        const expenses = filtered.filter(t => t.type === "Expense")
        const incomes = filtered.filter(t => t.type === "Income")

        const highestExpense = expenses.length ? expenses.reduce((prev, curr) => parseFloat(curr.amount) > parseFloat(prev.amount) ? curr : prev) : null
        const lowestExpense = expenses.length ? expenses.reduce((prev, curr) => parseFloat(curr.amount) < parseFloat(prev.amount) ? curr : prev) : null

        const highestIncome = incomes.length ? incomes.reduce((prev, curr) => parseFloat(curr.amount) > parseFloat(prev.amount) ? curr : prev) : null
        const lowestIncome = incomes.length ? incomes.reduce((prev, curr) => parseFloat(curr.amount) < parseFloat(prev.amount) ? curr : prev) : null

        return {
            labels,
            incomeData,
            expenseData,
            highestExpense,
            lowestExpense,
            highestIncome,
            lowestIncome,
            filtered
        }
    }, [transactions, selectedTab])

    const generatePDF = async () => {
        if (!statsData) return

        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                        h1 { color: #2C3E50; text-align: center; }
                        .summary { margin-top: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                        .stat-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .label { font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        .income { color: #2ecc71; }
                        .expense { color: #e74c3c; }
                    </style>
                </head>
                <body>
                    <h1>CashCompass - ${selectedTab} Report</h1>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    
                    <div class="summary">
                        <h3>Statistical Highlights</h3>
                        <div class="stat-item">
                            <span class="label">Highest Expense:</span>
                            <span>${statsData.highestExpense ? `${currencySymbol}${statsData.highestExpense.amount} (${statsData.highestExpense.date})` : 'N/A'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Highest Income:</span>
                            <span>${statsData.highestIncome ? `${currencySymbol}${statsData.highestIncome.amount} (${statsData.highestIncome.date})` : 'N/A'}</span>
                        </div>
                    </div>

                    <h3>Transaction Details</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${statsData.filtered.map(t => `
                                <tr>
                                    <td>${t.date}</td>
                                    <td>${t.category}</td>
                                    <td class="${t.type.toLowerCase()}">${t.type}</td>
                                    <td>${currencySymbol}${parseFloat(t.amount).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `

        try {
            const { uri } = await Print.printToFileAsync({ html })
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
        } catch (error) {
            console.error("PDF generation error:", error)
            Alert.alert("Error", "Could not generate PDF report.")
        }
    }

    const chartConfig = {
        backgroundGradientFrom: theme.card,
        backgroundGradientTo: theme.card,
        color: (opacity = 1) => theme.primary,
        labelColor: (opacity = 1) => theme.subtext,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: theme.primary
        }
    }

    const renderChart = () => {
        if (!statsData || statsData.labels.length === 0) {
            return (
                <View style={[styles.emptyChart, { backgroundColor: theme.card }]}>
                    <Text style={{ color: theme.subtext }}>No data available for this period</Text>
                </View>
            )
        }

        if (selectedTab === "Daily") {
            return (
                <BarChart
                    data={{
                        labels: statsData.labels,
                        datasets: [{ data: [statsData.incomeData[0] || 0, statsData.expenseData[0] || 0] }]
                    }}
                    width={width - 70}
                    height={220}
                    chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1, index) => index === 0 ? `rgba(46, 204, 113, ${opacity})` : `rgba(231, 76, 60, ${opacity})`,
                    }}
                    style={styles.chart}
                    fromZero={true}
                    showValuesOnTopOfBars={true}
                />
            )
        }

        return (
            <LineChart
                data={{
                    labels: statsData.labels,
                    datasets: [
                        {
                            data: statsData.incomeData,
                            color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`, // Income Green
                            strokeWidth: 2
                        },
                        {
                            data: statsData.expenseData,
                            color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`, // Expense Red
                            strokeWidth: 2
                        }
                    ],
                    legend: ["Incomes", "Expenses"]
                }}
                width={width - 70}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                fromZero={true}
            />
        )
    }

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        )
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.iconBtn}>
                    <Text style={{ fontSize: 24, color: theme.text }}>☰</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Statistics</Text>
                <TouchableOpacity onPress={generatePDF} style={styles.downloadBtn}>
                    <Text style={{ fontSize: 20 }}>📥</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setSelectedTab(tab)}
                        style={[
                            styles.tabItem,
                            selectedTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 3 }
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: selectedTab === tab ? theme.primary : theme.subtext }
                        ]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        {selectedTab} Overview
                    </Text>
                    {renderChart()}
                </View>

                {statsData && (
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Highest Income"
                            item={statsData.highestIncome}
                            color="#2ecc71"
                            theme={theme}
                            currency={currencySymbol}
                        />
                        <StatCard
                            title="Lowest Income"
                            item={statsData.lowestIncome}
                            color="#2ecc71"
                            theme={theme}
                            currency={currencySymbol}
                        />
                        <StatCard
                            title="Highest Expense"
                            item={statsData.highestExpense}
                            color="#e74c3c"
                            theme={theme}
                            currency={currencySymbol}
                        />
                        <StatCard
                            title="Lowest Expense"
                            item={statsData.lowestExpense}
                            color="#e74c3c"
                            theme={theme}
                            currency={currencySymbol}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const StatCard = ({ title, item, color, theme, currency }) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.statTitle, { color: theme.subtext }]}>{title}</Text>
        {item ? (
            <>
                <Text style={[styles.statValue, { color }]}>{currency}{parseFloat(item.amount).toFixed(0)}</Text>
                <Text style={[styles.statDate, { color: theme.subtext }]}>{item.date}</Text>
            </>
        ) : (
            <Text style={[styles.statValue, { color: theme.subtext, fontSize: 16 }]}>N/A</Text>
        )}
    </View>
)

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
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
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    iconBtn: {
        padding: 5,
    },
    downloadBtn: {
        padding: 5,
    },
    tabBar: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "transparent",
        marginTop: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
    },
    tabText: {
        fontWeight: "bold",
        fontSize: 14,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    chartContainer: {
        padding: 15,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    emptyChart: {
        height: 220,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    statCard: {
        width: (width - 60) / 2,
        padding: 16,
        borderRadius: 20,
        marginBottom: 15,
        minHeight: 110,
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    statTitle: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 5,
    },
    statValue: {
        fontSize: 20,
        fontWeight: "bold",
    },
    statDate: {
        fontSize: 10,
        marginTop: 5,
    }
})
