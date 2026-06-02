import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export type BreedingStatus = "open" | "bred" | "confirmed_in_foal" | "foaled";

const LABELS: Record<BreedingStatus, string> = {
  open: "Open",
  bred: "Bred",
  confirmed_in_foal: "In Foal",
  foaled: "Foaled",
};

export function StatusBadge({ status, size = "md" }: { status: BreedingStatus; size?: "sm" | "md" }) {
  const colors = useColors();

  const bg =
    status === "open" ? colors.statusOpenBg :
    status === "bred" ? colors.statusBredBg :
    status === "confirmed_in_foal" ? colors.statusInFoalBg :
    colors.statusFoaledBg;

  const textColor =
    status === "open" ? colors.statusOpenText :
    status === "bred" ? colors.statusBredText :
    status === "confirmed_in_foal" ? colors.statusInFoalText :
    colors.statusFoaledText;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: size === "sm" ? 4 : 6, paddingHorizontal: size === "sm" ? 6 : 8, paddingVertical: size === "sm" ? 2 : 4 }]}>
      <Text style={[styles.label, { color: textColor, fontSize: size === "sm" ? 10 : 11 }]}>
        {LABELS[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start" },
  label: { fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.4 },
});
