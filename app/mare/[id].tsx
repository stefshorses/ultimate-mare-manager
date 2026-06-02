import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMare,
  useDeleteMare,
  useDeleteBreedingRecord,
  getGetMareQueryKey,
  getListMaresQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetUpcomingEventsQueryKey,
} from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Image as RNImage,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "@/components/StatusBadge";
import { BreedingRecordCard } from "@/components/BreedingRecordCard";
import { MareFormModal } from "@/components/MareFormModal";
import { BreedingRecordFormModal } from "@/components/BreedingRecordFormModal";

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
const IMAGE_ASPECT = 1070 / 465;
const mareFoal = require("../../assets/images/mare_foal_landscape.png");

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  const colors = useColors();
  if (!value && value !== 0) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{String(value)}</Text>
    </View>
  );
}

export default function MareDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mareId = Number(id);
  const queryClient = useQueryClient();
  const deleteMare = useDeleteMare();
  const deleteRecord = useDeleteBreedingRecord();

  const [showEditMare, setShowEditMare] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const { data: mare, isLoading, refetch, isRefetching } = useGetMare(mareId, {
    query: { enabled: !!mareId, queryKey: getGetMareQueryKey(mareId) },
  });

  const invalidateAfterRecordChange = () => {
    queryClient.invalidateQueries({ queryKey: getGetMareQueryKey(mareId) });
    queryClient.invalidateQueries({ queryKey: getListMaresQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
  };

  const handleDeleteMare = () => {
    Alert.alert(
      "Delete Mare",
      `Remove ${mare?.registeredName ?? mare?.stableName ?? "this mare"} from your herd? All breeding records will also be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteMare.mutateAsync({ id: mareId });
            queryClient.invalidateQueries({ queryKey: getListMaresQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
            router.back();
          },
        },
      ],
    );
  };

  const handleDeleteRecord = (recordId: number) => {
    deleteRecord.mutate(
      { id: mareId, recordId },
      { onSuccess: invalidateAfterRecordChange },
    );
  };

  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const screenWidth = Dimensions.get("window").width;
  const imageHeight = Math.round(screenWidth / IMAGE_ASPECT);

  const name = mare?.registeredName || mare?.stableName || "Unnamed Mare";
  const nickname = mare?.registeredName && mare?.stableName ? `"${mare.stableName}"` : null;

  const photoUri = mare?.photoUrl
    ? mare.photoUrl.startsWith("http")
      ? mare.photoUrl
      : `https://${process.env.EXPO_PUBLIC_DOMAIN}${mare.photoUrl}`
    : null;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!mare) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>Mare not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const latestRecord = mare.breedingRecords?.[mare.breedingRecords.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Banner — identical height/structure to AppBanner on the home screen */}
      <View>
        <LinearGradient
          colors={WOOD_GRAIN}
          locations={WOOD_LOCATIONS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.38 }}
          style={[styles.banner, { paddingTop: topPad }]}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.grainLine, { top: "25%" }]} />
            <View style={[styles.grainLine, { top: "55%" }]} />
            <View style={[styles.grainLine, { top: "80%" }]} />
          </View>
          <RNImage
            source={mareFoal}
            style={{ width: screenWidth, height: imageHeight }}
            resizeMode="contain"
          />
        </LinearGradient>

        {/* Nav buttons float absolutely — zero impact on banner height */}
        <View style={[styles.navRow, { top: topPad }]}>
          <TouchableOpacity testID="back-button" onPress={() => router.back()} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={26} color="rgba(255,255,255,0.92)" />
          </TouchableOpacity>
          <View style={styles.navActions}>
            <TouchableOpacity testID="edit-mare" onPress={() => setShowEditMare(true)} style={styles.navBtn}>
              <Ionicons name="pencil-outline" size={22} color="rgba(255,255,255,0.92)" />
            </TouchableOpacity>
            <TouchableOpacity testID="delete-mare" onPress={handleDeleteMare} style={styles.navBtn}>
              <Ionicons name="trash-outline" size={22} color="rgba(255,180,180,0.92)" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mare identity strip below the banner */}
      <View style={[styles.heroSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Image
          source={photoUri ? { uri: photoUri } : require("../../assets/images/icon.png")}
          style={[styles.heroPhoto, { backgroundColor: colors.muted }]}
          contentFit="cover"
        />
        <View style={styles.heroInfo}>
          <Text style={[styles.mareName, { color: colors.foreground }]}>{name}</Text>
          {nickname && <Text style={[styles.nickname, { color: colors.mutedForeground }]}>{nickname}</Text>}
          {latestRecord?.status && <StatusBadge status={latestRecord.status as any} />}
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 80 }]}
      >
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mare Info</Text>
          <InfoRow label="Breed" value={mare.breed} />
          <InfoRow label="Registration #" value={mare.registrationNumber} />
          <InfoRow label="Year of Birth" value={mare.yearOfBirth} />
          <InfoRow label="Previous Foals" value={mare.previousFoals} />
          <InfoRow label="Owner" value={mare.owner} />
          {!mare.breed && !mare.registrationNumber && !mare.yearOfBirth && !mare.previousFoals && !mare.owner && (
            <Text style={[styles.noInfo, { color: colors.mutedForeground }]}>Tap the edit button to add mare details.</Text>
          )}
        </View>

        {mare.notes ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes</Text>
            <Text style={[styles.notesText, { color: colors.foreground }]}>{mare.notes}</Text>
          </View>
        ) : null}

        <View style={styles.recordsHeader}>
          <Text style={[styles.recordsTitle, { color: colors.foreground }]}>Breeding Records</Text>
          <TouchableOpacity testID="add-breeding-record" onPress={() => setShowAddRecord(true)} style={[styles.addRecordBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color={colors.primaryForeground} />
            <Text style={[styles.addRecordText, { color: colors.primaryForeground }]}>Add Record</Text>
          </TouchableOpacity>
        </View>

        {mare.breedingRecords && mare.breedingRecords.length > 0 ? (
          <View style={styles.records}>
            {[...mare.breedingRecords].reverse().map((record) => (
              <BreedingRecordCard
                key={record.id}
                record={record as any}
                onEdit={() => setEditingRecord(record)}
                onDelete={() => handleDeleteRecord(record.id)}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyRecords, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="heart-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No breeding records yet</Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>Tap "Add Record" to track a breeding cycle.</Text>
          </View>
        )}
      </ScrollView>

      {showEditMare && (
        <MareFormModal
          visible={showEditMare}
          onClose={() => setShowEditMare(false)}
          initialValues={mare as any}
          isEditing
        />
      )}

      {showAddRecord && (
        <BreedingRecordFormModal
          visible={showAddRecord}
          onClose={() => setShowAddRecord(false)}
          mareId={mareId}
        />
      )}

      {editingRecord && (
        <BreedingRecordFormModal
          visible={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          mareId={mareId}
          initialValues={editingRecord}
          isEditing
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, fontFamily: "DMSans_500Medium" },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 15, fontFamily: "DMSans_500Medium" },

  /* Banner */
  banner: { width: "100%", overflow: "hidden" },
  grainLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(0,0,0,0.15)" },
  navRow: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  navBtn: { padding: 10 },
  navActions: { flexDirection: "row" },

  /* Hero identity */
  heroSection: { flexDirection: "row", padding: 16, gap: 14, alignItems: "center", borderBottomWidth: 1 },
  heroPhoto: { width: 72, height: 72, borderRadius: 36 },
  heroInfo: { flex: 1, gap: 5 },
  mareName: { fontSize: 22, fontFamily: "Rye_400Regular", lineHeight: 28 },
  nickname: { fontSize: 14, fontFamily: "DMSans_400Regular", marginTop: -2 },

  /* Content */
  scroll: { gap: 0 },
  section: { margin: 16, marginBottom: 0, borderRadius: 12, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: "Rye_400Regular", marginBottom: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  infoValue: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  noInfo: { fontSize: 13, fontFamily: "DMSans_400Regular", textAlign: "center", paddingVertical: 4 },
  notesText: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 21 },
  recordsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 20, marginBottom: 4 },
  recordsTitle: { fontSize: 15, fontFamily: "Rye_400Regular" },
  addRecordBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addRecordText: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  records: { paddingHorizontal: 16, gap: 6 },
  emptyRecords: { margin: 16, borderRadius: 12, borderWidth: 1, padding: 32, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  emptyHint: { fontSize: 12, fontFamily: "DMSans_400Regular", textAlign: "center" },
});
