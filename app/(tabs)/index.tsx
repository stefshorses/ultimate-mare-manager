import { Ionicons } from "@expo/vector-icons";
import {
  useListMares,
  useGetDashboardSummary,
  getListMaresQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLayout } from "@/hooks/useLayout";
import { AppBanner } from "@/components/AppBanner";
import { MareCard } from "@/components/MareCard";
import { MareFormModal } from "@/components/MareFormModal";
import { useSubscription } from "@/contexts/SubscriptionContext";

const FREE_MARE_LIMIT = 1;

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function HerdScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { screenWidth, horizontalPad } = useLayout();
  const [search, setSearch] = useState("");
  const [showAddMare, setShowAddMare] = useState(false);
  const { isPremium, isLoading: rcLoading, setShowPaywall } = useSubscription();

  const { data: mares, isLoading, refetch, isRefetching } = useListMares({
    query: { queryKey: getListMaresQueryKey() },
  });
  const { data: summary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });

  const mareCount = mares?.length ?? 0;
  const atFreeLimit = !rcLoading && !isPremium && mareCount >= FREE_MARE_LIMIT;

  const handleAddMare = () => {
    if (atFreeLimit) {
      setShowPaywall(true);
    } else {
      setShowAddMare(true);
    }
  };

  const filtered = (mares ?? []).filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (m.registeredName ?? "").toLowerCase().includes(q) ||
      (m.stableName ?? "").toLowerCase().includes(q) ||
      (m.breed ?? "").toLowerCase().includes(q) ||
      (m.owner ?? "").toLowerCase().includes(q)
    );
  });

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const listHPad = Math.max(0, (screenWidth - 560) / 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBanner />
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: horizontalPad }]}>
        <View style={styles.headerTop}>
          <View style={styles.appTitle}>
            <Text style={[styles.titleThe, { color: colors.primary }]}>THE</Text>
            <Text style={[styles.titleUltimate, { color: colors.foreground }]}>ULTIMATE</Text>
            <Text style={[styles.titleSub, { color: colors.primary }]}>Mare Manager</Text>
          </View>
          <TouchableOpacity testID="button-add-mare" onPress={handleAddMare} style={[styles.addBtn, { backgroundColor: atFreeLimit ? colors.mutedForeground : colors.primary }]}>
            <Ionicons name={atFreeLimit ? "lock-closed" : "add"} size={22} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {!isPremium && (
          <TouchableOpacity
            style={[styles.upgradeBanner, { backgroundColor: "#92400e" }]}
            onPress={() => setShowPaywall(true)}
          >
            <Ionicons name="star" size={14} color="#fde68a" />
            <Text style={styles.upgradeText}>
              {atFreeLimit
                ? `Free limit reached (${FREE_MARE_LIMIT} mares) — Upgrade to add more`
                : `${FREE_MARE_LIMIT - mareCount} free mare${FREE_MARE_LIMIT - mareCount === 1 ? "" : "s"} remaining · Upgrade for unlimited`}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#fde68a" />
          </TouchableOpacity>
        )}

        {summary && (
          <View style={styles.stats}>
            <StatPill label="Total" value={summary.totalMares} color={colors.foreground} />
            <StatPill label="Bred" value={summary.maresCurrentlyBred} color="#92400e" />
            <StatPill label="In Foal" value={summary.maresConfirmedInFoal} color="#065f46" />
            <StatPill label="Due Soon" value={summary.maresDueSoon} color="#6366f1" />
          </View>
        )}

        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            testID="search-mares"
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search mares..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity testID="clear-search" onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MareCard mare={item} />}
          scrollEnabled={!!(filtered.length > 0)}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 16, paddingHorizontal: listHPad }]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="leaf-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {search ? "No mares found" : "No mares yet"}
              </Text>
              <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>
                {search ? "Try a different search term." : "Tap the + button to add your first mare."}
              </Text>
            </View>
          }
        />
      )}

      <MareFormModal visible={showAddMare} onClose={() => setShowAddMare(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  appTitle: { flexDirection: "column", gap: 0 },
  titleThe: { fontSize: 10, fontFamily: "Rye_400Regular", letterSpacing: 6 },
  titleUltimate: { fontSize: 34, fontFamily: "Rye_400Regular", letterSpacing: 1.5, lineHeight: 42 },
  titleSub: { fontSize: 16, fontFamily: "Rye_400Regular", letterSpacing: 2, marginTop: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", gap: 8 },
  statPill: { flex: 1, alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, gap: 2 },
  statValue: { fontSize: 20, fontFamily: "Rye_400Regular" },
  statLabel: { fontSize: 10, fontFamily: "Rye_400Regular", textTransform: "uppercase" },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "DMSans_400Regular", padding: 0 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingTop: 10 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 48, gap: 10 },
  upgradeBanner: { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, gap: 6 },
  upgradeText: { flex: 1, fontSize: 12, fontFamily: "DMSans_500Medium", color: "#fde68a" },
  emptyTitle: { fontSize: 18, fontFamily: "DMSans_600SemiBold", textAlign: "center" },
  emptyMsg: { fontSize: 14, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 20 },
});
