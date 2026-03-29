import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";

const STREAK_KEY = "app_streak_v1";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

const defaultStreak = (): StreakData => ({
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: "",
});

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>(defaultStreak());

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STREAK_KEY);
        if (raw) setStreak(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  const recordActivity = useCallback(async () => {
    const today = getTodayString();
    const yesterday = getYesterdayString();

    setStreak((prev) => {
      let next: StreakData;

      if (prev.lastActiveDate === today) {
        return prev;
      } else if (prev.lastActiveDate === yesterday) {
        const newStreak = prev.currentStreak + 1;
        next = {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, prev.longestStreak),
          lastActiveDate: today,
        };
      } else {
        next = {
          currentStreak: 1,
          longestStreak: Math.max(1, prev.longestStreak),
          lastActiveDate: today,
        };
      }

      AsyncStorage.setItem(STREAK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { streak, recordActivity };
}
