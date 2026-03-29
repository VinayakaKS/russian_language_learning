import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { SentencePair } from "@/models/SentencePair";
import { SentenceStats, defaultStats } from "@/models/SentenceStats";
import { QuizMode } from "@/models/QuizMode";

const SENTENCES_KEY = "quiz_sentences_v2";
const STATS_KEY = "quiz_stats_v2";
const VOCAB_FILE = (FileSystem.documentDirectory ?? "") + "vocab.json";
const STATS_FILE = (FileSystem.documentDirectory ?? "") + "stats.json";
const ROUND_SIZE = 10;
const WEIGHTS_STORAGE_KEY = "quiz_sentence_weights_v1";

// ─── File helpers ─────────────────────────────────────────────────────────────

async function writeFile(path: string, data: unknown) {
  try {
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data), { encoding: "utf8" as any });
  } catch {
    // silently ignore write failures
  }
}

async function readFile<T>(path: string): Promise<T | null> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const content = await FileSystem.readAsStringAsync(path, { encoding: "utf8" as any });
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

// ─── Save both AsyncStorage and file ─────────────────────────────────────────

async function saveSentences(pairs: SentencePair[]) {
  await Promise.all([
    AsyncStorage.setItem(SENTENCES_KEY, JSON.stringify(pairs)).catch(() => {}),
    writeFile(VOCAB_FILE, pairs),
  ]);
}

async function saveStats(stats: Record<string, SentenceStats>) {
  await Promise.all([
    AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats)).catch(() => {}),
    writeFile(STATS_FILE, stats),
  ]);
}

async function loadSentencesFromStorage(): Promise<SentencePair[] | null> {
  // Try AsyncStorage first (faster)
  try {
    const stored = await AsyncStorage.getItem(SENTENCES_KEY);
    if (stored) {
      const pairs: SentencePair[] = JSON.parse(stored);
      if (pairs.length > 0) return pairs;
    }
  } catch {}
  // Fall back to file
  return readFile<SentencePair[]>(VOCAB_FILE);
}

async function loadStatsFromStorage(): Promise<Record<string, SentenceStats>> {
  try {
    const stored = await AsyncStorage.getItem(STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return (await readFile<Record<string, SentenceStats>>(STATS_FILE)) ?? {};
}

// ─── Spaced repetition ────────────────────────────────────────────────────────

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

// ─── Context ──────────────────────────────────────────────────────────────────

interface QuizContextType {
  allSentences: SentencePair[];
  statsMap: Record<string, SentenceStats>;
  currentRound: SentencePair[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  mode: QuizMode;
  wrongInRound: SentencePair[];
  hardInRound: SentencePair[];
  options: SentencePair[];
  selectedAnswer: SentencePair | null;
  isAnswered: boolean;
  markAsHard: (pair: SentencePair) => Promise<void>;
  markAsEasy: (pair: SentencePair) => Promise<void>;

  loadSentences: (pairs: SentencePair[]) => Promise<void>;
  loadFromStorage: () => Promise<boolean>;
  deleteSentence: (english: string) => Promise<void>;
  setMode: (mode: QuizMode) => void;
  startRound: (fromWrong?: boolean) => void;
  selectAnswer: (answer: SentencePair) => void;
  nextQuestion: () => void;
  clearData: () => Promise<void>;
}

const QuizContext = createContext<QuizContextType | null>(null);

export function useQuiz(): QuizContextType {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within a QuizProvider");
  return ctx;
}

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [allSentences, setAllSentences] = useState<SentencePair[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, SentenceStats>>({});
  const [currentRound, setCurrentRound] = useState<SentencePair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mode, setModeState] = useState<QuizMode>("englishToRussian");
  const [wrongInRound, setWrongInRound] = useState<SentencePair[]>([]);
  const [hardInRound, setHardInRound] = useState<SentencePair[]>([]);
  const [options, setOptions] = useState<SentencePair[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<SentencePair | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sentenceWeights, setSentenceWeights] = useState<Record<string, number>>({});

  const stateRef = useRef({
    allSentences,
    statsMap,
    currentRound,
    currentIndex,
    wrongInRound,
    hardInRound,
    isAnswered,
  });
  stateRef.current = { allSentences, statsMap, currentRound, currentIndex, wrongInRound, hardInRound, isAnswered };

  useEffect(() => {
    // ...existing code...
    (async () => {
      try {
        const rawWeights = await AsyncStorage.getItem(WEIGHTS_STORAGE_KEY);
        if (rawWeights) setSentenceWeights(JSON.parse(rawWeights));
      } catch {
        // ...existing error handling pattern...
      }
    })();
  }, []);

  const loadSentences = useCallback(async (pairs: SentencePair[]) => {
    const existing = stateRef.current.allSentences;
    const existingMap = new Map(
      existing.map((s) => [s.english.trim().toLowerCase(), s])
    );

    const merged = pairs.map((newPair) => {
      const key = newPair.english.trim().toLowerCase();
      return existingMap.get(key) ?? newPair;
    });

    const newKeys = new Set(pairs.map((s) => s.english.trim().toLowerCase()));
    for (const [key, sentence] of existingMap) {
      if (!newKeys.has(key)) {
        merged.push(sentence);
      }
    }

    setAllSentences(merged);
    await saveSentences(merged);
    const existing_stats = await loadStatsFromStorage();
    setStatsMap(existing_stats);
  }, []);

  const loadFromStorage = useCallback(async (): Promise<boolean> => {
    const pairs = await loadSentencesFromStorage();
    if (!pairs || pairs.length === 0) return false;
    setAllSentences(pairs);
    const stats = await loadStatsFromStorage();
    setStatsMap(stats);
    return true;
  }, []);

  const deleteSentence = useCallback(async (english: string) => {
    const next = stateRef.current.allSentences.filter((s) => s.english !== english);
    setAllSentences(next);
    await saveSentences(next);
  }, []);

  const setMode = useCallback((m: QuizMode) => setModeState(m), []);

  const startRound = useCallback((fromWrong = false) => {
    const { allSentences: sentences, wrongInRound: wrong, statsMap: stats } = stateRef.current;
    const source = fromWrong && wrong.length > 0 ? wrong : sentences;
    const round = buildRound(source, stats);
    setCurrentRound(round);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongInRound([]);
    setHardInRound([]);
    setSelectedAnswer(null);
    setIsAnswered(false);
    if (round.length > 0) {
      setOptions(generateOptions(round[0], sentences));
    }
  }, []);

  const selectAnswer = useCallback((answer: SentencePair) => {
    const { isAnswered: alreadyAnswered, currentRound: round, currentIndex: idx, statsMap: stats, allSentences: sentences } = stateRef.current;
    if (alreadyAnswered) return;
    const correct = round[idx];
    if (!correct) return;

    const isCorrect = answer.english === correct.english;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongCount((w) => w + 1);
      setWrongInRound((prev) => {
        if (prev.find((s) => s.english === correct.english)) return prev;
        return [...prev, correct];
      });
    }

    const existing = stats[correct.english] ?? defaultStats();
    const updated: SentenceStats = {
      timesCorrect: isCorrect ? existing.timesCorrect + 1 : existing.timesCorrect,
      timesWrong: isCorrect ? existing.timesWrong : existing.timesWrong + 1,
      lastAnsweredCorrectly: isCorrect,
      consecutiveCorrect: isCorrect ? existing.consecutiveCorrect + 1 : 0,
    };
    const nextStats = { ...stats, [correct.english]: updated };
    setStatsMap(nextStats);
    saveStats(nextStats);
  }, []);

  const nextQuestion = useCallback(() => {
    const { currentIndex: idx, currentRound: round, allSentences: sentences } = stateRef.current;
    const next = idx + 1;
    setCurrentIndex(next);
    setSelectedAnswer(null);
    setIsAnswered(false);
    if (next < round.length) {
      setOptions(generateOptions(round[next], sentences));
    }
  }, []);

  const clearData = useCallback(async () => {
    await Promise.all([
      AsyncStorage.multiRemove([SENTENCES_KEY, STATS_KEY]).catch(() => {}),
      FileSystem.deleteAsync(VOCAB_FILE, { idempotent: true }).catch(() => {}),
      FileSystem.deleteAsync(STATS_FILE, { idempotent: true }).catch(() => {}),
    ]);
    setAllSentences([]);
    setStatsMap({});
    setCurrentRound([]);
    setCurrentIndex(0);
  }, []);

  const persistSentenceWeights = async (next: Record<string, number>) => {
    await AsyncStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(next));
  };

  const markAsHard = async (pair: SentencePair) => {
    const key = getPairKey(pair);
    const next = { ...sentenceWeights, [key]: 8 };
    setSentenceWeights(next);
    setHardInRound((prev) => (prev.some((p) => p.english === pair.english) ? prev : [...prev, pair]));
    await persistSentenceWeights(next);
  };

  const markAsEasy = async (pair: SentencePair) => {
    const key = getPairKey(pair);
    const next = { ...sentenceWeights, [key]: 1 };
    setSentenceWeights(next);
    setHardInRound((prev) => prev.filter((p) => p.english !== pair.english));
    await persistSentenceWeights(next);
  };

  const value: QuizContextType = {
    allSentences,
    statsMap,
    currentRound,
    currentIndex,
    correctCount,
    wrongCount,
    mode,
    wrongInRound,
    hardInRound,
    options,
    selectedAnswer,
    isAnswered,
    markAsHard,
    markAsEasy,
    loadSentences,
    loadFromStorage,
    deleteSentence,
    setMode,
    startRound,
    selectAnswer,
    nextQuestion,
    clearData,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

const getPairKey = (pair: SentencePair) =>
  `${pair.russian}__${pair.english}`;
