import React, { useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from "react-native";
import { router } from "expo-router";
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

export default function QuizScreen() {
  const {
    currentRound, currentIndex, mode, options,
    selectedAnswer, isAnswered, selectAnswer, nextQuestion,
  } = useQuiz();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevIndex = useRef(currentIndex);

  const currentQuestion = currentRound[currentIndex];
  const totalQuestions = currentRound.length;

  const promptText = currentQuestion
    ? mode === "englishToRussian" ? currentQuestion.english : currentQuestion.russian
    : "";
  const promptLang: "en-US" | "ru-RU" = mode === "englishToRussian" ? "en-US" : "ru-RU";

  const autoPlay = useCallback(() => {
    if (!currentQuestion) return;
    const text = mode === "englishToRussian" ? currentQuestion.english : currentQuestion.russian;
    setTimeout(() => Speech.speak(text, { language: promptLang, rate: 0.85 }), 300);
  }, [currentQuestion, mode]);

  useEffect(() => {
    if (prevIndex.current !== currentIndex) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -30, duration: 0, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }),
      ]).start();
      prevIndex.current = currentIndex;
    }
    autoPlay();
  }, [currentIndex, autoPlay]);

  const handleExit = () => { Speech.stop(); router.push("/results"); };

  const handleSelect = (pair: SentencePair) => {
    if (isAnswered) return;
    const correct = currentRound[currentIndex];
    const isCorrect = pair.english === correct.english;
    Haptics.notificationAsync(isCorrect
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Error);
    selectAnswer(pair);
  };

  const handleNext = () => {
    Speech.stop();
    currentIndex + 1 >= totalQuestions ? router.push("/results") : nextQuestion();
  };

  const getOptionState = (pair: SentencePair) => {
    if (!isAnswered) return "default" as const;
    const correct = currentRound[currentIndex];
    if (pair.english === correct.english) return "correct" as const;
    if (selectedAnswer?.english === pair.english) return "wrong" as const;
    return "default" as const;
  };

  if (!currentQuestion) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No questions available.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 + webTopPadding, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
          <Ionicons name="close" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <ProgressBar progress={(currentIndex + (isAnswered ? 1 : 0)) / totalQuestions} />
        <Text style={styles.counter}>{currentIndex + 1} / {totalQuestions}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.promptCard, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.promptLabel}>
            {mode === "englishToRussian" ? "Translate to Russian" : "Translate to English"}
          </Text>
          <Text style={[styles.promptText, mode === "russianToEnglish" && styles.cyrillicText]}>
            {promptText}
          </Text>
          <View style={styles.promptSpeakerRow}>
            <SpeakerButton text={promptText} language={promptLang} size={22} color={Colors.gold} />
          </View>
        </Animated.View>

        <Text style={styles.optionsLabel}>Choose the correct answer</Text>
        {options.map((pair) => (
          <OptionCard key={pair.english} pair={pair} mode={mode}
            state={getOptionState(pair)} onPress={() => handleSelect(pair)}
            showTranslation={isAnswered} />
        ))}

        {isAnswered && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= totalQuestions ? "See Results" : "Next"}
            </Text>
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
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 12, marginBottom: 12,
  },
  exitBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.navyCard,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  counter: {
    fontSize: 13, fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted, minWidth: 40, textAlign: "right",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 32 },
  promptCard: {
    backgroundColor: Colors.navyCard, borderRadius: 22,
    padding: 26, marginBottom: 22, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  promptLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    color: Colors.accentBlue, textTransform: "uppercase",
    letterSpacing: 1.2, marginBottom: 14,
  },
  promptText: {
    fontSize: 26, fontFamily: "Inter_700Bold",
    color: Colors.white, textAlign: "center",
    lineHeight: 36, marginBottom: 16,
  },
  cyrillicText: { fontSize: 28, letterSpacing: 0.5 },
  promptSpeakerRow: {
    backgroundColor: Colors.gold + "18",
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 24,
  },
  optionsLabel: {
    fontSize: 12, fontFamily: "Inter_500Medium",
    color: Colors.textMuted, marginBottom: 12, textAlign: "center", letterSpacing: 0.4,
  },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accentBlue, paddingVertical: 17,
    borderRadius: 16, gap: 10, marginTop: 4,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.white },
  errorText: { color: Colors.white, fontSize: 16, textAlign: "center", marginTop: 40 },
  errorBtn: {
    marginTop: 20, alignSelf: "center", backgroundColor: Colors.accentBlue,
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12,
  },
  errorBtnText: { color: Colors.white, fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
