import React, { useState, useContext } from "react"
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    StatusBar,
    Alert
} from "react-native"
import Svg, { G, Circle } from "react-native-svg"
import { useNavigation } from "@react-navigation/native"
import { ThemeContext, THEMES } from "../context/ThemeContext"
import { AuthContext } from "../context/AuthContext"
import { getCurrencySymbol } from "../utils/constants"

const { width } = Dimensions.get("window")

export default function HomeScreen() {
    const { theme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)
    const navigation = useNavigation()
    const [viewType, setViewType] = useState("Daily") // Daily or Monthly

    const currencySymbol = getCurrencySymbol(user?.user_metadata?.currency)

    // Dummy Data
    const stats = {
        balance: `${currencySymbol}12,450.00`,
        income: `${currencySymbol}4,200.00`,
        expense: `${currencySymbol}1,850.00`
    }

    // Chart Logic (Simplified Doughnut using SVG)
    const size = 180
    const strokeWidth = 15
    const center = size / 2
    const radius = center - strokeWidth
    const circumference = 2 * Math.PI * radius
    const expensePercentage = 0.44 // Example ratio
    const strokeDashoffset = circumference * (1 - expensePercentage)

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
                    <TouchableOpacity style={styles.iconBtn}>
                        <Text style={{ fontSize: 20 }}>🔔</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileContainer}>
                        <View style={[styles.profilePic, { backgroundColor: theme.primary }]}>
                            <Text style={styles.profileInitial}>U</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Hero Section - Summary Cards */}
                <View style={styles.heroSection}>
                    <View style={[styles.balanceCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.cardLabel, { color: theme.subtext }]}>Total Balance</Text>
                        <Text style={[styles.balanceText, { color: theme.text }]}>{stats.balance}</Text>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
                            <View style={[styles.statsIcon, { backgroundColor: "rgba(46, 204, 113, 0.1)" }]}>
                                <Text style={{ color: "#2ECC71" }}>↓</Text>
                            </View>
                            <View>
                                <Text style={[styles.statsLabel, { color: theme.subtext }]}>Income</Text>
                                <Text style={[styles.statsValue, { color: theme.text }]}>{stats.income}</Text>
                            </View>
                        </View>
                        <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
                            <View style={[styles.statsIcon, { backgroundColor: "rgba(231, 76, 60, 0.1)" }]}>
                                <Text style={{ color: "#E74C6C" }}>↑</Text>
                            </View>
                            <View>
                                <Text style={[styles.statsLabel, { color: theme.subtext }]}>Expense</Text>
                                <Text style={[styles.statsValue, { color: theme.text }]}>{stats.expense}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Analytics Section - Doughnut Chart */}
                <View style={styles.analyticsSection}>
                    <View style={styles.analyticsHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Analytics</Text>
                        <View style={[styles.toggleContainer, { backgroundColor: theme.border }]}>
                            {["Daily", "Monthly"].map((type) => (
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
                                    {/* Foreground Circle (Expense) */}
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        stroke={theme.primary}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                </G>
                            </Svg>
                            <View style={styles.chartOverlay}>
                                <Text style={[styles.chartPercentage, { color: theme.text }]}>44%</Text>
                                <Text style={[styles.chartLabel, { color: theme.subtext }]}>Expense Ratio</Text>
                            </View>
                        </View>

                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                                <Text style={[styles.legendText, { color: theme.text }]}>Income (56%)</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#E2E8F0" }]} />
                                <Text style={[styles.legendText, { color: theme.text }]}>Expense (44%)</Text>
                            </View>
                        </View>
                    </View>
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
        width: 120,
        height: 30,
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
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statsCard: {
        flex: 0.48,
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
        marginRight: 12,
    },
    statsLabel: {
        fontSize: 12,
        fontWeight: "600",
    },
    statsValue: {
        fontSize: 16,
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
    }
})
