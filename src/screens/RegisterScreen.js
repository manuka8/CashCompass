import React, { useState, useContext } from "react"
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
  StatusBar,
  Dimensions,
  ScrollView
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated"
import { supabase } from "../services/supabase"
import { Dropdown } from 'react-native-element-dropdown';
import { COUNTRIES, CURRENCIES } from "../utils/constants"
import { ThemeContext } from "../context/ThemeContext"

const { width, height } = Dimensions.get("window")

export default function RegisterScreen({ navigation }) {
  const { theme } = useContext(ThemeContext)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [country, setCountry] = useState(null)
  const [currency, setCurrency] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isCountryFocus, setIsCountryFocus] = useState(false)
  const [isCurrencyFocus, setIsCurrencyFocus] = useState(false)

  // Reanimated shared values for interactive effects
  const registerBtnScale = useSharedValue(1)

  const registerBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: registerBtnScale.value }]
  }))

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
    registerBtnScale.value = withSpring(0.95, {}, () => {
      registerBtnScale.value = withSpring(1)
    })

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Background Accent */}
      <View style={[styles.bgAccent, { backgroundColor: theme.primary }]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <Animated.View entering={FadeIn.delay(100).duration(600)}>
                <TouchableOpacity
                  style={[styles.backBtn, { backgroundColor: "rgba(255, 255, 255, 0.25)", borderColor: "rgba(255, 255, 255, 0.4)" }]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.header}>
                <Animated.Text
                  entering={FadeInDown.delay(200).duration(800)}
                  style={styles.title}
                >
                  Create Account
                </Animated.Text>
                <Animated.Text
                  entering={FadeInDown.delay(300).duration(800)}
                  style={styles.subtitle}
                >
                  Join thousands of users tracking their wealth with precision
                </Animated.Text>
              </View>

              <Animated.View
                entering={FadeInUp.delay(400).duration(800)}
                style={[styles.formCard, { backgroundColor: theme.card }]}
              >
                <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: '#F8FAFC', borderColor: theme.border }]}
                    placeholder="nathan@example.com"
                    placeholderTextColor={theme.subtext}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: '#F8FAFC', borderColor: theme.border }]}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={theme.subtext}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Confirm Password</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: '#F8FAFC', borderColor: theme.border }]}
                    placeholder="Re-enter password"
                    placeholderTextColor={theme.subtext}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Country</Text>
                  <Dropdown
                    style={[
                      styles.dropdown,
                      { backgroundColor: '#F8FAFC', borderColor: theme.border },
                      isCountryFocus && { borderColor: theme.primary }
                    ]}
                    placeholderStyle={[styles.placeholderStyle, { color: theme.subtext }]}
                    selectedTextStyle={[styles.selectedTextStyle, { color: theme.text }]}
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
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(900).duration(600)} style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Preferred Currency</Text>
                  <Dropdown
                    style={[
                      styles.dropdown,
                      { backgroundColor: '#F8FAFC', borderColor: theme.border },
                      isCurrencyFocus && { borderColor: theme.primary }
                    ]}
                    placeholderStyle={[styles.placeholderStyle, { color: theme.subtext }]}
                    selectedTextStyle={[styles.selectedTextStyle, { color: theme.text }]}
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
                </Animated.View>

                <TouchableOpacity
                  onPress={register}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[
                    styles.registerBtn,
                    { backgroundColor: theme.primary, shadowColor: theme.shadow },
                    loading && styles.registerBtnDisabled,
                    registerBtnAnimatedStyle
                  ]}>
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.registerBtnText}>Sign Up</Text>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(1000).duration(800)}
                style={styles.footer}
              >
                <Text style={[styles.footerText, { color: theme.subtext }]}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={[styles.loginBtnText, { color: theme.primary }]}>Sign In</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgAccent: {
    position: "absolute",
    top: 0,
    width: width,
    height: height * 0.35,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 24,
  },
  formCard: {
    borderRadius: 35,
    padding: 25,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  input: {
    height: 58,
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: "500",
    borderWidth: 1.5,
  },
  dropdown: {
    height: 58,
    borderRadius: 18,
    paddingHorizontal: 18,
    borderWidth: 1.5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
    fontWeight: "500",
  },
  iconStyle: {
    width: 22,
    height: 22,
  },
  inputSearchStyle: {
    height: 45,
    fontSize: 16,
    borderRadius: 10,
  },
  registerBtn: {
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  registerBtnDisabled: {
    opacity: 0.7,
  },
  registerBtnText: {
    color: "white",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 35,
    marginBottom: 20
  },
  footerText: {
    fontSize: 16,
    fontWeight: "500",
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "800",
  }
})
