import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";

export default function ScenariosScreen() {
  const { allSentences } = useQuiz();
  const insets = useSafeAreaInsets();

  const scenarios = useMemo(() => {
    const names = allSentences
      .map((s) => s.scenario)
      .filter((s): s is string => !!s);
    return [...new Set(names)];
  }, [allSentences]);

  const getCount = (name: string) => allSentences.filter((s) => s.scenario === name).length;
  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}> 
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scenarios</Text>
      </View>

      {scenarios.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No scenarios found. Make sure your Excel file has scenario names in Column C.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {scenarios.map((name) => {
            const count = getCount(name);
            return (
              <TouchableOpacity
                key={name}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: "/scenario-quiz", params: { scenario: name } })}
              >
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>{name}</Text>
                  <Text style={styles.cardSubtitle}>{count} sentence{count !== 1 ? "s" : ""}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  topBar: {
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, gap: 10 },
  card: {
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  cardTextWrap: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
