import React, { useState, useRef } from "react"
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    StatusBar,
    TouchableOpacity,
    ImageBackground
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

const ONBOARD_DATA = [
    {
        id: 1,
        title: "Navigate Your Wealth",
        subtitle: "Precise Tracking",
        description: "Experience a new level of financial clarity with real-time expense monitoring and intelligent categorization.",
        image: require("../../assets/screen1.png"),
    },
    {
        id: 2,
        title: "Secure Your Future",
        subtitle: "Bank-Grade Security",
        description: "Your data is encrypted and protected. Enjoy peace of mind knowing your financial history is in safe hands.",
        image: require("../../assets/screen2.png"),
    },
    {
        id: 3,
        title: "Insightful Analytics",
        subtitle: "Data-Driven Growth",
        description: "Unlock powerful insights into your spending habits with beautiful, intuitive visualizations and reports.",
        image: require("../../assets/screen3.png"),
    }
]

export default function OnboardScreen({ navigation }) {
    const scrollX = useRef(new Animated.Value(0)).current
    const [currentIndex, setCurrentIndex] = useState(0)

    const handleNext = () => {
        if (currentIndex < ONBOARD_DATA.length - 1) {
            setCurrentIndex(currentIndex + 1)
            // Note: In a real app with flatlist/scrollview ref, we would scroll to offset here
        } else {
            navigation.navigate("Register")
        }
    }

    // Background interpolation
    const renderBackground = () => {
        return ONBOARD_DATA.map((item, index) => {
            const opacity = scrollX.interpolate({
                inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                outputRange: [0, 1, 0],
                extrapolate: "clamp"
            })

            return (
                <Animated.Image
                    key={`bg-${item.id}`}
                    source={item.image}
                    style={[StyleSheet.absoluteFill, { opacity, width, height }]}
                    resizeMode="cover"
                />
            )
        })
    }

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Background Layer */}
            <View style={StyleSheet.absoluteFill}>
                {renderBackground()}
                {/* Dark Overlay for contrast */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.3)" }]} />
            </View>

            <Animated.ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width)
                    setCurrentIndex(index)
                }}
                scrollEventThrottle={16}
            >
                {ONBOARD_DATA.map((item, index) => {
                    // Content animations
                    const translateY = scrollX.interpolate({
                        inputRange: [(index - 0.5) * width, index * width, (index + 0.5) * width],
                        outputRange: [100, 0, 100],
                        extrapolate: "clamp"
                    })

                    return (
                        <View key={item.id} style={styles.contentSlide}>
                            <SafeAreaView style={styles.safeArea}>
                                <Animated.View style={[styles.glassCard, { transform: [{ translateY }] }]}>
                                    <Text style={styles.subtitle}>{item.subtitle.toUpperCase()}</Text>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.description}>{item.description}</Text>
                                </Animated.View>
                            </SafeAreaView>
                        </View>
                    )
                })}
            </Animated.ScrollView>

            {/* Footer Controls */}
            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {ONBOARD_DATA.map((_, index) => {
                        const scale = scrollX.interpolate({
                            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                            outputRange: [1, 1.5, 1],
                            extrapolate: "clamp"
                        })
                        const dotOpacity = scrollX.interpolate({
                            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                            outputRange: [0.4, 1, 0.4],
                            extrapolate: "clamp"
                        })
                        return (
                            <Animated.View
                                key={index}
                                style={[styles.dot, { opacity: dotOpacity, transform: [{ scale }] }]}
                            />
                        )
                    })}
                </View>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleNext}
                    activeOpacity={0.9}
                >
                    <Text style={styles.primaryBtnText}>
                        {currentIndex === ONBOARD_DATA.length - 1 ? "Start Journey" : "Next Step"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => navigation.navigate("Login")}
                >
                    <Text style={styles.secondaryBtnText}>Skip to Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    contentSlide: {
        width,
        height,
        justifyContent: "flex-end",
    },
    safeArea: {
        flex: 1,
        justifyContent: "flex-end",
    },
    glassCard: {
        margin: 24,
        marginBottom: 160, // Space for footer
        padding: 32,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 32,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(20px)", // Works on web, handled by opacity/blur on mobile
    },
    subtitle: {
        fontSize: 12,
        fontWeight: "800",
        color: "#10B981",
        letterSpacing: 2,
        marginBottom: 12,
    },
    title: {
        fontSize: 34,
        fontWeight: "bold",
        color: "#FFFFFF",
        lineHeight: 42,
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.8)",
        lineHeight: 26,
    },
    footer: {
        position: "absolute",
        bottom: 50,
        width: "100%",
        paddingHorizontal: 24,
        alignItems: "center",
    },
    pagination: {
        flexDirection: "row",
        marginBottom: 32,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FFFFFF",
        marginHorizontal: 6,
    },
    primaryBtn: {
        width: "100%",
        height: 64,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0F172A",
    },
    secondaryBtn: {
        marginTop: 20,
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
        opacity: 0.7,
    }
})
