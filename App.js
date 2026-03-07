import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "./src/context/AuthContext"
import AppNavigator from "./src/navigation/AppNavigator"
import { StatusBar } from "expo-status-bar"

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
