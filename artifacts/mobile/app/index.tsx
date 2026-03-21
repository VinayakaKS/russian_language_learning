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
import { Ionicons } from "@expo/vector-icons";
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
          <Ionicons name="language" size={28} color={Colors.white} />
        </View>
        <View>
          <Text style={styles.appName}>Russian Learner</Text>
          <Text style={styles.tagline}>Pimsleur-inspired audio quiz</Text>
        </View>
      </View>

      {allSentences.length > 0 ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              icon="library-outline"
              value={allSentences.length.toString()}
              label="Sentences"
              color={Colors.accentBlue}
            />
            <StatCard
              icon="school-outline"
              value={totalStudied.toString()}
              label="Studied"
              color={Colors.gold}
            />
            <StatCard
              icon="trophy-outline"
              value={`${overallAccuracy}%`}
              label="Accuracy"
              color={Colors.correctGreen}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/mode-select");
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={22} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Start Quiz</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push("/upload")}
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={Colors.accentBlue} />
              <Text style={styles.secondaryBtnText}>Replace Vocabulary</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>How It Works</Text>
            <FeatureRow
              icon="volume-medium-outline"
              title="Audio-First Learning"
              desc="Auto-plays TTS for every sentence, tap speaker icons to replay"
            />
            <FeatureRow
              icon="shuffle-outline"
              title="Spaced Repetition"
              desc="Difficult words appear more often until you master them"
            />
            <FeatureRow
              icon="bar-chart-outline"
              title="Progress Tracking"
              desc="Track accuracy and review sentences you struggled with"
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={48} color={Colors.accentBlue} />
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
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Import Vocabulary</Text>
          </TouchableOpacity>

          <View style={styles.featuresSection}>
            <FeatureRow
              icon="volume-medium-outline"
              title="Audio-First Learning"
              desc="Hear every word spoken in native Russian"
            />
            <FeatureRow
              icon="shuffle-outline"
              title="Spaced Repetition"
              desc="Focus on words you haven't mastered yet"
            />
            <FeatureRow
              icon="checkmark-circle-outline"
              title="Multiple Choice Quiz"
              desc="4 options per question, instant audio feedback"
            />
          </View>
        </View>
      )}
    </View>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "22" }]}>
      <Ionicons name={icon as any} size={20} color={color} style={{ marginBottom: 6 }} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={20} color={Colors.accentBlue} />
      </View>
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
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(41, 82, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
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
