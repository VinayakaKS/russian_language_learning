import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
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
    currentRound,
    currentIndex,
    correctCount,
    wrongCount,
    mode,
    options,
    selectedAnswer,
    isAnswered,
    selectAnswer,
    nextQuestion,
  } = useQuiz();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevIndex = useRef(currentIndex);

  const currentQuestion = currentRound[currentIndex];
  const totalQuestions = currentRound.length;
  const progress = totalQuestions > 0 ? (currentIndex) / totalQuestions : 0;

  const promptText = currentQuestion
    ? mode === "englishToRussian"
      ? currentQuestion.english
      : currentQuestion.russian
    : "";

  const promptLang: "en-US" | "ru-RU" = mode === "englishToRussian" ? "en-US" : "ru-RU";

  const autoPlay = useCallback(() => {
    if (!currentQuestion) return;
    const text = mode === "englishToRussian" ? currentQuestion.english : currentQuestion.russian;
    const language = mode === "englishToRussian" ? "en-US" : "ru-RU";
    setTimeout(() => {
      Speech.speak(text, { language, rate: 0.85 });
    }, 300);
  }, [currentQuestion, mode]);

  useEffect(() => {
    if (prevIndex.current !== currentIndex) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
      ]).start();
      prevIndex.current = currentIndex;
    }
    autoPlay();
  }, [currentIndex, autoPlay]);

  const handleExit = () => {
    Speech.stop();
    router.push("/results");
  };

  const handleSelect = (pair: SentencePair) => {
    if (isAnswered) return;
    const correct = currentRound[currentIndex];
    const isCorrect = pair.english === correct.english;
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    selectAnswer(pair);
  };

  const handleNext = () => {
    Speech.stop();
    if (currentIndex + 1 >= totalQuestions) {
      router.push("/results");
    } else {
      nextQuestion();
    }
  };

  const getOptionState = (pair: SentencePair) => {
    if (!isAnswered) return "default" as const;
    const correct = currentRound[currentIndex];
    const isThisCorrect = pair.english === correct.english;
    const isSelected = selectedAnswer?.english === pair.english;

    if (isThisCorrect) return "correct" as const;
    if (isSelected && !isThisCorrect) return "wrong" as const;
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
          <Ionicons name="close" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <ProgressBar progress={(currentIndex + (isAnswered ? 1 : 0)) / totalQuestions} />
        <Text style={styles.counter}>{currentIndex + 1} / {totalQuestions}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.promptCard, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.promptLabelRow}>
            <Text style={styles.promptLabel}>
              {mode === "englishToRussian" ? "Translate to Russian" : "Translate to English"}
            </Text>
          </View>
          <Text
            style={[
              styles.promptText,
              mode === "russianToEnglish" && styles.cyrillicText,
            ]}
          >
            {promptText}
          </Text>
          <View style={styles.promptSpeakerRow}>
            <SpeakerButton text={promptText} language={promptLang} size={24} color={Colors.gold} />
          </View>
        </Animated.View>

        <View style={styles.optionsSection}>
          <Text style={styles.optionsLabel}>Choose the correct answer</Text>
          {options.map((pair, idx) => (
            <OptionCard
              key={pair.english}
              pair={pair}
              mode={mode}
              state={getOptionState(pair)}
              onPress={() => handleSelect(pair)}
              showTranslation={isAnswered}
            />
          ))}
        </View>

        {isAnswered && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= totalQuestions ? "See Results" : "Next"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  exitBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.navyCard,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    minWidth: 40,
    textAlign: "right",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  promptCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(41, 82, 255, 0.2)",
  },
  promptLabelRow: {
    marginBottom: 16,
  },
  promptLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accentBlue,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  promptText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 16,
  },
  cyrillicText: {
    fontSize: 28,
    letterSpacing: 0.5,
  },
  promptSpeakerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 209, 102, 0.1)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  optionsSection: {
    marginBottom: 16,
  },
  optionsLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    marginBottom: 14,
    textAlign: "center",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentBlue,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  errorText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
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
