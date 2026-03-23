import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const sections = [
  {
    icon: "volume-medium-outline" as const,
    color: Colors.gold,
    title: "Audio-First Learning",
    body: "Every sentence is automatically spoken aloud when a new question appears. Tap the speaker button (♪) on any option to hear it again. This trains your ear as well as your reading.",
  },
  {
    icon: "shuffle-outline" as const,
    color: Colors.accentBlue,
    title: "Spaced Repetition",
    body: "The quiz uses a weighted algorithm. Sentences you answer incorrectly are shown more frequently. Once you get a sentence right three times in a row, it appears less often — letting you focus on what you haven't mastered yet.",
  },
  {
    icon: "radio-button-on-outline" as const,
    color: Colors.correctGreen,
    title: "Multiple Choice Quiz",
    body: "Each question presents 4 options. Select the correct translation and the card turns green. Wrong answers turn red. After each answer the Russian is revealed on all options so you can hear and read each one.",
  },
  {
    icon: "bar-chart-outline" as const,
    color: Colors.accentBlue,
    title: "Progress Tracking",
    body: "Your accuracy per sentence is stored on the device. Open 'My Vocabulary' to see your accuracy percentage and attempt count for every sentence, colour-coded by performance.",
  },
  {
    icon: "swap-horizontal-outline" as const,
    color: Colors.gold,
    title: "Two Quiz Modes",
    body: "English → Russian: see English, choose the Russian translation.\nRussian → English: see Cyrillic, choose the English meaning.\nSwitch modes from the mode selection screen anytime.",
  },
  {
    icon: "document-text-outline" as const,
    color: Colors.textMuted,
    title: "File Format",
    body: "Import an .xlsx or .csv file with English in column A and Russian in column B. No headers required. Or type your sentences directly using 'Add More Sentences' on the home screen.",
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
