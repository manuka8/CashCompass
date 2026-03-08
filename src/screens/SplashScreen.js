import React, { useContext } from "react"
import { View, Image, StyleSheet, Dimensions, StatusBar } from "react-native"
import { ThemeContext } from "../context/ThemeContext"

const { width, height } = Dimensions.get("window")

export default function SplashScreen() {
    const { theme } = useContext(ThemeContext)

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar hidden />
            <Image
                source={require("../../assets/splash.gif")}
                style={styles.gif}
                resizeMode="cover"
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gif: {
        width: width,
        height: height,
        position: "absolute",
    },
})
