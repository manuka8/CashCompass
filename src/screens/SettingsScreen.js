import React, { useContext, useState, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    Alert,
    ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Dropdown } from "react-native-element-dropdown"
import { ThemeContext } from "../context/ThemeContext"
import { AuthContext } from "../context/AuthContext"
import { supabase } from "../services/supabase"
import { COUNTRIES, CURRENCIES } from "../utils/constants"

export default function SettingsScreen() {
    const { theme, toggleTheme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)
    const navigation = useNavigation()

    const [loading, setLoading] = useState(false)
    const [country, setCountry] = useState(user?.user_metadata?.country || null)
    const [currency, setCurrency] = useState(user?.user_metadata?.currency || null)

    const handleUpdatePreference = async (key, value) => {
        setLoading(true)
        const { error } = await supabase.auth.updateUser({
            data: { [key]: value }
        })

        if (error) {
            Alert.alert("Update Failed", error.message)
        } else {
            if (key === 'country') setCountry(value)
            else setCurrency(value)
        }
        setLoading(false)
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Text style={{ fontSize: 24, color: theme.text }}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Section */}
                <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
                    <View style={[styles.avatarContainer, { backgroundColor: theme.primary + "20" }]}>
                        {user?.user_metadata?.avatar_url ? (
                            <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatar} />
                        ) : (
                            <Text style={[styles.avatarPlaceholder, { color: theme.primary }]}>
                                {user?.user_metadata?.full_name?.charAt(0) || "U"}
                            </Text>
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.userName, { color: theme.text }]}>
                            {user?.user_metadata?.full_name || "User Name"}
                        </Text>
                        <Text style={[styles.userEmail, { color: theme.subtext }]}>
                            {user?.email || "user@example.com"}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.editBtn, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate("EditProfile")}
                    >
                        <Text style={styles.editBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <Text style={[styles.sectionTitle, { color: theme.subtext }]}>PREFERENCES</Text>
                <View style={[styles.settingsList, { backgroundColor: theme.card }]}>

                    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                        <View style={styles.settingLabelContainer}>
                            <Text style={styles.settingIcon}>🌍</Text>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>Country</Text>
                        </View>
                        <Dropdown
                            style={[styles.dropdown, { borderColor: "transparent" }]}
                            placeholderStyle={{ color: theme.subtext, fontSize: 14 }}
                            selectedTextStyle={{ color: theme.primary, fontSize: 14, fontWeight: '600', textAlign: 'right' }}
                            data={COUNTRIES}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Country"
                            searchPlaceholder="Search..."
                            value={country}
                            onChange={item => handleUpdatePreference('country', item.value)}
                            containerStyle={{ borderRadius: 12, backgroundColor: theme.card }}
                            itemTextStyle={{ color: theme.text }}
                            activeColor={theme.primary + "10"}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabelContainer}>
                            <Text style={styles.settingIcon}>💰</Text>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>Currency</Text>
                        </View>
                        <Dropdown
                            style={[styles.dropdown, { borderColor: "transparent" }]}
                            placeholderStyle={{ color: theme.subtext, fontSize: 14 }}
                            selectedTextStyle={{ color: theme.primary, fontSize: 14, fontWeight: '600', textAlign: 'right' }}
                            data={CURRENCIES}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Currency"
                            searchPlaceholder="Search..."
                            value={currency}
                            onChange={item => handleUpdatePreference('currency', item.value)}
                            containerStyle={{ borderRadius: 12, backgroundColor: theme.card }}
                            itemTextStyle={{ color: theme.text }}
                            activeColor={theme.primary + "10"}
                        />
                    </View>

                </View>

                {/* App Settings */}
                <Text style={[styles.sectionTitle, { color: theme.subtext }]}>APP SETTINGS</Text>
                <View style={[styles.settingsList, { backgroundColor: theme.card }]}>
                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: theme.border }]}
                        onPress={toggleTheme}
                    >
                        <View style={styles.settingLabelContainer}>
                            <Text style={styles.settingIcon}>{theme.mode === 'dark' ? '☀️' : '🌙'}</Text>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>
                                {theme.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabelContainer}>
                            <Text style={styles.settingIcon}>ℹ️</Text>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>App Version</Text>
                        </View>
                        <Text style={[styles.versionText, { color: theme.subtext }]}>1.0.0 (Build 42)</Text>
                    </View>
                </View>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                )}

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
        fontSize: 20,
        fontWeight: "bold",
    },
    iconBtn: {
        padding: 5,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    profileCard: {
        padding: 24,
        borderRadius: 24,
        alignItems: "center",
        marginBottom: 30,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        overflow: "hidden",
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    avatarPlaceholder: {
        fontSize: 40,
        fontWeight: "bold",
    },
    profileInfo: {
        alignItems: "center",
        marginBottom: 20,
    },
    userName: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
    },
    editBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    editBtnText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    settingsList: {
        borderRadius: 24,
        paddingHorizontal: 16,
        marginBottom: 24,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    settingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    settingLabelContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    settingIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: "600",
    },
    dropdown: {
        width: 150,
        height: 30,
    },
    versionText: {
        fontSize: 14,
        fontWeight: "500",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 24,
    }
})
