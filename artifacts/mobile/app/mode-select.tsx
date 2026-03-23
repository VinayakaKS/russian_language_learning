import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";
import { QuizMode } from "@/models/QuizMode";

export default function ModeSelectScreen() {
  const { mode, setMode, startRound, allSentences } = useQuiz();
  const insets = useSafeAreaInsets();

  const handleSelectMode = (m: QuizMode) => {
    setMode(m);
    Haptics.selectionAsync();
  };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startRound();
    router.push("/quiz");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={Colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Select Mode</Text>
        <Text style={styles.subtitle}>{allSentences.length} sentences loaded</Text>
      </View>

      <View style={styles.modesContainer}>
        <ModeCard
          selected={mode === "englishToRussian"}
          onPress={() => handleSelectMode("englishToRussian")}
          fromLang="English" toLang="Russian"
          fromFlag="🇬🇧" toFlag="🇷🇺"
          description="See English, choose the Russian translation"
        />
        <ModeCard
          selected={mode === "russianToEnglish"}
          onPress={() => handleSelectMode("russianToEnglish")}
          fromLang="Russian" toLang="English"
          fromFlag="🇷🇺" toFlag="🇬🇧"
          description="See Russian Cyrillic, choose the English meaning"
        />
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="sparkles-outline" size={16} color={Colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Spaced Repetition</Text>
          <Text style={styles.infoText}>
            Words you get wrong appear more often until you master them.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
        <Ionicons name="play" size={20} color={Colors.white} />
        <Text style={styles.startBtnText}>Start 10-Question Round</Text>
      </TouchableOpacity>
    </View>
  );
}

function ModeCard({ selected, onPress, fromLang, toLang, fromFlag, toFlag, description }: {
  selected: boolean; onPress: () => void;
  fromLang: string; toLang: string;
  fromFlag: string; toFlag: string;
  description: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.modeCard, selected && styles.modeCardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.modeCardInner}>
        <View style={styles.langRow}>
          <View style={styles.langPill}>
            <Text style={styles.flagText}>{fromFlag}</Text>
            <Text style={styles.langText}>{fromLang}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={selected ? Colors.accentBlue : Colors.textMuted} />
          <View style={styles.langPill}>
            <Text style={styles.flagText}>{toFlag}</Text>
            <Text style={styles.langText}>{toLang}</Text>
          </View>
        </View>
        <Text style={[styles.modeDesc, selected && styles.modeDescSelected]}>{description}</Text>
      </View>
      {selected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={22} color={Colors.accentBlue} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy, paddingHorizontal: 22 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.navyCard,
    alignItems: "center", justifyContent: "center",
    marginBottom: 18, borderWidth: 1, borderColor: Colors.border,
  },
  header: { marginBottom: 24 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", color: Colors.white, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  modesContainer: { gap: 12, marginBottom: 18 },
  modeCard: {
    backgroundColor: Colors.navyCard, borderRadius: 18,
    padding: 18, borderWidth: 2, borderColor: "transparent",
    flexDirection: "row", alignItems: "center",
  },
  modeCardSelected: { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + "12" },
  modeCardInner: { flex: 1, gap: 10 },
  langRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  langPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.navyLight, borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  flagText: { fontSize: 16 },
  langText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.white },
  modeDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 18 },
  modeDescSelected: { color: "rgba(255,255,255,0.75)" },
  checkmark: { marginLeft: 12 },
  infoCard: {
    backgroundColor: Colors.gold + "10", borderRadius: 14,
    padding: 14, flexDirection: "row", alignItems: "flex-start",
    gap: 10, marginBottom: 24, borderWidth: 1, borderColor: Colors.gold + "25",
  },
  infoTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.gold, marginBottom: 3 },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 17 },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accentBlue, paddingVertical: 18, borderRadius: 16, gap: 10,
  },
  startBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.white },
});
