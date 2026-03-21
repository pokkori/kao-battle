import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RANKING_KEY = "face_fight_ranking";

export interface RankingEntry {
  stageId: string;
  score: number;
  rank: string;
  date: string;
}

export function useRanking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(RANKING_KEY)
      .then((raw) => {
        if (raw) {
          setRanking(JSON.parse(raw));
        }
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  const updateRanking = useCallback(
    async (stageId: string, score: number, rank: string, date: string) => {
      const entry: RankingEntry = { stageId, score, rank, date };
      setRanking((prev) => {
        const next = [...prev, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        AsyncStorage.setItem(RANKING_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  return { ranking, loaded, updateRanking };
}
