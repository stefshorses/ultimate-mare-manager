import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateMare,
  useUpdateMare,
  useRequestUploadUrl,
  getListMaresQueryKey,
  getGetMareQueryKey,
  getGetDashboardSummaryQueryKey,
} from "../api-client";
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

type MareData = {
  id?: number;
  registeredName?: string | null;
  stableName?: string | null;
  breed?: string | null;
  registrationNumber?: string | null;
  yearOfBirth?: number | null;
  previousFoals?: number | null;
  owner?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  initialValues?: MareData;
  isEditing?: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

export function MareFormModal({ visible, onClose, initialValues, isEditing }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const createMare = useCreateMare();
  const updateMare = useUpdateMare();
  const requestUploadUrl = useRequestUploadUrl();

  const [registeredName, setRegisteredName] = useState(initialValues?.registeredName ?? "");
  const [stableName, setStableName] = useState(initialValues?.stableName ?? "");
  const [breed, setBreed] = useState(initialValues?.breed ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(initialValues?.registrationNumber ?? "");
  const [yearOfBirth, setYearOfBirth] = useState(initialValues?.yearOfBirth?.toString() ?? "");
  const [previousFoals, setPreviousFoals] = useState(initialValues?.previousFoals?.toString() ?? "");
  const [owner, setOwner] = useState(initialValues?.owner ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [photoUrl, setPhotoUrl] = useState(initialValues?.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const filename = asset.uri.split("/").pop() ?? "photo.jpg";
      const { uploadUrl, objectPath } = await requestUploadUrl.mutateAsync({
        data: { filename, contentType: "image/jpeg", size: asset.fileSize ?? 500000 },
      });
      const fileResp = await fetch(asset.uri);
      const blob = await fileResp.blob();
      await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg" } });
      setPhotoUrl(`/api/storage/objects/${objectPath}`);
    } catch {
      Alert.alert("Upload failed", "Could not upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        registeredName: registeredName.trim() || null,
        stableName: stableName.trim() || null,
        breed: breed.trim() || null,
        registrationNumber: registrationNumber.trim() || null,
        yearOfBirth: yearOfBirth ? parseInt(yearOfBirth) : null,
        previousFoals: previousFoals ? parseInt(previousFoals) : null,
        owner: owner.trim() || null,
        notes: notes.trim() || null,
        photoUrl: photoUrl.trim() || null,
      };

      if (isEditing && initialValues?.id) {
        await updateMare.mutateAsync({ id: initialValues.id, data });
        queryClient.invalidateQueries({ queryKey: getGetMareQueryKey(initialValues.id) });
      } else {
        await createMare.mutateAsync({ data });
      }
      queryClient.invalidateQueries({ queryKey: getListMaresQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      onClose();
    } catch {
      Alert.alert("Save failed", "Could not save mare. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resolvedPhotoUrl = photoUrl
    ? photoUrl.startsWith("http") ? photoUrl : `https://${process.env.EXPO_PUBLIC_DOMAIN}${photoUrl}`
    : null;

  const inputStyle = [styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top > 0 ? insets.top : 16 }]}>
          <TouchableOpacity testID="form-cancel" onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isEditing ? "Edit Mare" : "Add Mare"}</Text>
          <TouchableOpacity testID="form-save" onPress={handleSave} disabled={saving || uploading} style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="pick-photo" onPress={pickPhoto} style={[styles.photoPicker, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : resolvedPhotoUrl ? (
              <Image source={{ uri: resolvedPhotoUrl }} style={styles.photoPreview} contentFit="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={28} color={colors.mutedForeground} />
                <Text style={[styles.photoHint, { color: colors.mutedForeground }]}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <Field label="Registered Name">
            <TextInput testID="input-registered-name" style={inputStyle} value={registeredName} onChangeText={setRegisteredName} placeholder="e.g. Sunfire Dancing Queen" placeholderTextColor={colors.mutedForeground} returnKeyType="next" />
          </Field>
          <Field label="Stable Name (Nickname)">
            <TextInput testID="input-stable-name" style={inputStyle} value={stableName} onChangeText={setStableName} placeholder="e.g. Queenie" placeholderTextColor={colors.mutedForeground} returnKeyType="next" />
          </Field>
          <Field label="Breed">
            <TextInput testID="input-breed" style={inputStyle} value={breed} onChangeText={setBreed} placeholder="e.g. Quarter Horse" placeholderTextColor={colors.mutedForeground} returnKeyType="next" />
          </Field>
          <Field label="Registration Number">
            <TextInput testID="input-reg-number" style={inputStyle} value={registrationNumber} onChangeText={setRegistrationNumber} placeholder="e.g. AQHA-1234567" placeholderTextColor={colors.mutedForeground} returnKeyType="next" />
          </Field>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Year of Birth</Text>
              <TextInput testID="input-year-of-birth" style={inputStyle} value={yearOfBirth} onChangeText={setYearOfBirth} placeholder="2018" placeholderTextColor={colors.mutedForeground} keyboardType="number-pad" returnKeyType="next" />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Previous Foals</Text>
              <TextInput testID="input-previous-foals" style={inputStyle} value={previousFoals} onChangeText={setPreviousFoals} placeholder="0" placeholderTextColor={colors.mutedForeground} keyboardType="number-pad" returnKeyType="next" />
            </View>
          </View>
          <Field label="Owner">
            <TextInput testID="input-owner" style={inputStyle} value={owner} onChangeText={setOwner} placeholder="e.g. Jane Smith" placeholderTextColor={colors.mutedForeground} returnKeyType="next" />
          </Field>
          <Field label="Notes">
            <TextInput testID="input-notes" style={[inputStyle, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Add notes about this mare..." placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} textAlignVertical="top" />
          </Field>
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
  saveBtnText: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 4 },
  photoPicker: { alignSelf: "center", width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderStyle: "dashed", overflow: "hidden", marginBottom: 16, alignItems: "center", justifyContent: "center" },
  photoPreview: { width: "100%", height: "100%" },
  photoPlaceholder: { alignItems: "center", gap: 4 },
  photoHint: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  field: { marginVertical: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "DMSans_500Medium", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  input: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontFamily: "DMSans_400Regular" },
  notesInput: { height: 100, paddingTop: 10 },
  row: { flexDirection: "row", gap: 12, marginVertical: 6 },
  halfField: { flex: 1 },
});
