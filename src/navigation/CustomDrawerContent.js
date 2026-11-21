import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Moon, Sun, LogOut } from 'lucide-react-native';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

export default function CustomDrawerContent(props) {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { user, logout } = useContext(AuthContext);

    const handleLogout = async () => {
        await logout();
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.card }}>
            <DrawerContentScrollView {...props}>
                <TouchableOpacity
                    style={styles.drawerHeader}
                    onPress={() => props.navigation.navigate('Settings')}
                >
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        {user?.user_metadata?.avatar_url ? (
                            <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatarImg} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {user?.user_metadata?.full_name?.charAt(0) || "U"}
                            </Text>
                        )}
                    </View>
                    <Text style={[styles.userName, { color: theme.text }]}>
                        {user?.user_metadata?.full_name || "User Name"}
                    </Text>
                    <Text style={[styles.userEmail, { color: theme.subtext }]}>
                        {user?.email || "user@example.com"}
                    </Text>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <DrawerItemList {...props} />
            </DrawerContentScrollView>

            {/* Bottom Actions */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <View style={styles.themeToggleContainer}>
                    <View style={styles.footerRow}>
                        {theme.mode === 'dark' ? (
                            <Moon size={20} color={theme.primary} strokeWidth={2} />
                        ) : (
                            <Sun size={20} color={theme.primary} strokeWidth={2} />
                        )}
                        <Text style={[styles.footerText, { color: theme.text }]}>Dark Mode</Text>
                    </View>
                    <Switch
                        value={theme.mode === 'dark'}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#CBD5E1', true: theme.primary }}
                        thumbColor={theme.mode === 'dark' ? '#FFFFFF' : '#F4F3F4'}
                    />
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color="#EF4444" strokeWidth={2} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    drawerHeader: {
        padding: 20,
        paddingBottom: 24,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        paddingBottom: 40,
    },
    themeToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
