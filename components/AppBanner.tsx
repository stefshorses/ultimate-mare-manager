import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, Image, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WOOD_GRAIN: string[] = [
  "#2c1408",
  "#59301a",
  "#7a4828",
  "#59301a",
  "#3a1c0a",
  "#6b4020",
  "#8a5830",
  "#6b4020",
  "#4a2810",
  "#7a4828",
  "#2c1408",
];

const WOOD_LOCATIONS: number[] = [0, 0.07, 0.17, 0.27, 0.37, 0.48, 0.59, 0.70, 0.80, 0.91, 1];

// Image is ~1070 x 465 → aspect ratio ≈ 2.3 : 1
const IMAGE_ASPECT = 1070 / 465;

const mareFoal = require("../assets/images/mare_foal_landscape.png");

export function AppBanner() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const screenWidth = Dimensions.get("window").width;
  const imageHeight = Math.round(screenWidth / IMAGE_ASPECT);

  return (
    <LinearGradient
      colors={WOOD_GRAIN}
      locations={WOOD_LOCATIONS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.38 }}
      style={[styles.banner, { paddingTop: topPad }]}
    >
      <View style={styles.grainLines} pointerEvents="none">
        <View style={[styles.grain, { top: "25%" }]} />
        <View style={[styles.grain, { top: "55%" }]} />
        <View style={[styles.grain, { top: "80%" }]} />
      </View>

      <Image
        source={mareFoal}
        style={[styles.image, { width: screenWidth, height: imageHeight }]}
        resizeMode="contain"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    overflow: "hidden",
  },
  grainLines: {
    ...StyleSheet.absoluteFillObject,
  },
  grain: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  image: {
    alignSelf: "center",
  },
});
