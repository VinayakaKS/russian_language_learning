import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";

export default function HomeScreen() {
  const { allSentences, statsMap, loadFromStorage, clearData } = useQuiz();
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
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 20 + webTopPadding,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      <View style={styles.brandRow}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>RU</Text>
        </View>
        <View>
          <Text style={styles.appName}>Russian Learner</Text>
          <Text style={styles.tagline}>Pimsleur-inspired audio quiz</Text>
        </View>
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
            <Text style={styles.primaryBtnText}>Start Quiz</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push("/upload")}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>Replace Vocabulary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { marginTop: 10 }]}
              onPress={() => router.push("/manual-entry")}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>Add More Sentences</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>How It Works</Text>
            <FeatureRow
              title="Audio-First Learning"
              desc="Auto-plays TTS for every sentence, tap speaker icons to replay"
            />
            <FeatureRow
              title="Spaced Repetition"
              desc="Difficult words appear more often until you master them"
            />
            <FeatureRow
              title="Progress Tracking"
              desc="Track accuracy and review sentences you struggled with"
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📂</Text>
          </View>
          <Text style={styles.emptyTitle}>No Vocabulary Yet</Text>
          <Text style={styles.emptyDesc}>
            Import an Excel or CSV file with your Russian vocabulary to get started
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/upload");
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Import Vocabulary</Text>
          </TouchableOpacity>

          <View style={styles.featuresSection}>
            <FeatureRow title="Audio-First Learning" desc="Hear every word spoken in native Russian" />
            <FeatureRow title="Spaced Repetition" desc="Focus on words you haven't mastered yet" />
            <FeatureRow title="Multiple Choice Quiz" desc="4 options per question, instant audio feedback" />
          </View>
        </View>
      )}
    </View>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "22" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureRow({ title, desc }: { title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
    paddingHorizontal: 24,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 32,
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
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
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 24,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentBlue,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  secondaryActions: {
    marginBottom: 32,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(41, 82, 255, 0.3)",
    backgroundColor: "rgba(41, 82, 255, 0.06)",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.accentBlue,
  },
  featuresSection: {
    gap: 12,
    marginTop: 4,
  },
  featuresTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    padding: 14,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "rgba(41, 82, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
});
