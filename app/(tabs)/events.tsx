import { useGetUpcomingEvents, getGetUpcomingEventsQueryKey } from "@workspace/api-client-react";
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { AppBanner } from "@/components/AppBanner";
import { EventItem } from "@/components/EventItem";

export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: events, isLoading, refetch, isRefetching } = useGetUpcomingEvents({
    query: { queryKey: getGetUpcomingEventsQueryKey() },
  });

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBanner />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Upcoming Events</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Next 60 days</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={events ?? []}
          keyExtractor={(item) => `${item.mareId}-${item.eventType}-${item.eventDate}`}
          renderItem={({ item }) => <EventItem event={item} />}
          scrollEnabled={!!(events && events.length > 0)}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 16 }]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>📅</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Upcoming Events</Text>
              <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>Events will appear here once you add breeding records for your mares.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 28, fontFamily: "DMSans_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "DMSans_400Regular", marginTop: 2 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingTop: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 48, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "DMSans_600SemiBold", textAlign: "center" },
  emptyMsg: { fontSize: 14, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 20 },
});
