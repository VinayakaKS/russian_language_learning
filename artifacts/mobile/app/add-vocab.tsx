import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";
import { parseSpreadsheet } from "@/utils/parseSpreadsheet";

export default function AddVocabScreen() {
  const [loading, setLoading] = useState(false);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const { loadSentences } = useQuiz();
  const insets = useSafeAreaInsets();
  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];

      setLoading(true);

      const pairs = await parseSpreadsheet(file.uri, file.name);
      if (pairs.length === 0) {
        throw new Error("No valid sentence pairs found. Make sure column A has English and column B has Russian.");
      }

      await loadSentences(pairs);
      setParsedCount(pairs.length);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.push("/"), 700);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Import Failed", err?.message ?? "Could not read the file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 16 + webTopPadding,
        paddingBottom: insets.bottom + 28,
        paddingHorizontal: 22,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Vocabulary</Text>
      </View>

      <View style={styles.optionsWrap}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handlePick}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Ionicons name="cloud-upload-outline" size={32} color={Colors.accentBlue} />
          <View style={styles.textWrap}>
            <Text style={styles.optionTitle}>Import File</Text>
            <Text style={styles.optionSubtitle}>Upload an Excel or CSV file</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push("/manual-entry")}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={32} color={Colors.gold} />
          <View style={styles.textWrap}>
            <Text style={styles.optionTitle}>Add Manually</Text>
            <Text style={styles.optionSubtitle}>Type sentences one by one</Text>
          </View>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.feedbackRow}>
          <ActivityIndicator size="small" color={Colors.accentBlue} />
          <Text style={styles.feedbackText}>Importing vocabulary...</Text>
        </View>
      )}

      {parsedCount !== null && !loading && (
        <Text style={styles.successText}>✓ {parsedCount} sentences imported</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  topBar: {
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 10,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  optionsWrap: {
    gap: 14,
  },
  optionCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.navyCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 20,
  },
  textWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    marginBottom: 3,
  },
  optionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  feedbackRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedbackText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  successText: {
    marginTop: 16,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.correctGreen,
  },
});
