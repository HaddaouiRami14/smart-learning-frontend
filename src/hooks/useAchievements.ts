import { useEffect, useState } from "react";

interface AchievementStats {
  earnedBadges: number;
  totalBadges: number;
  newThisWeek: number; // ← à ajouter côté backend si absent
}

export const useAchievements = (userId: number | null) => {
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    const token = localStorage.getItem("token");

    fetch(`http://localhost:8080/api/learner/achievements/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { stats, isLoading };
};