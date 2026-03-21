import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";

export default function ResultsScreen() {
  const { correctCount, wrongCount, wrongInRound, mode, startRound } = useQuiz();
  const insets = useSafeAreaInsets();

  const total = correctCount + wrongCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const getAccuracyColor = () => {
    if (accuracy >= 80) return Colors.correctGreen;
    if (accuracy >= 50) return Colors.gold;
    return Colors.wrongRed;
  };

  const getAccuracyMessage = () => {
    if (accuracy === 100) return "Perfect! Excellent work!";
    if (accuracy >= 80) return "Great job! Keep it up!";
    if (accuracy >= 60) return "Good effort! Practice more!";
    if (accuracy >= 40) return "Keep trying! You'll get there!";
    return "Don't give up! Review and retry!";
  };

  const handleRetryWeak = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startRound(true);
    router.replace("/quiz");
  };

  const handleNewRound = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startRound(false);
    router.replace("/quiz");
  };

  const handleChangeMode = () => {
    router.replace("/mode-select");
  };

  const handleHome = () => {
    router.replace("/");
  };

  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 + webTopPadding }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.homeBtn} onPress={handleHome}>
            <Ionicons name="home-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.completedLabel}>Round Complete!</Text>
          <View style={[styles.accuracyCircle, { borderColor: getAccuracyColor() }]}>
            <Text style={[styles.accuracyPct, { color: getAccuracyColor() }]}>{accuracy}%</Text>
            <Text style={styles.accuracyLabel}>Accuracy</Text>
          </View>
          <Text style={styles.message}>{getAccuracyMessage()}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.correctGreen} />
              <Text style={styles.statNum}>{correctCount}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={24} color={Colors.wrongRed} />
              <Text style={styles.statNum}>{wrongCount}</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="list-outline" size={24} color={Colors.accentBlue} />
              <Text style={styles.statNum}>{total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {wrongInRound.length > 0 && (
          <View style={styles.wrongSection}>
            <Text style={styles.wrongTitle}>
              <Ionicons name="warning-outline" size={15} color={Colors.wrongRed} />
              {" "}{wrongInRound.length} Sentence{wrongInRound.length > 1 ? "s" : ""} to Review
            </Text>
            {wrongInRound.map((pair) => (
              <View key={pair.english} style={styles.wrongCard}>
                <Text style={styles.wrongEnglish}>{pair.english}</Text>
                <Text style={styles.wrongRussian}>{pair.russian}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionsSection}>
          {wrongInRound.length > 0 && (
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetryWeak} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={20} color={Colors.wrongRed} />
              <Text style={styles.retryBtnText}>Retry Weak Words ({wrongInRound.length})</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.newRoundBtn} onPress={handleNewRound} activeOpacity={0.85}>
            <Ionicons name="play-outline" size={20} color={Colors.white} />
            <Text style={styles.newRoundBtnText}>New Round</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeBtn} onPress={handleChangeMode} activeOpacity={0.85}>
            <Ionicons name="swap-horizontal-outline" size={20} color={Colors.accentBlue} />
            <Text style={styles.modeBtnText}>Change Mode</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  homeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.navyCard,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  completedLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
  },
  accuracyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  accuracyPct: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    lineHeight: 48,
  },
  accuracyLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  message: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  statNum: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  wrongSection: {
    marginBottom: 24,
  },
  wrongTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.wrongRed,
    marginBottom: 12,
  },
  wrongCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.wrongRed,
  },
  wrongEnglish: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.white,
    marginBottom: 4,
  },
  wrongRussian: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  actionsSection: {
    gap: 12,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(231, 76, 60, 0.12)",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(231, 76, 60, 0.3)",
  },
  retryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.wrongRed,
  },
  newRoundBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentBlue,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  newRoundBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(41, 82, 255, 0.1)",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(41, 82, 255, 0.25)",
  },
  modeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accentBlue,
  },
});
