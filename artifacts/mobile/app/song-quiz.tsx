import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Platform, KeyboardAvoidingView,
} from "react-native";
import { Audio } from "expo-av";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import songData from "@/assets/data/ya_svoboden.json";

type Phrase = {
  id: string;
  index: number;
  russian: string;
  english: string;
  startMs: number;
  endMs: number;
  isChorus: boolean;
  blankWord: string;
  blankWordTranslation: string;
};

type AnswerState = "idle" | "correct" | "wrong";

export default function SongQuizScreen() {
  const insets = useSafeAreaInsets();
  const [roundPhrases] = useState<Phrase[]>(() => {
    const total = songData.phrases.length;
    const maxStart = Math.max(0, total - 10);
    const startIndex = Math.floor(Math.random() * (maxStart + 1));
    return songData.phrases.slice(startIndex, startIndex + 10);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<Phrase[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [wrongPhrases, setWrongPhrases] = useState<Phrase[]>([]);
  const [finished, setFinished] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [hasListened, setHasListened] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [playingAllIndex, setPlayingAllIndex] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);
  const stopAllRef = useRef(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentPhrase = roundPhrases[currentIndex];
  const totalPhrases = roundPhrases.length;

  // Build the display line with blank
  const buildDisplayLine = (phrase: Phrase, showAnswer: boolean): React.ReactNode => {
    const words = phrase.russian.split(" ");
    return words.map((word, i) => {
      const clean = word.replace(/[,!?]/g, "");
      const punctuation = word.slice(clean.length);
      const isBlank = clean === phrase.blankWord;

      if (!isBlank) {
        return <Text key={i} style={styles.lyricWord}>{word} </Text>;
      }

      if (showAnswer) {
        return (
          <Text key={i} style={[
            styles.lyricWord,
            answerState === "correct" ? styles.blankCorrect : styles.blankRevealed
          ]}>
            {phrase.blankWord}{punctuation}{" "}
          </Text>
        );
      }

      return (
        <Text key={i} style={styles.blankPlaceholder}>
          {"_".repeat(phrase.blankWord.length)}{punctuation}{" "}
        </Text>
      );
    });
  };

  const shuffleArray = <T,>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const generateOptions = useCallback((phrase: Phrase) => {
    const wrongOptions = shuffleArray(
      roundPhrases.filter((p) => p.id !== phrase.id)
    ).slice(0, 3);

    setOptions(shuffleArray([phrase, ...wrongOptions]));
  }, [roundPhrases]);

  const playPhrase = useCallback(async (phrase: Phrase) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound: newSound } = await Audio.Sound.createAsync(
        require("@/assets/songs/ya_svoboden.mp3"),
        { positionMillis: phrase.startMs, shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      const duration = phrase.endMs - phrase.startMs;
      setTimeout(async () => {
        try {
          const status = await newSound.getStatusAsync();
          if (status.isLoaded) {
            await newSound.stopAsync();
          }
        } catch (e) {
          // sound already unloaded, ignore
        } finally {
          setIsPlaying(false);
          setAudioFinished(true);
        }
      }, duration);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }, [sound]);

  async function playPhraseAsync(phrase: Phrase): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        const { sound: phraseSound } = await Audio.Sound.createAsync(
          require("@/assets/songs/ya_svoboden.mp3"),
          { positionMillis: phrase.startMs, shouldPlay: true }
        );
        setSound(phraseSound);
        const duration = phrase.endMs - phrase.startMs;
        setTimeout(async () => {
          try {
            const status = await phraseSound.getStatusAsync();
            if (status.isLoaded) await phraseSound.stopAsync();
            await phraseSound.unloadAsync();
          } catch (e) {}
          setSound(null);
          resolve();
        }, duration);
      } catch (e) {
        resolve();
      }
    });
  }

  async function playAll() {
    if (isPlayingAll) return;
    stopAllRef.current = false;
    setHasListened(true);
    setIsPlayingAll(true);
    for (let i = 0; i < roundPhrases.length; i++) {
      if (stopAllRef.current) break;
      setPlayingAllIndex(i);
      await playPhraseAsync(roundPhrases[i]);
    }
    setPlayingAllIndex(null);
    setIsPlayingAll(false);
  }

  const stopAll = async () => {
    stopAllRef.current = true;
    setIsPlayingAll(false);
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
      } catch (e) {}
      setSound(null);
    }
  };

  const handleSkip = async () => {
    await stopAll();
    setAudioFinished(false);
    setIntroPlayed(true);
  };

  const handleStartQuiz = async () => {
    await stopAll();
    setAudioFinished(false);
    setIntroPlayed(true);
  };

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  useEffect(() => {
    generateOptions(currentPhrase);
  }, [currentPhrase, generateOptions]);

  const animateIn = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 0, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }),
    ]).start();
  };

  const handleOptionPress = (option: Phrase) => {
    if (answerState !== "idle") return;
    const isCorrect = option.id === currentPhrase.id;

    setAudioFinished(false);
    setSelectedOption(option.id);
    setAnswerState(isCorrect ? "correct" : "wrong");
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong: s.wrong + (isCorrect ? 0 : 1),
    }));

    if (!isCorrect) {
      setWrongPhrases((prev) => [...prev, currentPhrase]);
    }

    playPhrase(currentPhrase);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalPhrases) {
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
    setAnswerState("idle");
    setAudioFinished(false);
    animateIn();
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswerState("idle");
    setScore({ correct: 0, wrong: 0 });
    setWrongPhrases([]);
    setFinished(false);
    setIntroPlayed(false);
    setHasListened(false);
    setIsPlayingAll(false);
    setPlayingAllIndex(null);
    setAudioFinished(false);
  };

  const webTopPadding = Platform.OS === "web" ? 67 : 0;
  const isAnswered = answerState !== "idle";

  const accuracy = totalPhrases > 0 ? Math.round((score.correct / totalPhrases) * 100) : 0;

  const getAccuracyColor = () => {
    if (accuracy >= 80) return Colors.correctGreen;
    if (accuracy >= 50) return Colors.gold;
    return Colors.wrongRed;
  };

  const getAccuracyMessage = () => {
    if (accuracy === 100) return "Perfect! Excellent work!";
    if (accuracy >= 80) return "Great job! Keep it up!";
    if (accuracy >= 60) return "Good effort! Practice more!";
    if (accuracy >= 40) return "Keep trying! You'll get there!";
    return "Don't give up! Review and retry!";
  };

  if (finished) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}>
        <ScrollView
          style={styles.scrollResults}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace("/")}>
              <Ionicons name="home-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.completedLabel}>Round Complete!</Text>
            <View style={[styles.accuracyCircle, { borderColor: getAccuracyColor() }]}>
              <Text style={[styles.accuracyPct, { color: getAccuracyColor() }]}>{accuracy}%</Text>
              <Text style={styles.accuracyLabel}>Accuracy</Text>
            </View>
            <Text style={styles.message}>{getAccuracyMessage()}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.correctGreen} />
                <Text style={styles.statNum}>{score.correct}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={22} color={Colors.wrongRed} />
                <Text style={styles.statNum}>{score.wrong}</Text>
                <Text style={styles.statLabel}>Wrong</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="list-outline" size={22} color={Colors.accentBlue} />
                <Text style={styles.statNum}>{totalPhrases}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>

          {wrongPhrases.length > 0 && (
            <View style={styles.wrongSection}>
              <Text style={styles.wrongTitle}>{wrongPhrases.length} to Review</Text>
              {wrongPhrases.map((phrase, index) => (
                <View key={`${phrase.id}-${index}`} style={styles.wrongCard}>
                  <Text style={styles.wrongEnglish}>{phrase.english}</Text>
                  <Text style={styles.wrongRussian}>{phrase.russian}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.newRoundBtn} onPress={handlePlayAgain} activeOpacity={0.85}>
              <Ionicons name="play-outline" size={18} color={Colors.white} />
              <Text style={styles.newRoundBtnText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modeBtn} onPress={() => router.replace("/")} activeOpacity={0.85}>
              <Ionicons name="home-outline" size={18} color={Colors.accentBlue} />
              <Text style={styles.modeBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!introPlayed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}> 
        <ScrollView
          style={styles.scrollResults}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introHeader}>
            <Text style={styles.introTitle}>Listen First</Text>
            <Text style={styles.introSubtitle}>Listen to the 10 lines you will be quizzed on</Text>
          </View>

          <View style={styles.introListCard}>
            {roundPhrases.map((phrase, index) => {
              const isCurrent = playingAllIndex === index;
              return (
                <View
                  key={phrase.id}
                  style={[styles.introListItem, isCurrent && styles.introListItemActive]}
                >
                  <Text style={[styles.introListIndex, isCurrent && styles.introListIndexActive]}>
                    {index + 1}.
                  </Text>
                  <Text style={[styles.introListText, isCurrent && styles.introListTextActive]}>
                    {phrase.english}
                  </Text>
                </View>
              );
            })}
          </View>

          {isPlayingAll && playingAllIndex !== null && (
            <Text style={styles.playingProgress}>Playing {playingAllIndex + 1} / {roundPhrases.length}</Text>
          )}

          <TouchableOpacity
            style={[styles.playAllBtn, isPlayingAll && styles.playAllBtnDisabled]}
            onPress={playAll}
            disabled={isPlayingAll}
            activeOpacity={0.85}
          >
            <Ionicons name="musical-notes-outline" size={20} color={Colors.white} />
            <Text style={styles.playAllBtnText}>{isPlayingAll ? "Playing..." : "Play All"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.startQuizBtn, !hasListened && styles.startQuizBtnDisabled]}
            onPress={handleStartQuiz}
            disabled={!hasListened}
            activeOpacity={0.85}
          >
            <Text style={styles.startQuizBtnText}>Start Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.75}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.navy }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16 + webTopPadding, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.songInfo}>
            <Text style={styles.songTitle}>{songData.title}</Text>
            <Text style={styles.songArtist}>{songData.artist}</Text>
          </View>
          <Text style={styles.counter}>{currentIndex + 1} / {totalPhrases}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((currentIndex + 1) / totalPhrases) * 100}%` as any }]} />
        </View>

        {/* Chorus badge */}
        {currentPhrase.isChorus && (
          <View style={styles.chorusBadge}>
            <Text style={styles.chorusBadgeText}>Chorus</Text>
          </View>
        )}

        {/* Lyric card */}
        <Animated.View style={[styles.lyricCard, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.lyricLabel}>Fill in the blank</Text>
          <Text style={styles.lyricLine}>
            {buildDisplayLine(currentPhrase, isAnswered)}
          </Text>
          <Text style={styles.translation}>{currentPhrase.english}</Text>

          {/* Play button */}
          <TouchableOpacity
            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
            onPress={() => playPhrase(currentPhrase)}
          >
            <Ionicons
              name={isPlaying ? "pause" : "musical-notes-outline"}
              size={18}
              color={isPlaying ? Colors.navy : Colors.gold}
            />
            <Text style={[styles.playBtnText, isPlaying && styles.playBtnTextActive]}>
              {isPlaying ? "Playing..." : "Play this line"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsSection}>
          {options.map((option, index) => {
            const isSelected = selectedOption === option.id;
            const isCorrectOption = option.id === currentPhrase.id;
            const showCorrectReveal = answerState === "wrong" && isCorrectOption;
            const optionState = showCorrectReveal
              ? "correct"
              : isSelected
              ? answerState
              : "idle";

            return (
              <TouchableOpacity
                key={`${option.id}-${index}`}
                style={[
                  styles.optionCard,
                  optionState === "correct" && styles.optionCardCorrect,
                  optionState === "wrong" && styles.optionCardWrong,
                ]}
                activeOpacity={0.85}
                onPress={() => handleOptionPress(option)}
                disabled={isAnswered}
              >
                <Text
                  style={[
                    styles.optionWord,
                    optionState === "correct" && styles.optionTextCorrect,
                    optionState === "wrong" && styles.optionTextWrong,
                  ]}
                >
                  {option.blankWord}
                </Text>
                {isAnswered && (
                  <Text style={styles.optionTranslation}>{option.blankWordTranslation}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next button */}
        {isAnswered && audioFinished && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= totalPhrases ? "See Results" : "Next Line"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  scrollResults: { flex: 1 },
  scrollContent: { paddingHorizontal: 22 },
  header: { flexDirection: "row", marginBottom: 18 },
  homeBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.navyCard,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  scoreCard: {
    backgroundColor: Colors.navyCard, borderRadius: 26,
    padding: 26, alignItems: "center", marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  completedLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted, textTransform: "uppercase",
    letterSpacing: 1.2, marginBottom: 20,
  },
  accuracyCircle: {
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 4, alignItems: "center", justifyContent: "center",
    marginBottom: 18, backgroundColor: Colors.navyLight,
  },
  accuracyPct: { fontSize: 40, fontFamily: "Inter_700Bold", lineHeight: 46 },
  accuracyLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  message: {
    fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.white,
    textAlign: "center", marginBottom: 22, lineHeight: 22,
  },
  statsRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, height: 38, backgroundColor: Colors.border },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.white, lineHeight: 26 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  wrongSection: { marginBottom: 20 },
  wrongTitle: {
    fontSize: 14, fontFamily: "Inter_600SemiBold",
    color: Colors.wrongRed, marginBottom: 10,
  },
  wrongCard: {
    backgroundColor: Colors.navyCard, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: Colors.wrongRed,
    borderWidth: 1, borderColor: Colors.border,
  },
  wrongEnglish: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.white, marginBottom: 3 },
  wrongRussian: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  actionsSection: { gap: 10 },
  newRoundBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accentBlue, paddingVertical: 17,
    borderRadius: 16, gap: 10,
  },
  newRoundBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.white },
  modeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accentBlue + "12", paddingVertical: 15,
    borderRadius: 14, gap: 8, borderWidth: 1, borderColor: Colors.accentBlue + "30",
  },
  modeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.accentBlue },
  introHeader: {
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    marginBottom: 6,
  },
  introSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  introListCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    marginBottom: 14,
  },
  introListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
  },
  introListItemActive: {
    borderLeftColor: Colors.correctGreen,
    backgroundColor: Colors.correctGreen + "12",
  },
  introListIndex: {
    width: 24,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
  },
  introListIndexActive: {
    color: Colors.correctGreen,
  },
  introListText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.white,
    lineHeight: 20,
  },
  introListTextActive: {
    color: Colors.correctGreen,
  },
  playingProgress: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.correctGreen,
    marginBottom: 12,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentBlue,
    paddingVertical: 17,
    borderRadius: 16,
    gap: 10,
    marginBottom: 10,
  },
  playAllBtnDisabled: {
    opacity: 0.7,
  },
  playAllBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  startQuizBtn: {
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  startQuizBtnDisabled: {
    opacity: 0.45,
  },
  startQuizBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  skipBtn: {
    marginTop: 12,
    alignItems: "center",
  },
  skipBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  scroll: { paddingHorizontal: 20 },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
  },
  exitBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.navyCard,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  songInfo: { alignItems: "center" },
  songTitle: {
    fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.white,
  },
  songArtist: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted,
  },
  counter: {
    fontSize: 13, fontFamily: "Inter_600SemiBold",
    color: Colors.white, minWidth: 40, textAlign: "right",
  },
  progressTrack: {
    height: 3, backgroundColor: Colors.navyCard,
    borderRadius: 2, marginBottom: 20, overflow: "hidden",
  },
  progressFill: {
    height: "100%", backgroundColor: Colors.accentBlue, borderRadius: 2,
  },
  chorusBadge: {
    alignSelf: "center",
    backgroundColor: Colors.accentBlue + "20",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.accentBlue + "40",
  },
  chorusBadgeText: {
    fontSize: 11, color: Colors.accentBlue,
    fontFamily: "Inter_600SemiBold", letterSpacing: 0.5,
  },
  lyricCard: {
    backgroundColor: Colors.navyCard, borderRadius: 22,
    padding: 24, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  lyricLabel: {
    fontSize: 11, color: Colors.accentBlue,
    fontFamily: "Inter_600SemiBold", textTransform: "uppercase",
    letterSpacing: 1.2, marginBottom: 16,
  },
  lyricLine: {
    fontSize: 22, lineHeight: 34,
    flexDirection: "row", flexWrap: "wrap",
    marginBottom: 14,
  },
  lyricWord: {
    fontSize: 22, fontFamily: "Inter_500Medium",
    color: Colors.white, lineHeight: 34,
  },
  blankPlaceholder: {
    fontSize: 22, fontFamily: "Inter_700Bold",
    color: Colors.accentBlue, lineHeight: 34,
    borderBottomWidth: 2, borderBottomColor: Colors.accentBlue,
  },
  blankCorrect: {
    color: Colors.correctGreen,
  },
  blankRevealed: {
    color: Colors.gold,
  },
  translation: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.textMuted, marginBottom: 16, fontStyle: "italic",
  },
  playBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "flex-start",
    backgroundColor: Colors.gold + "18",
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16,
  },
  playBtnActive: {
    backgroundColor: Colors.gold,
  },
  playBtnText: {
    fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.gold,
  },
  playBtnTextActive: {
    color: Colors.navy,
  },
  optionsSection: { marginBottom: 14, gap: 10 },
  optionCard: {
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  optionCardCorrect: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.correctGreen,
  },
  optionCardWrong: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.wrongRed,
  },
  optionWord: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
    textAlign: "center",
  },
  optionTranslation: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 3,
    fontStyle: "italic",
  },
  optionTextCorrect: {
    color: Colors.correctGreen,
  },
  optionTextWrong: {
    color: Colors.wrongRed,
  },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.accentBlue, paddingVertical: 17,
    borderRadius: 16, gap: 10, marginBottom: 16,
  },
  nextBtnText: {
    fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.white,
  },
});
