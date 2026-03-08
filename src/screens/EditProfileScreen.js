import React, { useContext, useState } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    StatusBar,
    KeyboardAvoidingView,
    Platform
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { ThemeContext } from "../context/ThemeContext"
import { AuthContext } from "../context/AuthContext"
import { supabase } from "../services/supabase"

export default function EditProfileScreen() {
    const { theme } = useContext(ThemeContext)
    const { user } = useContext(AuthContext)
    const navigation = useNavigation()

    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "")
    const [username, setUsername] = useState(user?.user_metadata?.username || "")
    const [bio, setBio] = useState(user?.user_metadata?.bio || "")

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert("Error", "Full Name cannot be empty")
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: fullName.trim(),
                username: username.trim(),
                bio: bio.trim()
            }
        })

        if (error) {
            Alert.alert("Update Failed", error.message)
        } else {
            Alert.alert("Success", "Profile updated successfully!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ])
        }
        setLoading(false)
    }

    const handleResetPassword = async () => {
        Alert.alert(
            "Reset Password",
            "We will send a password reset link to your email. Proceed?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Send Link",
                    onPress: async () => {
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email)
                        if (error) Alert.alert("Error", error.message)
                        else Alert.alert("Success", "Reset link sent to your email!")
                    }
                }
            ]
        )
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Text style={{ fontSize: 24, color: theme.text }}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveHeaderBtn}>
                    <Text style={[styles.saveHeaderText, { color: theme.primary }]}>Save</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.avatarSection}>
                        <View style={[styles.avatarPlaceholderContainer, { backgroundColor: theme.primary + "20" }]}>
                            <Text style={[styles.avatarPlaceholderText, { color: theme.primary }]}>
                                {fullName.charAt(0) || "U"}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.changePhotoBtn}>
                            <Text style={[styles.changePhotoText, { color: theme.primary }]}>Change Profile Photo</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.subtext }]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor={theme.subtext}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.subtext }]}>Username</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="@username"
                                placeholderTextColor={theme.subtext}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.subtext }]}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell us a bit about yourself"
                                placeholderTextColor={theme.subtext}
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <TouchableOpacity style={styles.dangerAction} onPress={handleResetPassword}>
                        <Text style={styles.dangerText}>Reset Password</Text>
                    </TouchableOpacity>

                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
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
    iconBtn: {
        padding: 5,
    },
    saveHeaderBtn: {
        padding: 5,
    },
    saveHeaderText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    scrollContent: {
        padding: 20,
    },
    avatarSection: {
        alignItems: "center",
        marginBottom: 30,
    },
    avatarPlaceholderContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    avatarPlaceholderText: {
        fontSize: 40,
        fontWeight: "bold",
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: "600",
    },
    form: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        paddingTop: 16,
        textAlignVertical: "top",
    },
    divider: {
        height: 1,
        marginVertical: 20,
    },
    dangerAction: {
        paddingVertical: 15,
        alignItems: "center",
    },
    dangerText: {
        color: "#EF4444",
        fontSize: 16,
        fontWeight: "bold",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    }
})
