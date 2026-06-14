import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useColors } from "@/hooks/useColors";

const WOOD_GRAIN: string[] = [
  "#2c1408","#59301a","#7a4828","#59301a","#3a1c0a",
  "#6b4020","#8a5830","#6b4020","#4a2810","#7a4828","#2c1408",
];
const WOOD_LOCATIONS: number[] = [0, 0.07, 0.17, 0.27, 0.37, 0.48, 0.59, 0.70, 0.80, 0.91, 1];
const IMAGE_ASPECT = 1070 / 465;
const mareFoal = require("../assets/images/mare_foal_landscape.png");

const FEATURES = [
  { icon: "heart-outline" as const, label: "Unlimited mares" },
  { icon: "calendar-outline" as const, label: "Heat cycle tracking & predictions" },
  { icon: "checkmark-circle-outline" as const, label: "Pregnancy confirmations" },
  { icon: "hourglass-outline" as const, label: "Foaling window calculator" },
  { icon: "document-text-outline" as const, label: "Full breeding records" },
  { icon: "notifications-outline" as const, label: "Vet check reminders" },
];

export function PaywallModal() {
  const { showPaywall, setShowPaywall, purchase, restore, currentOffering, isLoading } = useSubscription();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const imageHeight = Math.round(screenWidth / IMAGE_ASPECT);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const pkg = currentOffering?.availablePackages[0];
  const priceString = pkg?.product.priceString ?? "$18.99";

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await purchase();
    } catch (e: unknown) {
      let msg = "Something went wrong. Please try again.";
      if (e && typeof e === "object") {
        const err = e as Record<string, unknown>;
        if (typeof err.message === "string") msg = err.message;
        if (typeof err.code !== "undefined") msg += ` (code: ${err.code})`;
        if (typeof err.underlyingErrorMessage === "string") msg += ` — ${err.underlyingErrorMessage}`;
      }
      Alert.alert("Purchase failed", msg);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restore();
      Alert.alert("Restored", "Your purchases have been restored.");
    } catch {
      Alert.alert("Restore failed", "No previous purchases found.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal visible={showPaywall} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={WOOD_GRAIN}
          locations={WOOD_LOCATIONS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.38 }}
          style={styles.banner}
        >
          <TouchableOpacity
            style={[styles.closeBtn, { top: insets.top + 8 }]}
            onPress={() => setShowPaywall(false)}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Image
            source={mareFoal}
            style={{ width: screenWidth, height: imageHeight }}
            resizeMode="contain"
          />
        </LinearGradient>

        <View style={styles.content}>
          <Text style={[styles.heading, { color: colors.foreground }]}>THE ULTIMATE</Text>
          <Text style={[styles.subheading, { color: colors.primary }]}>Mare Manager</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Everything you need to track your mares through every season.
          </Text>

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <Ionicons name={f.icon} size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.purchaseBtn, { backgroundColor: colors.primary }]}
                onPress={handlePurchase}
                disabled={purchasing || restoring}
              >
                {purchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.purchaseBtnText}>Subscribe — {priceString}/year</Text>
                    <Text style={styles.purchaseBtnSub}>Cancel anytime</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={handleRestore}
                disabled={purchasing || restoring}
              >
                {restoring ? (
                  <ActivityIndicator color={colors.mutedForeground} size="small" />
                ) : (
                  <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
                    Restore purchases
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.legal, { color: colors.mutedForeground }]}>
                Annual subscription billed through Apple. Subscription automatically renews unless cancelled
                at least 24 hours before the end of the current period.
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { width: "100%", overflow: "hidden" },
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    padding: 4,
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20, gap: 4 },
  heading: { fontSize: 28, fontFamily: "Rye_400Regular", letterSpacing: 2 },
  subheading: { fontSize: 18, fontFamily: "Rye_400Regular", letterSpacing: 2, marginBottom: 8 },
  body: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 20, marginBottom: 12 },
  features: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 15, fontFamily: "DMSans_500Medium" },
  footer: { paddingHorizontal: 24, gap: 10 },
  purchaseBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  purchaseBtnText: { fontSize: 17, fontFamily: "DMSans_700Bold", color: "#fff" },
  purchaseBtnSub: { fontSize: 12, fontFamily: "DMSans_400Regular", color: "rgba(255,255,255,0.8)" },
  restoreBtn: { alignItems: "center", paddingVertical: 8 },
  restoreText: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  legal: { fontSize: 10, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 14, opacity: 0.7 },
});
