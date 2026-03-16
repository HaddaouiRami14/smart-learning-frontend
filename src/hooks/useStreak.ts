import { useState, useEffect } from "react";
import axios from "axios";

interface StreakData {
  currentStreak: number;
  last7Days: boolean[];
}

export const useStreak = () => {
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    last7Days: Array(7).fill(false),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const token = localStorage.getItem("token"); // ✅ ton JWT
        const response = await axios.get("/api/streak/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (error) {
        console.error("Streak fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, []);

  return { ...data, loading };
};