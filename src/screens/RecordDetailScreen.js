import React, { useContext } from "react"
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Dimensions
} from "react-native"
import { ThemeContext } from "../context/ThemeContext"
import { AuthContext } from "../context/AuthContext"
import { getCurrencySymbol } from "../utils/constants"

const { width } = Dimensions.get("window")

export default function RecordDetailScreen({ route, navigation }) {
    const { theme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)
    const { record } = route.params

    const currencySymbol = getCurrencySymbol(user?.user_metadata?.currency)

    const isExpense = record.type === "Expense" || record.type === "Transfer"
    const isIncome = record.type === "Income"

    const DetailItem = ({ label, value, icon }) => (
        <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <View style={styles.detailLeft}>
                <View style={[styles.detailIconBox, { backgroundColor: theme.primary + "10" }]}>
                    <Text style={styles.detailIcon}>{icon}</Text>
                </View>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>{label}</Text>
            </View>
            <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
        </View>
    )

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Text style={{ fontSize: 24, color: theme.text }}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Record Details</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Text style={{ fontSize: 20 }}>✏️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Amount Card */}
                <View style={[styles.amountCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.typeBadge, {
                        backgroundColor: isIncome ? "#2ECC7120" : isExpense ? "#E74C6C20" : theme.border,
                        color: isIncome ? "#2ECC71" : isExpense ? "#E74C6C" : theme.text
                    }]}>
                        {record.type}
                    </Text>
                    <Text style={[styles.amountText, {
                        color: isIncome ? "#2ECC71" : isExpense ? "#E74C6C" : theme.text
                    }]}>
                        {isExpense ? "-" : "+"}{currencySymbol}{record.amount.toFixed(2)}
                    </Text>
                    <Text style={[styles.dateTime, { color: theme.subtext }]}>
                        {record.date} at {record.time}
                    </Text>
                </View>

                {/* Details List */}
                <View style={[styles.detailsSection, { backgroundColor: theme.card }]}>
                    <DetailItem label="Category" value={record.category} icon="📁" />
                    <DetailItem label="Sub-category" value={record.sub_category} icon="📄" />
                    <DetailItem label="Note" value={record.note || "No notes added"} icon="📝" />
                    <DetailItem label="Created At" value={new Date(record.created_at || Date.now()).toLocaleDateString()} icon="📅" />
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.deleteBtn, { borderColor: "#FF4D4D" }]}>
                        <Text style={styles.deleteText}>Delete Record</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    headerTitle: { fontSize: 18, fontWeight: "bold" },
    iconBtn: { padding: 5 },
    scrollContent: { padding: 20 },
    amountCard: {
        borderRadius: 24,
        padding: 30,
        alignItems: "center",
        marginBottom: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 15,
        overflow: "hidden"
    },
    amountText: { fontSize: 36, fontWeight: "800", marginBottom: 8 },
    dateTime: { fontSize: 14, fontWeight: "500" },
    detailsSection: {
        borderRadius: 24,
        padding: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    detailItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    detailLeft: { flexDirection: "row", alignItems: "center" },
    detailIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    detailIcon: { fontSize: 18 },
    detailLabel: { fontSize: 14, fontWeight: "600" },
    detailValue: { fontSize: 15, fontWeight: "bold", flex: 1, textAlign: "right", marginLeft: 10 },
    actions: { marginTop: 30 },
    deleteBtn: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
    deleteText: { color: "#FF4D4D", fontSize: 16, fontWeight: "bold" }
})
