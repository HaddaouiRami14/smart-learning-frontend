import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type ActivityType = "COURSE_COMPLETED" | "ACHIEVEMENT" | "STREAK_MILESTONE" | "SKILL_LEVELUP";

export interface ActivityDTO {
  id:          number;
  type:        ActivityType;
  title:       string;
  description: string;
  timeAgo:     string;
}

export const useRecentActivities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [isLoading, setLoading]     = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch("http://localhost:8080/api/learner/activities", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => setActivities(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  return { activities, isLoading, error };
};