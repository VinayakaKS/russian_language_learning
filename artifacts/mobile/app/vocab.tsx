import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";
import { SentencePair } from "@/models/SentencePair";
import { SentenceStats, defaultStats } from "@/models/SentenceStats";

export default function VocabScreen() {
  const { allSentences, statsMap, deleteSentence } = useQuiz();
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allSentences;
    return allSentences.filter(
      (p) => p.english.toLowerCase().includes(q) || p.russian.toLowerCase().includes(q)
    );
  }, [allSentences, search]);

  const handleDelete = (pair: SentencePair) => {
    Alert.alert(
      "Remove sentence?",
      `"${pair.english}" will be deleted from your vocabulary.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deleteSentence(pair.english);
          },
        },
      ]
    );
  };

  const getAccuracy = (stats: SentenceStats) => {
    const total = stats.timesCorrect + stats.timesWrong;
    if (total === 0) return null;
    return Math.round((stats.timesCorrect / total) * 100);
  };

  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>My Vocabulary</Text>
          <Text style={styles.subtitle}>{allSentences.length} sentence{allSentences.length !== 1 ? "s" : ""} saved</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search English or Russian..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          autoCapitalize="none"
        />
      </View>

      {allSentences.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No vocabulary yet</Text>
          <Text style={styles.emptyDesc}>Import a file or type sentences manually to get started.</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/upload")}>
            <Text style={styles.addBtnText}>Add Vocabulary</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 ? (
            <Text style={styles.noResults}>No matches for "{search}"</Text>
          ) : (
            filtered.map((pair, index) => {
              const stats = statsMap[pair.english] ?? defaultStats();
              const accuracy = getAccuracy(stats);
              const total = stats.timesCorrect + stats.timesWrong;
              const accuracyColor =
                accuracy === null
                  ? Colors.textMuted
                  : accuracy >= 80
                  ? Colors.correctGreen
                  : accuracy >= 50
                  ? Colors.gold
                  : Colors.wrongRed;

              return (
                <View key={pair.english + index} style={styles.card}>
                  <View style={styles.cardBody}>
                    <Text style={styles.englishText}>{pair.english}</Text>
                    <Text style={styles.russianText}>{pair.russian}</Text>

                    <View style={styles.statsRow}>
                      {accuracy !== null ? (
                        <>
                          <View style={[styles.badge, { backgroundColor: accuracyColor + "22" }]}>
                            <Text style={[styles.badgeText, { color: accuracyColor }]}>
                              {accuracy}% accuracy
                            </Text>
                          </View>
                          <Text style={styles.attemptsText}>{total} attempt{total !== 1 ? "s" : ""}</Text>
                        </>
                      ) : (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Not studied yet</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(pair)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  topBar: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  titleBlock: {},
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  searchRow: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  card: {
    backgroundColor: Colors.navyCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  englishText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
    lineHeight: 20,
  },
  russianText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "rgba(138,155,192,0.12)",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  attemptsText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(231, 76, 60, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginTop: 2,
  },
  deleteBtnText: {
    fontSize: 12,
    color: Colors.wrongRed,
    fontFamily: "Inter_600SemiBold",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  addBtn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  noResults: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 32,
  },
});
