import React, { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useQuiz } from "@/context/QuizContext";
import { OptionCard } from "@/components/OptionCard";
import { SpeakerButton } from "@/components/SpeakerButton";
import { ProgressBar } from "@/components/ProgressBar";
import { SentencePair } from "@/models/SentencePair";
import { SentenceStats, defaultStats } from "@/models/SentenceStats";

const ROUND_SIZE = 10;

function getWeight(stats: SentenceStats): number {
  if (stats.timesCorrect === 0 && stats.timesWrong === 0) return 3;
  if (stats.consecutiveCorrect >= 3) return 1;
  if (stats.lastAnsweredCorrectly === false) return 5;
  return 2;
}

function weightedRandom(
  sentences: SentencePair[],
  statsMap: Record<string, SentenceStats>,
  exclude: string | null
): SentencePair | null {
  const candidates = sentences.filter((s) => s.english !== exclude);
  if (candidates.length === 0) return null;
  const weights = candidates.map((s) => getWeight(statsMap[s.english] ?? defaultStats()));
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

function buildRound(sentences: SentencePair[], statsMap: Record<string, SentenceStats>): SentencePair[] {
  if (sentences.length === 0) return [];
  const count = Math.min(ROUND_SIZE, sentences.length);
  const round: SentencePair[] = [];
  let lastEnglish: string | null = null;
  for (let i = 0; i < count; i++) {
    const chosen = weightedRandom(sentences, statsMap, lastEnglish);
    if (!chosen) break;
    round.push(chosen);
    lastEnglish = chosen.english;
  }
  return round;
}

function generateOptions(correct: SentencePair, allSentences: SentencePair[]): SentencePair[] {
  const others = allSentences.filter((s) => s.english !== correct.english);
  const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
  return [...shuffled, correct].sort(() => Math.random() - 0.5);
}

export default function ScenarioQuizScreen() {
  const { scenario } = useLocalSearchParams<{ scenario: string }>();
  const { allSentences, statsMap, mode, markAsHard, markAsEasy } = useQuiz();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevIndex = useRef(0);

  const [currentRound, setCurrentRound] = useState<SentencePair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<SentencePair | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [options, setOptions] = useState<SentencePair[]>([]);
  const [difficulty, setDifficulty] = useState<"hard" | "easy" | null>(null);

  const scenarioSentences = useMemo(
    () => allSentences.filter((s) => s.scenario === scenario),
    [allSentences, scenario]
  );

  useEffect(() => {
    const round = buildRound(scenarioSentences, statsMap);
    setCurrentRound(round);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setDifficulty(null);
    if (round.length > 0) {
      setOptions(generateOptions(round[0], scenarioSentences));
    }
  }, [scenarioSentences, statsMap]);

  const currentQuestion = currentRound[currentIndex];
  const totalQuestions = currentRound.length;

  const promptText = currentQuestion
    ? mode === "englishToRussian"
      ? currentQuestion.english
      : currentQuestion.russian
    : "";
  const promptLang: "en-US" | "ru-RU" = mode === "englishToRussian" ? "en-US" : "ru-RU";

  const autoPlay = useCallback(() => {
    if (!currentQuestion) return;
    if (mode !== "russianToEnglish") return;
    setTimeout(() => Speech.speak(currentQuestion.russian, { language: "ru-RU", rate: 0.85 }), 300);
  }, [currentQuestion, mode]);

  useEffect(() => {
    if (prevIndex.current !== currentIndex) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -30, duration: 0, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }),
      ]).start();
      prevIndex.current = currentIndex;
    }
    setDifficulty(null);
    Speech.stop();
    autoPlay();
  }, [currentIndex, autoPlay, slideAnim]);

  const handleExit = () => {
    Speech.stop();
    router.push("/results");
  };

  const handleSelect = (pair: SentencePair) => {
    if (isAnswered || !currentQuestion) return;

    const isCorrect = pair.english === currentQuestion.english;
    Haptics.notificationAsync(
      isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );

    setSelectedAnswer(pair);
    setIsAnswered(true);

    if (isCorrect) {
      setTimeout(() => Speech.speak(currentQuestion.russian, { language: "ru-RU", rate: 0.85 }), 400);
    }
  };

  const handleNext = () => {
    setDifficulty(null);
    Speech.stop();

    const next = currentIndex + 1;
    if (next >= totalQuestions) {
      router.push("/results");
      return;
    }

    setCurrentIndex(next);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setOptions(generateOptions(currentRound[next], scenarioSentences));
  };

  const getOptionState = (pair: SentencePair) => {
    if (!isAnswered || !currentQuestion) return "default" as const;
    if (pair.english === currentQuestion.english) return "correct" as const;
    if (selectedAnswer?.english === pair.english) return "wrong" as const;
    return "default" as const;
  };

  const currentPair: SentencePair | null = currentQuestion ?? null;
  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  if (!scenario || typeof scenario !== "string") {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}> 
        <Text style={styles.errorText}>No scenario selected.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (scenarioSentences.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}> 
        <Text style={styles.errorText}>No sentences found for "{scenario}".</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}> 
        <Text style={styles.errorText}>No questions available.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 12 + webTopPadding, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
          <Ionicons name="close" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.progressWrap}>
          <ProgressBar progress={(currentIndex + (isAnswered ? 1 : 0)) / totalQuestions} />
        </View>

        <Text style={styles.counterText}>
          {currentIndex + 1} / {totalQuestions}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.promptCard, { transform: [{ translateY: slideAnim }] }]}> 
          <Text style={styles.promptLabel}>{scenario}</Text>
          <Text style={[styles.promptText, mode === "russianToEnglish" && styles.cyrillicText]}>{promptText}</Text>
          <View style={styles.promptSpeakerRow}>
            <SpeakerButton text={promptText} language={promptLang} size={22} color={Colors.gold} />
          </View>
        </Animated.View>

        <Text style={styles.optionsLabel}>Choose the correct answer</Text>
        {options.map((pair) => (
          <OptionCard
            key={pair.english}
            pair={pair}
            mode={mode}
            state={getOptionState(pair)}
            onPress={() => handleSelect(pair)}
            showTranslation={isAnswered}
          />
        ))}

        {isAnswered && (
          <View style={styles.difficultyRow}>
            <Pressable
              style={[styles.difficultyBtn, styles.hardBtn, difficulty === "hard" && styles.hardBtnSelected]}
              onPress={() => {
                if (!currentPair) return;
                void markAsHard(currentPair);
                setDifficulty("hard");
              }}
            >
              <Text style={[styles.difficultyBtnText, styles.hardBtnText]}>Hard</Text>
            </Pressable>

            <Pressable
              style={[styles.difficultyBtn, styles.easyBtn, difficulty === "easy" && styles.easyBtnSelected]}
              onPress={() => {
                if (!currentPair) return;
                void markAsEasy(currentPair);
                setDifficulty("easy");
              }}
            >
              <Text style={[styles.difficultyBtnText, styles.easyBtnText]}>Easy</Text>
            </Pressable>
          </View>
        )}

        {isAnswered && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>{currentIndex + 1 >= totalQuestions ? "See Results" : "Next"}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  exitBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.navyCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressWrap: { flex: 1 },
  counterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
    flexShrink: 0,
    minWidth: 40,
    textAlign: "right",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 32 },
  promptCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 22,
    padding: 26,
    marginBottom: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.accentBlue,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: "center",
  },
  promptText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 16,
  },
  cyrillicText: { fontSize: 28, letterSpacing: 0.5 },
  promptSpeakerRow: {
    backgroundColor: Colors.gold + "18",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  optionsLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.4,
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  difficultyBtn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  hardBtnSelected: { backgroundColor: "#E0525230" },
  easyBtnSelected: { backgroundColor: "#4CAF5030" },
  hardBtn: { backgroundColor: "#E0525215" },
  easyBtn: { backgroundColor: "#4CAF5015" },
  difficultyBtnText: { fontSize: 13, fontWeight: "500" },
  hardBtnText: { color: "#E05252" },
  easyBtnText: { color: "#4CAF50" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentBlue,
    paddingVertical: 17,
    borderRadius: 16,
    gap: 10,
    marginTop: 4,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  errorText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 24,
  },
  errorBtn: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: Colors.accentBlue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  errorBtnText: {
    color: Colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
