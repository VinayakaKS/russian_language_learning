import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";

export default function ResultsScreen() {
  const { correctCount, wrongCount, wrongInRound, hardInRound, startRound } = useQuiz();
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

  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace("/")}>
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
              <Ionicons name="checkmark-circle" size={22} color={Colors.correctGreen} />
              <Text style={styles.statNum}>{correctCount}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={22} color={Colors.wrongRed} />
              <Text style={styles.statNum}>{wrongCount}</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="list-outline" size={22} color={Colors.accentBlue} />
              <Text style={styles.statNum}>{total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {wrongInRound.length > 0 && (
          <View style={styles.wrongSection}>
            <Text style={styles.wrongTitle}>{wrongInRound.length} to Review</Text>
            {wrongInRound.map((pair) => (
              <View key={pair.english} style={styles.wrongCard}>
                <Text style={styles.wrongEnglish}>{pair.english}</Text>
                <Text style={styles.wrongRussian}>{pair.russian}</Text>
              </View>
            ))}
          </View>
        )}

        {hardInRound.length > 0 && (
          <View style={styles.hardSection}>
            <Text style={styles.hardSectionTitle}>Marked as Hard</Text>
            {hardInRound.map((pair) => (
              <View key={`hard-${pair.english}`} style={styles.hardCard}>
                <Text style={styles.hardEnglish}>{pair.english}</Text>
                <Text style={styles.hardRussian}>{pair.russian}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionsSection}>
          {wrongInRound.length > 0 && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); startRound(true); router.replace("/quiz"); }} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={18} color={Colors.wrongRed} />
              <Text style={styles.retryBtnText}>Retry Weak Words ({wrongInRound.length})</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.newRoundBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); startRound(false); router.replace("/quiz"); }} activeOpacity={0.85}>
            <Ionicons name="play-outline" size={18} color={Colors.white} />
            <Text style={styles.newRoundBtnText}>New Round</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeBtn} onPress={() => router.replace("/mode-select")} activeOpacity={0.85}>
            <Ionicons name="swap-horizontal-outline" size={18} color={Colors.accentBlue} />
            <Text style={styles.modeBtnText}>Change Mode</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22 },
  header: { flexDirection: "row", marginBottom: 18 },
  homeBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.navyCard,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  scoreCard: {
    backgroundColor: Colors.navyCard, borderRadius: 26,
    padding: 26, alignItems: "center", marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  completedLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted, textTransform: "uppercase",
    letterSpacing: 1.2, marginBottom: 20,
  },
  accuracyCircle: {
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 4, alignItems: "center", justifyContent: "center",
    marginBottom: 18, backgroundColor: Colors.navyLight,
  },
  accuracyPct: { fontSize: 40, fontFamily: "Inter_700Bold", lineHeight: 46 },
  accuracyLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  message: {
    fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.white,
    textAlign: "center", marginBottom: 22, lineHeight: 22,
  },
  statsRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, height: 38, backgroundColor: Colors.border },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.white, lineHeight: 26 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  wrongSection: { marginBottom: 20 },
  wrongTitle: {
    fontSize: 14, fontFamily: "Inter_600SemiBold",
    color: Colors.wrongRed, marginBottom: 10,
  },
  wrongCard: {
    backgroundColor: Colors.navyCard, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: Colors.wrongRed,
    borderWidth: 1, borderColor: Colors.border,
  },
  wrongEnglish: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.white, marginBottom: 3 },
  wrongRussian: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  actionsSection: { gap: 10 },
  retryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.wrongRed + "15", paddingVertical: 15,
    borderRadius: 14, gap: 8, borderWidth: 1, borderColor: Colors.wrongRed + "35",
  },
  retryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.wrongRed },
  newRoundBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accentBlue, paddingVertical: 17,
    borderRadius: 16, gap: 10,
  },
  newRoundBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.white },
  modeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accentBlue + "12", paddingVertical: 15,
    borderRadius: 14, gap: 8, borderWidth: 1, borderColor: Colors.accentBlue + "30",
  },
  modeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.accentBlue },
  hardSection: {
    marginBottom: 20,
  },
  hardSectionTitle: {
    fontSize: 14, fontFamily: "Inter_600SemiBold",
    color: "#FFD60A",
    marginBottom: 10,
  },
  hardCard: {
    backgroundColor: Colors.navyCard, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: Colors.wrongRed,
    borderWidth: 1, borderColor: Colors.border,
  },
  hardEnglish: {
    fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.white, marginBottom: 3,
  },
  hardRussian: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted,
  },
});
