import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native"
import { supabase } from "../services/supabase"
import { Dropdown } from 'react-native-element-dropdown';
import { COUNTRIES, CURRENCIES } from "../utils/constants"

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [country, setCountry] = useState(null)
  const [currency, setCurrency] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isCountryFocus, setIsCountryFocus] = useState(false)
  const [isCurrencyFocus, setIsCurrencyFocus] = useState(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const register = async () => {
    if (!email || !password || !confirmPassword || !country || !currency) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          country,
          currency,
        }
      }
    })

    if (error) {
      Alert.alert("Registration Failed", error.message)
    } else {
      Alert.alert("Success", "Account created! Please log in.", [
        { text: "OK", onPress: () => navigation.navigate("Login") }
      ])
    }
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking your wealth today</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="nathan@example.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Country</Text>
              <Dropdown
                style={[styles.dropdown, isCountryFocus && { borderColor: '#2ECC71' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={COUNTRIES}
                search
                maxHeight={300}
                labelField="label"
                valueField="label"
                placeholder={!isCountryFocus ? 'Select Country' : '...'}
                searchPlaceholder="Search..."
                value={country}
                onFocus={() => setIsCountryFocus(true)}
                onBlur={() => setIsCountryFocus(false)}
                onChange={item => {
                  setCountry(item.label);
                  setIsCountryFocus(false);
                }}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Preferred Currency</Text>
              <Dropdown
                style={[styles.dropdown, isCurrencyFocus && { borderColor: '#2ECC71' }]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={CURRENCIES}
                search
                maxHeight={300}
                labelField="label"
                valueField="label"
                placeholder={!isCurrencyFocus ? 'Select Currency' : '...'}
                searchPlaceholder="Search..."
                value={currency}
                onFocus={() => setIsCurrencyFocus(true)}
                onBlur={() => setIsCurrencyFocus(false)}
                onChange={item => {
                  setCurrency(item.value);
                  setIsCurrencyFocus(false);
                }}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={register}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
  },
  backBtnText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdown: {
    height: 56,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#94A3B8",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#0F172A",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderRadius: 8,
  },
  registerBtn: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  registerBtnDisabled: {
    opacity: 0.7,
  },
  registerBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 20
  },
  footerText: {
    color: "#64748B",
    fontSize: 15,
  },
  loginBtnText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "bold",
  }
})