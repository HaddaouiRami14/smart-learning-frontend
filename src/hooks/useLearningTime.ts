import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_PREFIX = "learningTime:";

const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekDays = (weekStart: Date): string[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toDateKey(d);
  });

// ← Toutes les clés incluent le userId
const makeKey = (userId: string, dateKey: string) =>
  `${STORAGE_PREFIX}${userId}:${dateKey}`;

const getStoredSeconds = (userId: string, dateKey: string): number => {
  const val = parseInt(localStorage.getItem(makeKey(userId, dateKey)) ?? "0", 10);
  return isNaN(val) ? 0 : val;
};

const addStoredSeconds = (userId: string, dateKey: string, seconds: number) => {
  if (seconds <= 0) return;
  const current = getStoredSeconds(userId, dateKey);
  localStorage.setItem(makeKey(userId, dateKey), String(current + seconds));
};

const sumWeekSeconds = (userId: string, weekStart: Date): number =>
  getWeekDays(weekStart).reduce(
    (acc, day) => acc + getStoredSeconds(userId, day),
    0
  );

const formatTime = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const useLearningTime = () => {
  const { user } = useAuth();
  const userId = String(user?.id ?? user?.email ?? "guest"); // ← identifiant unique
  const sessionStart = useRef<number>(Date.now());
  const [tick, setTick] = useState(0);

  // Persiste toutes les 10s
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
      if (elapsed > 0) {
        addStoredSeconds(userId, toDateKey(new Date()), elapsed);
        sessionStart.current = Date.now();
      }
      setTick((t) => t + 1);
    }, 10_000);
    return () => clearInterval(interval);
  }, [userId]);

  // Persiste sur fermeture / onglet caché
  useEffect(() => {
    if (!userId) return;

    const persist = () => {
      const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
      if (elapsed > 0) {
        addStoredSeconds(userId, toDateKey(new Date()), elapsed);
        sessionStart.current = Date.now();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist();
      if (document.visibilityState === "visible") {
        sessionStart.current = Date.now();
        setTick((t) => t + 1);
      }
    };

    // Reset sessionStart au montage (nouveau login)
    sessionStart.current = Date.now();

    window.addEventListener("pagehide", persist);
    window.addEventListener("beforeunload", persist);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pagehide", persist);
      window.removeEventListener("beforeunload", persist);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId]); // ← se réexécute si l'utilisateur change

  const now = new Date();
  const sessionElapsed = userId
    ? Math.floor((Date.now() - sessionStart.current) / 1000)
    : 0;

  const thisWeekStart = getWeekStart(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const todayKey = toDateKey(now);
  const weekDayKeys = getWeekDays(thisWeekStart);
  const weekDaySeconds: number[] = weekDayKeys.map((key) => {
    const stored = userId ? getStoredSeconds(userId, key) : 0;
    return key === todayKey ? stored + sessionElapsed : stored;
  });

  const thisWeekSeconds = userId
    ? sumWeekSeconds(userId, thisWeekStart) + sessionElapsed
    : 0;
  const lastWeekSeconds = userId ? sumWeekSeconds(userId, lastWeekStart) : 0;

  const trendValue =
    lastWeekSeconds > 0
      ? Math.round(((thisWeekSeconds - lastWeekSeconds) / lastWeekSeconds) * 100)
      : thisWeekSeconds > 0
      ? 100
      : 0;

  return {
    value: formatTime(thisWeekSeconds),
    trendValue: Math.abs(trendValue),
    isPositive: trendValue >= 0,
    weekDaySeconds,
  };
};