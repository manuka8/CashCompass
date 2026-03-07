import { createDrawerNavigator } from "@react-navigation/drawer"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useContext } from "react"
import { View, ActivityIndicator, Text } from "react-native"
import { AuthContext } from "../context/AuthContext"
import { ThemeProvider, ThemeContext } from "../context/ThemeContext"
import CustomDrawerContent from "./CustomDrawerContent"

import OnboardScreen from "../screens/OnboardScreen"
import LoginScreen from "../screens/LoginScreen"
import RegisterScreen from "../screens/RegisterScreen"
import HomeScreen from "../screens/HomeScreen"
import AddExpensesScreen from "../screens/AddExpensesScreen"
import RecordScreen from "../screens/RecordScreen"
import RecordDetailScreen from "../screens/RecordDetailScreen"
import SettingsScreen from "../screens/SettingsScreen"
import EditProfileScreen from "../screens/EditProfileScreen"

const Stack = createNativeStackNavigator()
const Drawer = createDrawerNavigator()

// Placeholder Screens for Drawer Items
function PlaceholderScreen({ name }) {
  const { theme } = useContext(ThemeContext)
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
      <ActivityIndicator size="small" color={theme.primary} />
      <Text style={{ marginTop: 12, color: theme.text }}>{name} coming soon...</Text>
    </View>
  )
}

function MainDrawerNavigator() {
  const { theme } = useContext(ThemeContext)
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: theme.primary,
        drawerInactiveTintColor: theme.subtext,
        drawerStyle: {
          backgroundColor: theme.card,
          width: 280,
        },
        drawerLabelStyle: {
          fontWeight: '600',
          fontSize: 15,
        }
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Budget Planner" component={() => <PlaceholderScreen name="Budget Planner" />} />
      <Drawer.Screen name="Records" component={RecordScreen} />
      <Drawer.Screen name="Statics" component={() => <PlaceholderScreen name="Statics" />} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  )
}

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={MainDrawerNavigator} />
              <Stack.Screen name="AddExpense" component={AddExpensesScreen} />
              <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Onboard" component={OnboardScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  )
}
