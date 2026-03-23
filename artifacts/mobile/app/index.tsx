import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";

export default function HomeScreen() {
  const { allSentences, statsMap, loadFromStorage } = useQuiz();
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadFromStorage().finally(() => setLoading(false));
  }, []);

  const totalStudied = Object.keys(statsMap).length;
  const totalCorrect = Object.values(statsMap).reduce((a, s) => a + s.timesCorrect, 0);
  const totalAttempts = Object.values(statsMap).reduce((a, s) => a + s.timesCorrect + s.timesWrong, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.navy }}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 20 + webTopPadding, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>RU</Text>
          </View>
          <View>
            <Text style={styles.appName}>Russian Learner</Text>
            <Text style={styles.tagline}>Audio-first spaced repetition</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() => router.push("/how-it-works")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="information-circle-outline" size={26} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {allSentences.length > 0 ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard value={allSentences.length.toString()} label="Sentences" color={Colors.accentBlue} />
            <StatCard value={totalStudied.toString()} label="Studied" color={Colors.gold} />
            <StatCard value={`${overallAccuracy}%`} label="Accuracy" color={Colors.correctGreen} />
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/mode-select");
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={20} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Start Quiz</Text>
          </TouchableOpacity>

          <View style={styles.actionGrid}>
            <ActionTile label="My Vocabulary" icon="list-outline" onPress={() => router.push("/vocab")} />
            <ActionTile label="Add Sentences" icon="add-circle-outline" onPress={() => router.push("/manual-entry")} />
            <ActionTile label="Import File" icon="cloud-upload-outline" onPress={() => router.push("/upload")} />
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📂</Text>
          </View>
          <Text style={styles.emptyTitle}>No Vocabulary Yet</Text>
          <Text style={styles.emptyDesc}>
            Import an Excel or CSV file, or type your sentences directly to get started.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/upload");
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Import Vocabulary</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/manual-entry")}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color={Colors.accentBlue} />
            <Text style={styles.secondaryBtnText}>Type Sentences Manually</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "30" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionTile({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon as any} size={22} color={Colors.accentBlue} />
      <Text style={styles.actionTileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  centered: { alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 22 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  appName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  tagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 1,
  },
  infoBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: Colors.navyCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.navyCard,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentBlue,
    paddingVertical: 17,
    borderRadius: 16,
    gap: 10,
    marginBottom: 14,
  },
  primaryBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 10,
  },
  actionTile: {
    flex: 1,
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionTileLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    textAlign: "center",
  },
  emptyState: { paddingTop: 20 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.navyCard,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIconText: { fontSize: 38 },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accentBlue + "50",
    backgroundColor: Colors.accentBlue + "10",
    marginTop: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.accentBlue,
  },
});
