export interface SentenceStats {
  timesCorrect: number;
  timesWrong: number;
  lastAnsweredCorrectly: boolean | null;
  consecutiveCorrect: number;
}

export const defaultStats = (): SentenceStats => ({
  timesCorrect: 0,
  timesWrong: 0,
  lastAnsweredCorrectly: null,
  consecutiveCorrect: 0,
});
