import React, { useState, useContext, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    StatusBar,
    ActivityIndicator,
    RefreshControl
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { ThemeContext } from "../context/ThemeContext"
import { AuthContext } from "../context/AuthContext"
import { supabase } from "../services/supabase"

export default function NotificationScreen() {
    const { theme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)
    const navigation = useNavigation()

    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })

            if (error) throw error
            setNotifications(data || [])
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const onRefresh = () => {
        setRefreshing(true)
        fetchNotifications()
    }

    const markAsRead = async (id) => {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id)

        if (!error) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            )
        }
    }

    const deleteNotification = async (id) => {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", id)

        if (!error) {
            setNotifications(prev => prev.filter(n => n.id !== id))
        }
    }

    const clearAll = async () => {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("user_id", user.id)

        if (!error) {
            setNotifications([])
        }
    }

    const renderNotification = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                { backgroundColor: theme.card },
                !item.is_read && { borderLeftWidth: 4, borderLeftColor: theme.primary }
            ]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, {
                    backgroundColor: item.type === "Budget Warning" ? "#FF4D4D20" :
                        item.type === "Transaction" ? "#2ECC7120" : theme.border + "40"
                }]}>
                    <Text style={[styles.typeText, {
                        color: item.type === "Budget Warning" ? "#FF4D4D" :
                            item.type === "Transaction" ? "#2ECC71" : theme.subtext
                    }]}>
                        {item.type}
                    </Text>
                </View>
                <Text style={[styles.timeText, { color: theme.subtext }]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>

            <Text style={[styles.title, { color: theme.text, fontWeight: item.is_read ? "600" : "800" }]}>
                {item.title}
            </Text>
            <Text style={[styles.message, { color: theme.subtext }]}>
                {item.message}
            </Text>

            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteNotification(item.id)}
            >
                <Text style={{ color: "#FF4D4D", fontSize: 12, fontWeight: "600" }}>Dismiss</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    )

    const GroupHeader = ({ title }) => (
        <Text style={[styles.groupTitle, { color: theme.subtext }]}>{title.toUpperCase()}</Text>
    )

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Text style={{ fontSize: 24, color: theme.text }}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
                {notifications.length > 0 ? (
                    <TouchableOpacity onPress={clearAll}>
                        <Text style={{ color: theme.primary, fontWeight: "bold" }}>Clear All</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 40 }} />}
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={{ fontSize: 40, marginBottom: 20 }}>🔔</Text>
                            <Text style={[styles.emptyText, { color: theme.subtext }]}>No notifications yet</Text>
                            <Text style={[styles.emptySubText, { color: theme.subtext }]}>We'll alert you here for budget limits and system updates.</Text>
                        </View>
                    }
                />
            )}
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
    listContent: { padding: 20, paddingBottom: 50 },
    notificationCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
    timeText: { fontSize: 11, fontWeight: "500" },
    title: { fontSize: 16, marginBottom: 4 },
    message: { fontSize: 14, lineHeight: 20 },
    deleteBtn: { marginTop: 12, alignSelf: "flex-end" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    emptySubText: { fontSize: 14, textAlign: "center", opacity: 0.7 },
    groupTitle: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 12, marginLeft: 4 }
})
