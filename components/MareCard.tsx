import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "./StatusBadge";

const WOOD_GRAIN: string[] = [
  "#2c1408", "#59301a", "#7a4828", "#59301a", "#3a1c0a",
  "#6b4020", "#8a5830", "#6b4020", "#4a2810", "#7a4828", "#2c1408",
];
const WOOD_LOCATIONS: number[] = [0, 0.07, 0.17, 0.27, 0.37, 0.48, 0.59, 0.70, 0.80, 0.91, 1];

type MareSummary = {
  id: number;
  registeredName?: string | null;
  stableName?: string | null;
  breed?: string | null;
  owner?: string | null;
  photoUrl?: string | null;
  latestBreedingStatus?: string | null;
  latestBredDates?: string | null;
  latestStallionName?: string | null;
  expectedHeatReturn?: string | null;
  expectedFoalingStart?: string | null;
  expectedFoalingEnd?: string | null;
};

function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MareCard({ mare }: { mare: MareSummary }) {
  const colors = useColors();
  const router = useRouter();

  const name = mare.registeredName || mare.stableName || "Unnamed Mare";
  const nickname = mare.registeredName && mare.stableName ? `"${mare.stableName}"` : null;

  const keyDate =
    mare.latestBreedingStatus === "confirmed_in_foal" && mare.expectedFoalingStart
      ? `Due ~${fmtDate(mare.expectedFoalingStart)}`
      : mare.latestBreedingStatus === "bred" && mare.expectedHeatReturn
      ? `Heat ~${fmtDate(mare.expectedHeatReturn)}`
      : null;

  const photoUri = mare.photoUrl
    ? mare.photoUrl.startsWith("http")
      ? mare.photoUrl
      : `https://${process.env.EXPO_PUBLIC_DOMAIN}${mare.photoUrl}`
    : null;

  return (
    <TouchableOpacity
      testID={`mare-card-${mare.id}`}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/mare/${mare.id}` as any)}
      activeOpacity={0.75}
    >
      {/* Wood-grain accent strip */}
      <LinearGradient
        colors={WOOD_GRAIN}
        locations={WOOD_LOCATIONS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.woodStrip}
      />

      {/* Card content */}
      <View style={styles.content}>
        <Image
          source={photoUri ? { uri: photoUri } : require("../assets/images/icon.png")}
          style={[styles.photo, { backgroundColor: colors.muted }]}
          contentFit="cover"
        />
        <View style={styles.body}>
          <View style={styles.top}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
            {mare.latestBreedingStatus && (
              <StatusBadge status={mare.latestBreedingStatus as any} size="sm" />
            )}
          </View>
          {nickname && (
            <Text style={[styles.nickname, { color: colors.mutedForeground }]}>{nickname}</Text>
          )}
          {mare.breed && (
            <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>{mare.breed}</Text>
          )}
          <View style={styles.row}>
            {mare.latestStallionName && (
              <Text style={[styles.stallion, { color: colors.primary }]} numberOfLines={1}>
                x {mare.latestStallionName}
              </Text>
            )}
            {keyDate && (
              <Text style={[styles.keyDate, { color: colors.mutedForeground }]}>{keyDate}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  woodStrip: {
    height: 8,
    width: "100%",
  },
  content: {
    flexDirection: "row",
  },
  photo: { width: 80, height: 90 },
  body: { flex: 1, padding: 12, gap: 3 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  name: { fontSize: 15, fontFamily: "DMSans_600SemiBold", flex: 1 },
  nickname: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: -1 },
  meta: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  stallion: { fontSize: 12, fontFamily: "DMSans_500Medium", flex: 1 },
  keyDate: { fontSize: 11, fontFamily: "DMSans_400Regular" },
});
