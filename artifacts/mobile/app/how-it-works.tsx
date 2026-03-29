import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const sections = [
  {
    icon: "apps-outline" as const,
    color: Colors.accentBlue,
    title: "Three Ways to Learn",
    body: "Quiz Mode tests you on your imported sentences with spaced repetition. Song Mode teaches through real Russian music — hear the line, guess the missing word. Scenario Mode groups sentences by real-life situations like At a Café or Morning Routine.",
  },
  {
    icon: "cloud-upload-outline" as const,
    color: Colors.gold,
    title: "Add Your Vocabulary",
    body: "Import an Excel or CSV file — Column A English, Column B Russian, Column C optional scenario name. Or type sentences manually one by one. You can import multiple files and your existing sentences and stats are never overwritten.",
  },
  {
    icon: "radio-button-on-outline" as const,
    color: Colors.correctGreen,
    title: "How the Quiz Works",
    body: "Each round has 10 questions. You see a sentence and pick the correct translation from 4 options. After answering, the correct line plays in Russian so you hear it spoken. All 4 option translations are revealed so you learn from wrong answers too.",
  },
  {
    icon: "musical-notes-outline" as const,
    color: Colors.gold,
    title: "How Song Mode Works",
    body: "Pick a song from the library. First, listen to the 10 lines you will be quizzed on. Then guess the missing word in each line from 4 options. After selecting, the correct line plays back in context from the real song.",
  },
  {
    icon: "map-outline" as const,
    color: Colors.correctGreen,
    title: "How Scenario Mode Works",
    body: "If your Excel file has a scenario name in Column C, those sentences are automatically grouped into scenarios. Tap a scenario to start a 10-question quiz using only sentences from that topic.",
  },
  {
    icon: "volume-medium-outline" as const,
    color: Colors.accentBlue,
    title: "Audio Playback",
    body: "Russian sentences are never read in English — only Russian TTS plays. The correct answer plays automatically after you select it. Tap the speaker icon on any option to hear it again at any time.",
  },
  {
    icon: "shuffle-outline" as const,
    color: Colors.gold,
    title: "Spaced Repetition",
    body: "Sentences you get wrong appear more often. Get a sentence right three times in a row and it fades back. After each answer you can also tap Hard or Easy to manually control how often a sentence appears.",
  },
  {
    icon: "bar-chart-outline" as const,
    color: Colors.textMuted,
    title: "Tracking Your Progress",
    body: "Every answer is recorded. Open My Vocabulary to see accuracy and attempt count for each sentence, colour coded green, gold or red. Sort by lowest accuracy to find your weakest sentences and focus on them.",
  },
];

export default function HowItWorksScreen() {
  const insets = useSafeAreaInsets();
  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.title}>How It Works</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((s) => (
          <View key={s.title} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: s.color + "18" }]}>
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardBody2}>{s.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.navyCard,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.navyCard,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
    marginBottom: 6,
  },
  cardBody2: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
