import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_PREFIX = "learningTime:";
const GOAL_MINUTES = 60;

const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getStoredSeconds = (userId: string, dateKey: string): number => {
  const key = `${STORAGE_PREFIX}${userId}:${dateKey}`;
  const val = parseInt(localStorage.getItem(key) ?? "0", 10);
  return isNaN(val) ? 0 : val;
};

export const useDailyGoal = () => {
  const { user } = useAuth();
  const userId = String(user?.id ?? user?.email ?? "guest");
  const [todaySeconds, setTodaySeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      setTodaySeconds(getStoredSeconds(userId, toDateKey(new Date())));
    };

    update(); // lecture initiale

    // Se synchronise toutes les 10s (même fréquence que useLearningTime)
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, [userId]);

  const todayMinutes = Math.min(Math.floor(todaySeconds / 60), GOAL_MINUTES);
  const percentage   = Math.min((todayMinutes / GOAL_MINUTES) * 100, 100);

  return { todayMinutes, goalMinutes: GOAL_MINUTES, percentage };
};