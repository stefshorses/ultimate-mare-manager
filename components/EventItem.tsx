import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type EventType = "heat_return" | "foaling_window_start" | "foaling_window_end" | "vet_check_eligible";

type UpcomingEvent = {
  mareId: number;
  mareName: string;
  stableName?: string | null;
  eventType: EventType;
  eventDate: string;
  description: string;
};

function fmtDate(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isToday(d: string): boolean {
  return d === new Date().toISOString().slice(0, 10);
}

function isSoon(d: string): boolean {
  const diff = (new Date(d + "T00:00:00").getTime() - Date.now()) / 86400000;
  return diff >= 0 && diff <= 7;
}

const EVENT_CONFIG: Record<EventType, { icon: string; label: string; color: string }> = {
  heat_return: { icon: "sync-circle", label: "Heat Return", color: "#f59e0b" },
  vet_check_eligible: { icon: "medkit", label: "Vet Check", color: "#10b981" },
  foaling_window_start: { icon: "star", label: "Foaling Window", color: "#6366f1" },
  foaling_window_end: { icon: "flag", label: "Foaling End", color: "#8b5cf6" },
};

export function EventItem({ event }: { event: UpcomingEvent }) {
  const colors = useColors();
  const cfg = EVENT_CONFIG[event.eventType] ?? { icon: "calendar", label: event.eventType, color: colors.primary };
  const urgent = isToday(event.eventDate) || isSoon(event.eventDate);

  return (
    <View style={[styles.item, { backgroundColor: colors.card, borderColor: urgent ? cfg.color : colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + "1A" }]}>
        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.foreground }]}>{cfg.label}</Text>
          <Text style={[styles.date, { color: urgent ? cfg.color : colors.mutedForeground }]}>{fmtDate(event.eventDate)}</Text>
        </View>
        <Text style={[styles.mareName, { color: colors.primary }]}>{event.mareName}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{event.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, gap: 2 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  date: { fontSize: 12, fontFamily: "DMSans_500Medium" },
  mareName: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  desc: { fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 17 },
});
