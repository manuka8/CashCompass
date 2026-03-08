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
  Dimensions
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated"
import { supabase } from "../services/supabase"
import { ThemeContext } from "../context/ThemeContext"

const { width, height } = Dimensions.get("window")

export default function LoginScreen({ navigation }) {
  const { theme } = useContext(ThemeContext)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Reanimated shared values for interactive effects
  const emailScale = useSharedValue(1)
  const passwordScale = useSharedValue(1)
  const loginBtnScale = useSharedValue(1)
  const logoRotation = useSharedValue(0)

  // Trigger floating logo animation
  React.useEffect(() => {
    logoRotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2000 }),
        withTiming(-10, { duration: 2000 })
      ),
      -1,
      true
    )
  }, [])

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${logoRotation.value}deg` }]
  }))

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emailScale.value }],
    borderColor: emailScale.value > 1 ? theme.primary : theme.border
  }))

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: passwordScale.value }],
    borderColor: passwordScale.value > 1 ? theme.primary : theme.border
  }))

  const loginBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loginBtnScale.value }]
  }))

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const login = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email")
      return
    }

    setLoading(true)
    loginBtnScale.value = withSpring(0.95, {}, () => {
      loginBtnScale.value = withSpring(1)
    })

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      Alert.alert("Login Failed", error.message)
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
          <View style={styles.content}>
            <View style={styles.header}>
              <Animated.View
                entering={FadeIn.delay(200).duration(800)}
                style={[styles.logoCircle, animatedLogoStyle]}
              >
                <Text style={styles.logoText}>C</Text>
              </Animated.View>
              <Animated.Text
                entering={FadeInDown.delay(300).duration(800)}
                style={styles.title}
              >
                Welcome Back
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(400).duration(800)}
                style={styles.subtitle}
              >
                Log in to manage your wealth with precision
              </Animated.Text>
            </View>

            <Animated.View
              entering={FadeInUp.delay(500).duration(800)}
              style={[styles.formCard, { backgroundColor: theme.card }]}
            >
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
                <Animated.View style={[styles.inputWrapper, emailAnimatedStyle]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="nathan@example.com"
                    placeholderTextColor={theme.subtext}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => { emailScale.value = withSpring(1.02) }}
                    onBlur={() => { emailScale.value = withSpring(1) }}
                  />
                </Animated.View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                <Animated.View style={[styles.inputWrapper, passwordAnimatedStyle]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.subtext}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => { passwordScale.value = withSpring(1.02) }}
                    onBlur={() => { passwordScale.value = withSpring(1) }}
                  />
                </Animated.View>
                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={login}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Animated.View style={[
                  styles.loginBtn,
                  { backgroundColor: theme.primary, shadowColor: theme.shadow },
                  loading && styles.loginBtnDisabled,
                  loginBtnAnimatedStyle
                ]}>
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginBtnText}>Sign In</Text>
                  )}
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(700).duration(800)}
              style={styles.footer}
            >
              <Text style={[styles.footerText, { color: theme.subtext }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={[styles.signUpText, { color: theme.primary }]}>Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
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
    height: height * 0.4,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoText: {
    fontSize: 45,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  formCard: {
    borderRadius: 35,
    padding: 30,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    borderWidth: 1.5,
  },
  input: {
    height: 62,
    paddingHorizontal: 22,
    fontSize: 16,
    fontWeight: "500",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 12,
    marginRight: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "700",
  },
  loginBtn: {
    height: 66,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: "white",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 45,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "500",
  },
  signUpText: {
    fontSize: 16,
    fontWeight: "800",
  }
})
