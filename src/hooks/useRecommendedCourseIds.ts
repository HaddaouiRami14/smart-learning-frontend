// src/hooks/useRecommendedCourseIds.ts
import { useEffect, useState } from "react";

export function useRecommendedCourseIds(userId: number | null) {
  const [recommendedIds, setRecommendedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading]           = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetch_ = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res   = await fetch(
          `http://localhost:8080/api/recommendations/${userId}/ids`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const ids: number[] = await res.json();
          setRecommendedIds(new Set(ids));
        }
      } catch (err) {
        console.error("Failed to fetch recommended ids:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetch_();
  }, [userId]);

  return { recommendedIds, isLoading };
}