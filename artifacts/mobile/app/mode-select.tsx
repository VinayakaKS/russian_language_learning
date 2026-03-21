import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
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
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Select Mode</Text>
        <Text style={styles.subtitle}>{allSentences.length} sentences loaded</Text>
      </View>

      <View style={styles.modesContainer}>
        <ModeCard
          selected={mode === "englishToRussian"}
          onPress={() => handleSelectMode("englishToRussian")}
          fromLang="English"
          toLang="Russian"
          fromFlag="🇬🇧"
          toFlag="🇷🇺"
          description="See English, choose the Russian translation"
        />
        <ModeCard
          selected={mode === "russianToEnglish"}
          onPress={() => handleSelectMode("russianToEnglish")}
          fromLang="Russian"
          toLang="English"
          fromFlag="🇷🇺"
          toFlag="🇬🇧"
          description="See Russian Cyrillic, choose the English meaning"
        />
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="sparkles-outline" size={18} color={Colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Spaced Repetition</Text>
          <Text style={styles.infoText}>
            Words you get wrong appear more often. Master the ones you struggle with first.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
        <Text style={styles.startBtnText}>Start 10-Question Round</Text>
        <Ionicons name="play" size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

function ModeCard({
  selected,
  onPress,
  fromLang,
  toLang,
  fromFlag,
  toFlag,
  description,
}: {
  selected: boolean;
  onPress: () => void;
  fromLang: string;
  toLang: string;
  fromFlag: string;
  toFlag: string;
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
          <Ionicons name="arrow-forward" size={18} color={selected ? Colors.accentBlue : Colors.textMuted} />
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
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
    paddingHorizontal: 24,
  },
  backBtn: {
    marginBottom: 16,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.navyCard,
    borderRadius: 12,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  modesContainer: {
    gap: 14,
    marginBottom: 20,
  },
  modeCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },
  modeCardSelected: {
    borderColor: Colors.accentBlue,
    backgroundColor: "rgba(41, 82, 255, 0.1)",
  },
  modeCardInner: {
    flex: 1,
    gap: 10,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  flagText: {
    fontSize: 16,
  },
  langText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  modeDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 20,
  },
  modeDescSelected: {
    color: "rgba(255,255,255,0.7)",
  },
  checkmark: {
    marginLeft: 12,
  },
  infoCard: {
    backgroundColor: "rgba(255, 209, 102, 0.08)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 209, 102, 0.15)",
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.gold,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 18,
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
});
