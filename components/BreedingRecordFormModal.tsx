import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateBreedingRecord,
  useUpdateBreedingRecord,
  getGetMareQueryKey,
  getListBreedingRecordsQueryKey,
  getListMaresQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetUpcomingEventsQueryKey,
} from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { BreedingStatus } from "./StatusBadge";

type BreedingRecord = {
  id: number;
  stallionName?: string | null;
  firstHeatDate?: string | null;
  lastHeatDate?: string | null;
  bredDates?: string | null;
  isSuccessfullyBred?: boolean;
  confirmedInFoalDate?: string | null;
  status?: BreedingStatus;
  season?: string | null;
  notes?: string | null;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  mareId: number;
  initialValues?: BreedingRecord;
  isEditing?: boolean;
}

const STATUS_OPTIONS: { value: BreedingStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "bred", label: "Bred" },
  { value: "confirmed_in_foal", label: "In Foal" },
  { value: "foaled", label: "Foaled" },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BreedingRecordFormModal({ visible, onClose, mareId, initialValues, isEditing }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const createRecord = useCreateBreedingRecord();
  const updateRecord = useUpdateBreedingRecord();

  const [stallionName, setStallionName] = useState(initialValues?.stallionName ?? "");
  const [firstHeatDate, setFirstHeatDate] = useState(initialValues?.firstHeatDate ?? "");
  const [lastHeatDate, setLastHeatDate] = useState(initialValues?.lastHeatDate ?? "");
  const [bredDates, setBredDates] = useState(initialValues?.bredDates ?? "");
  const [isSuccessfullyBred, setIsSuccessfullyBred] = useState(initialValues?.isSuccessfullyBred ?? false);
  const [confirmedInFoalDate, setConfirmedInFoalDate] = useState(initialValues?.confirmedInFoalDate ?? "");
  const [status, setStatus] = useState<BreedingStatus>(initialValues?.status ?? "open");
  const [season, setSeason] = useState(initialValues?.season ?? new Date().getFullYear().toString());
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const addBredDate = () => {
    const t = today();
    setBredDates((prev) => (prev ? `${prev},${t}` : t));
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetMareQueryKey(mareId) });
    queryClient.invalidateQueries({ queryKey: getListBreedingRecordsQueryKey(mareId) });
    queryClient.invalidateQueries({ queryKey: getListMaresQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        stallionName: stallionName.trim() || null,
        firstHeatDate: firstHeatDate.trim() || null,
        lastHeatDate: lastHeatDate.trim() || null,
        bredDates: bredDates.trim() || null,
        isSuccessfullyBred,
        confirmedInFoalDate: confirmedInFoalDate.trim() || null,
        status,
        season: season.trim() || null,
        notes: notes.trim() || null,
      };
      if (isEditing && initialValues?.id) {
        await updateRecord.mutateAsync({ id: mareId, recordId: initialValues.id, data });
      } else {
        await createRecord.mutateAsync({ id: mareId, data });
      }
      invalidateAll();
      onClose();
    } catch {
      Alert.alert("Save failed", "Could not save record. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top > 0 ? insets.top : 16 }]}>
          <TouchableOpacity testID="record-cancel" onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isEditing ? "Edit Record" : "Add Breeding Record"}</Text>
          <TouchableOpacity testID="record-save" onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>STALLION</Text>
          <TextInput testID="input-stallion" style={inputStyle} value={stallionName} onChangeText={setStallionName} placeholder="Stallion / Sire name" placeholderTextColor={colors.mutedForeground} />

          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>HEAT CYCLE DATES</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>First Heat</Text>
              <TextInput testID="input-first-heat" style={inputStyle} value={firstHeatDate} onChangeText={setFirstHeatDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={styles.half}>
              <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>Last Heat</Text>
              <TextInput testID="input-last-heat" style={inputStyle} value={lastHeatDate} onChangeText={setLastHeatDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>

          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>BREEDING DATES</Text>
          <TextInput testID="input-bred-dates" style={inputStyle} value={bredDates} onChangeText={setBredDates} placeholder="YYYY-MM-DD, YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} />
          <TouchableOpacity testID="add-today-date" onPress={addBredDate} style={[styles.addDateBtn, { borderColor: colors.primary }]}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={[styles.addDateText, { color: colors.primary }]}>Add Today ({today()})</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>RESULT</Text>
          <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Successfully Bred</Text>
              <Text style={[styles.switchHint, { color: colors.mutedForeground }]}>Enables foaling date calculation</Text>
            </View>
            <Switch
              testID="toggle-successfully-bred"
              value={isSuccessfullyBred}
              onValueChange={(v) => {
                setIsSuccessfullyBred(v);
                if (v && status === "open") setStatus("bred");
              }}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <Text style={[styles.sublabel, { color: colors.mutedForeground, marginTop: 8 }]}>Confirmed In Foal Date (vet confirmed)</Text>
          <TextInput testID="input-confirmed-date" style={inputStyle} value={confirmedInFoalDate} onChangeText={(v) => { setConfirmedInFoalDate(v); if (v) setStatus("confirmed_in_foal"); }} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} />

          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>STATUS</Text>
          <View style={styles.statusPills}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                testID={`status-${opt.value}`}
                style={[styles.pill, { borderColor: status === opt.value ? colors.primary : colors.border, backgroundColor: status === opt.value ? colors.primary : colors.card }]}
                onPress={() => setStatus(opt.value)}
              >
                <Text style={[styles.pillText, { color: status === opt.value ? colors.primaryForeground : colors.foreground }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>SEASON & NOTES</Text>
          <View style={styles.row}>
            <View style={[styles.half, { maxWidth: 120 }]}>
              <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>Season Year</Text>
              <TextInput testID="input-season" style={inputStyle} value={season} onChangeText={setSeason} placeholder="2025" placeholderTextColor={colors.mutedForeground} keyboardType="number-pad" />
            </View>
          </View>
          <TextInput testID="input-record-notes" style={[inputStyle, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Notes about this breeding..." placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3} textAlignVertical="top" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerBtn: { padding: 4, width: 44 },
  headerTitle: { fontSize: 17, fontFamily: "DMSans_600SemiBold" },
  saveBtn: { backgroundColor: "#78533a", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 60, alignItems: "center" },
  saveBtnText: { fontSize: 15, fontFamily: "DMSans_600SemiBold", color: "#fff" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 8 },
  sectionHeader: { fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },
  sublabel: { fontSize: 12, fontFamily: "DMSans_400Regular", marginBottom: 4 },
  input: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontFamily: "DMSans_400Regular" },
  notesInput: { height: 80, paddingTop: 10 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  addDateBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start", marginTop: 6 },
  addDateText: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 10, borderWidth: 1 },
  switchLabel: { fontSize: 15, fontFamily: "DMSans_500Medium" },
  switchHint: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
  statusPills: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  pillText: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
});
