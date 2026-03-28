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
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";
import { parseSpreadsheet } from "@/utils/parseSpreadsheet";

export default function UploadScreen() {
  const [loading, setLoading] = useState(false);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { loadSentences } = useQuiz();
  const insets = useSafeAreaInsets();

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
      setFileName(file.name);

      const pairs = await parseSpreadsheet(file.uri, file.name);
      if (pairs.length === 0) {
        throw new Error("No valid sentence pairs found. Make sure column A has English and column B has Russian.");
      }

      await loadSentences(pairs);
      setParsedCount(pairs.length);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Import Failed", err?.message ?? "Could not read the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    router.push("/mode-select");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.navy }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Russian Lingua</Text>
        <Text style={styles.subtitle}>Import your vocabulary to get started</Text>
      </View>

      <View style={styles.uploadArea}>
        <View style={styles.iconBg}>
          <Text style={styles.uploadEmoji}>📤</Text>
        </View>
        <Text style={styles.uploadTitle}>Import Vocabulary</Text>
        <Text style={styles.uploadHint}>
          Upload an .xlsx or .csv file with English in column A and Russian in column B
        </Text>

        <TouchableOpacity
          style={[styles.pickBtn, loading && styles.pickBtnDisabled]}
          onPress={handlePick}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.pickBtnText}>Choose File</Text>
          )}
        </TouchableOpacity>

        {parsedCount !== null && (
          <View style={styles.successBadge}>
            <Text style={styles.successText}>✓ {parsedCount} sentences loaded</Text>
            {fileName && <Text style={styles.fileNameText}>{fileName}</Text>}
          </View>
        )}
      </View>

      <View style={styles.formatCard}>
        <Text style={styles.formatTitle}>Expected Format</Text>
        <View style={styles.formatRow}>
          <View style={[styles.formatCell, styles.formatHeader]}>
            <Text style={styles.formatHeaderText}>Column A</Text>
          </View>
          <View style={[styles.formatCell, styles.formatHeader]}>
            <Text style={styles.formatHeaderText}>Column B</Text>
          </View>
        </View>
        <View style={styles.formatRow}>
          <View style={styles.formatCell}>
            <Text style={styles.formatCellText}>Hello, how are you?</Text>
          </View>
          <View style={styles.formatCell}>
            <Text style={[styles.formatCellText, styles.cyrillicText]}>Привет, как дела?</Text>
          </View>
        </View>
        <View style={styles.formatRow}>
          <View style={styles.formatCell}>
            <Text style={styles.formatCellText}>Good morning</Text>
          </View>
          <View style={styles.formatCell}>
            <Text style={[styles.formatCellText, styles.cyrillicText]}>Доброе утро</Text>
          </View>
        </View>
      </View>

      {parsedCount !== null && (
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>Continue to Quiz</Text>
        </TouchableOpacity>
      )}

      <View style={styles.orDivider}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.orLine} />
      </View>

      <TouchableOpacity
        style={styles.manualBtn}
        onPress={() => router.push("/manual-entry")}
        activeOpacity={0.85}
      >
        <Text style={styles.manualBtnText}>Type Sentences Manually</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  uploadArea: {
    backgroundColor: Colors.navyCard,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(41, 82, 255, 0.2)",
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "rgba(41, 82, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  uploadEmoji: {
    fontSize: 40,
  },
  uploadTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentBlue,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 8,
    minWidth: 140,
    justifyContent: "center",
  },
  pickBtnDisabled: {
    opacity: 0.7,
  },
  pickBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  successBadge: {
    marginTop: 20,
    alignItems: "center",
    gap: 4,
  },
  successText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.correctGreen,
  },
  fileNameText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  formatCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  formatTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  formatRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  formatCell: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    padding: 8,
  },
  formatHeader: {
    backgroundColor: "rgba(41, 82, 255, 0.15)",
  },
  formatHeaderText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accentBlue,
    textAlign: "center",
  },
  formatCellText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  cyrillicText: {
    fontFamily: "Inter_400Regular",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentBlue,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  startBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  orText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  manualBtn: {
    borderWidth: 1,
    borderColor: "rgba(41, 82, 255, 0.35)",
    backgroundColor: "rgba(41, 82, 255, 0.07)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  manualBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accentBlue,
  },
});
