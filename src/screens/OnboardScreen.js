import React, { useState, useRef, useContext, useCallback } from "react"
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    StatusBar,
    TouchableOpacity,
    Image,
    Platform
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    FadeIn,
    FadeInDown,
    FadeInUp,
} from "react-native-reanimated"
import { ThemeContext } from "../context/ThemeContext"

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

const OnboardItem = ({ item, index, scrollX, theme }) => {
    const cardStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollX.value,
            [(index - 0.5) * width, index * width, (index + 0.5) * width],
            [100, 0, 100],
            Extrapolate.CLAMP
        )
        const opacity = interpolate(
            scrollX.value,
            [(index - 0.5) * width, index * width, (index + 0.5) * width],
            [0, 1, 0],
            Extrapolate.CLAMP
        )

        return {
            transform: [{ translateY }],
            opacity,
        }
    })

    return (
        <View style={styles.contentSlide}>
            <SafeAreaView style={styles.safeArea}>
                <Animated.View style={[styles.glassCard, cardStyle]}>
                    <Text style={[styles.subtitle, { color: theme.primary }]}>{item.subtitle.toUpperCase()}</Text>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </Animated.View>
            </SafeAreaView>
        </View>
    )
}

const PaginationDot = ({ index, scrollX }) => {
    const dotStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [1, 1.5, 1],
            Extrapolate.CLAMP
        )
        const opacity = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0.4, 1, 0.4],
            Extrapolate.CLAMP
        )
        return {
            opacity,
            transform: [{ scale }],
        }
    })

    return <Animated.View style={[styles.dot, dotStyle]} />
}

export default function OnboardScreen({ navigation }) {
    const { theme } = useContext(ThemeContext)
    const flatListRef = useRef(null)
    const scrollX = useSharedValue(0)
    const [currentIndex, setCurrentIndex] = useState(0)

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x
        },
    })

    const handleNext = () => {
        if (currentIndex < ONBOARD_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            })
        } else {
            navigation.navigate("Register")
        }
    }

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index)
        }
    }).current

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current

    const renderBackground = () => {
        return ONBOARD_DATA.map((item, index) => {
            const backgroundStyle = useAnimatedStyle(() => {
                const opacity = interpolate(
                    scrollX.value,
                    [(index - 1) * width, index * width, (index + 1) * width],
                    [0, 1, 0],
                    Extrapolate.CLAMP
                )

                return {
                    opacity,
                }
            })

            return (
                <Animated.Image
                    key={`bg-${item.id}`}
                    source={item.image}
                    style={[StyleSheet.absoluteFill, backgroundStyle, { width, height }]}
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
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }]} />
            </View>

            <Animated.FlatList
                ref={flatListRef}
                data={ONBOARD_DATA}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                    <OnboardItem item={item} index={index} scrollX={scrollX} theme={theme} />
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />

            {/* Footer Controls */}
            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {ONBOARD_DATA.map((_, index) => (
                        <PaginationDot key={index} index={index} scrollX={scrollX} />
                    ))}
                </View>

                <Animated.View entering={FadeInUp.delay(300).duration(800)}>
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                        onPress={handleNext}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryBtnText}>
                            {currentIndex === ONBOARD_DATA.length - 1 ? "Start Journey" : "Next Step"}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

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
        marginBottom: 180, // Space for footer
        padding: 28,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        borderRadius: 32,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
            }
        })
    },
    subtitle: {
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 2,
        marginBottom: 10,
        color: "#FFFFFF"
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#FFFFFF",
        lineHeight: 40,
        marginBottom: 14,
    },
    description: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.75)",
        lineHeight: 24,
    },
    footer: {
        position: "absolute",
        bottom: 40,
        width: "100%",
        paddingHorizontal: 24,
        alignItems: "center",
    },
    pagination: {
        flexDirection: "row",
        marginBottom: 35,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FFFFFF",
        marginHorizontal: 6,
    },
    primaryBtn: {
        width: width - 48,
        height: 60,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#2ECC71",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    secondaryBtn: {
        marginTop: 24,
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
        opacity: 0.6,
    }
})
