import { Ionicons } from "@expo/vector-icons";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { StatusBadge, type BreedingStatus } from "./StatusBadge";

type BreedingRecord = {
  id: number;
  mareId: number;
  stallionName?: string | null;
  firstHeatDate?: string | null;
  lastHeatDate?: string | null;
  bredDates?: string | null;
  isSuccessfullyBred: boolean;
  confirmedInFoalDate?: string | null;
  expectedFoalingStart?: string | null;
  expectedFoalingAverage?: string | null;
  expectedFoalingEnd?: string | null;
  expectedHeatReturn?: string | null;
  heatReturnWindowStart?: string | null;
  heatReturnWindowEnd?: string | null;
  vetCheckEligibleDate?: string | null;
  status: BreedingStatus;
  season?: string | null;
  notes?: string | null;
  createdAt: string;
};

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DateRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={styles.dateRow}>
      <Ionicons name={icon as any} size={14} color={color ?? colors.mutedForeground} />
      <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.dateValue, { color: color ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

interface Props {
  record: BreedingRecord;
  onEdit: () => void;
  onDelete: () => void;
}

export function BreedingRecordCard({ record, onEdit, onDelete }: Props) {
  const colors = useColors();

  const confirmDelete = () => {
    Alert.alert("Delete Record", "Remove this breeding record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  const bredDatesList = record.bredDates
    ? record.bredDates.split(",").map((d) => fmtDate(d.trim())).join(", ")
    : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <StatusBadge status={record.status} />
          {record.season && (
            <Text style={[styles.season, { color: colors.mutedForeground }]}>Season {record.season}</Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity testID={`edit-record-${record.id}`} onPress={onEdit} style={styles.actionBtn}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity testID={`delete-record-${record.id}`} onPress={confirmDelete} style={styles.actionBtn}>
            <Ionicons name="trash" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {record.stallionName && (
        <Text style={[styles.stallion, { color: colors.foreground }]}>x {record.stallionName}</Text>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.datesGrid}>
        {record.firstHeatDate && (
          <DateRow icon="flame-outline" label="Heat Started" value={fmtDate(record.firstHeatDate)} />
        )}
        {record.lastHeatDate && (
          <DateRow icon="flame" label="Heat Ended" value={fmtDate(record.lastHeatDate)} />
        )}
        {bredDatesList && (
          <DateRow icon="heart" label="Bred" value={bredDatesList} color={colors.primary} />
        )}
        {record.vetCheckEligibleDate && (
          <DateRow icon="medkit-outline" label="Vet Check Eligible" value={fmtDate(record.vetCheckEligibleDate)} color="#10b981" />
        )}
        {record.confirmedInFoalDate && (
          <DateRow icon="checkmark-circle" label="Confirmed In Foal" value={fmtDate(record.confirmedInFoalDate)} color="#10b981" />
        )}

        {!record.isSuccessfullyBred && record.heatReturnWindowStart && (
          <>
            <View style={[styles.sectionLabel]}>
              <Text style={[styles.sectionLabelText, { color: colors.mutedForeground }]}>Heat Return Window</Text>
            </View>
            <DateRow icon="sync-outline" label="Earliest" value={fmtDate(record.heatReturnWindowStart)} color="#f59e0b" />
            <DateRow icon="sync" label="Expected" value={fmtDate(record.expectedHeatReturn)} color="#f59e0b" />
            {record.heatReturnWindowEnd && (
              <DateRow icon="sync-outline" label="Latest" value={fmtDate(record.heatReturnWindowEnd)} color="#f59e0b" />
            )}
          </>
        )}

        {record.isSuccessfullyBred && record.expectedFoalingStart && (
          <>
            <View style={styles.sectionLabel}>
              <Text style={[styles.sectionLabelText, { color: colors.mutedForeground }]}>Foaling Window</Text>
            </View>
            <DateRow icon="star-outline" label="Earliest (320d)" value={fmtDate(record.expectedFoalingStart)} color="#6366f1" />
            <DateRow icon="star" label="Average (340d)" value={fmtDate(record.expectedFoalingAverage)} color="#6366f1" />
            {record.expectedFoalingEnd && (
              <DateRow icon="star-outline" label="Latest (365d)" value={fmtDate(record.expectedFoalingEnd)} color="#8b5cf6" />
            )}
          </>
        )}
      </View>

      {record.notes && (
        <View style={[styles.notesBox, { backgroundColor: colors.muted }]}>
          <Text style={[styles.notesText, { color: colors.foreground }]}>{record.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginVertical: 6,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  season: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  actions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 6 },
  stallion: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
  divider: { height: 1, marginVertical: 2 },
  datesGrid: { gap: 6 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateLabel: { fontSize: 12, fontFamily: "DMSans_400Regular", flex: 1 },
  dateValue: { fontSize: 12, fontFamily: "DMSans_600SemiBold", textAlign: "right" },
  sectionLabel: { marginTop: 4 },
  sectionLabelText: { fontSize: 11, fontFamily: "DMSans_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  notesBox: { borderRadius: 8, padding: 10 },
  notesText: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 19 },
});
