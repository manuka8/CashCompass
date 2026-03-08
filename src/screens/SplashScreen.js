import React, { useContext } from "react";
import { View, Image, StyleSheet, StatusBar } from "react-native";
import { ThemeContext } from "../context/ThemeContext";

export default function SplashScreen() {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image
        source={require("../../assets/splash.gif")}
        style={styles.gif}
        resizeMode="cover" // cover fills entire screen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gif: {
    width: "100%",  // Full width
    height: "100%", // Full height
  },
});