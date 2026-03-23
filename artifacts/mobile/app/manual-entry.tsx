import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";
import { SentencePair } from "@/models/SentencePair";

export default function ManualEntryScreen() {
  const [english, setEnglish] = useState("");
  const [russian, setRussian] = useState("");
  const [pairs, setPairs] = useState<SentencePair[]>([]);
  const russianRef = useRef<TextInput>(null);
  const { loadSentences, allSentences } = useQuiz();
  const insets = useSafeAreaInsets();

  const handleAdd = () => {
    const eng = english.trim();
    const rus = russian.trim();
    if (!eng || !rus) {
      Alert.alert("Both fields required", "Please fill in both the English and Russian sentence before adding.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPairs((prev) => [...prev, { english: eng, russian: rus }]);
    setEnglish("");
    setRussian("");
  };

  const handleRemove = (index: number) => {
    setPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (pairs.length === 0) {
      Alert.alert("No sentences", "Add at least one sentence pair before saving.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await loadSentences([...allSentences, ...pairs]);
    router.replace("/mode-select");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.navy }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Add Sentences</Text>
        <Text style={styles.subtitle}>
          Type each sentence pair and tap Add. Save when you're done.
        </Text>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>English</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Good morning"
            placeholderTextColor={Colors.textMuted}
            value={english}
            onChangeText={setEnglish}
            returnKeyType="next"
            onSubmitEditing={() => russianRef.current?.focus()}
            blurOnSubmit={false}
            autoCapitalize="sentences"
          />

          <View style={styles.divider} />

          <Text style={styles.inputLabel}>Russian</Text>
          <TextInput
            ref={russianRef}
            style={[styles.input, styles.russianInput]}
            placeholder="e.g. Доброе утро"
            placeholderTextColor={Colors.textMuted}
            value={russian}
            onChangeText={setRussian}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />

          <TouchableOpacity
            style={[styles.addBtn, (!english.trim() || !russian.trim()) && styles.addBtnDisabled]}
            onPress={handleAdd}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>+ Add Pair</Text>
          </TouchableOpacity>
        </View>

        {pairs.length > 0 && (
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Added ({pairs.length})</Text>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {pairs.map((pair, index) => (
            <View key={index} style={styles.pairCard}>
              <View style={styles.pairTexts}>
                <Text style={styles.pairEnglish}>{pair.english}</Text>
                <Text style={styles.pairRussian}>{pair.russian}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(index)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {pairs.length > 0 && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save {pairs.length} Sentence{pairs.length > 1 ? "s" : ""} & Start</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(41, 82, 255, 0.2)",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accentBlue,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.white,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  russianInput: {
    fontSize: 18,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 16,
  },
  addBtn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  addBtnDisabled: {
    opacity: 0.45,
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  listHeader: {
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 8,
  },
  pairCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentBlue,
  },
  pairTexts: {
    flex: 1,
    gap: 4,
  },
  pairEnglish: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.white,
  },
  pairRussian: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  removeBtnText: {
    fontSize: 13,
    color: Colors.wrongRed,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    backgroundColor: Colors.correctGreen,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 12,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
});
