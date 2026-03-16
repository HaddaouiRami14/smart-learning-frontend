import { useState, useEffect, useCallback } from "react";

const API = "/api/learner/enrollments";

export interface Enrollment {
  id: number;
  courseId: number;
  courseTitle: string;
  courseImageUrl: string | null;
  courseCategory: string;
  dateInscription: string;
  progression: number;
}

export interface ChapterProgress {
  quizPassed: boolean | null;
  exercisePassed: boolean | null;
  completed: boolean;
}

export interface ProgressDetail {
  progression: number;
  completedItems: string[];
  chapterProgress: { [chapterId: string]: ChapterProgress };
}

export const useEnrollment = (apprenantId: number | null, courseId: number | null) => {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [progressDetail, setProgressDetail] = useState<ProgressDetail | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchEnrollment = useCallback(async () => {
    if (!apprenantId || !courseId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/${apprenantId}/course/${courseId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEnrollment(data);
        setIsEnrolled(true);
      } else {
        setIsEnrolled(false);
      }
    } catch { setIsEnrolled(false); }
    finally { setLoading(false); }
  }, [apprenantId, courseId]);

  // ✅ NEW: Fetch detailed progress
  const fetchProgressDetail = useCallback(async (): Promise<ProgressDetail | null> => {
    if (!apprenantId || !courseId) return null;
    try {
      const res = await fetch(`${API}/${apprenantId}/progress/${courseId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProgressDetail(data);
        return data;
      }
    // eslint-disable-next-line no-empty
    } catch { }
    return null;
  }, [apprenantId, courseId]);

  const enroll = async () => {
    if (!apprenantId || !courseId) return;
    const res = await fetch(`${API}/${apprenantId}/enroll/${courseId}`, {
      method: "POST", headers
    });
    if (res.ok) {
      const data = await res.json();
      setEnrollment(data);
      setIsEnrolled(true);
    }
  };

  const updateProgress = async (progression: number) => {
    if (!apprenantId || !courseId) return;
    const res = await fetch(`${API}/${apprenantId}/progress/${courseId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ progression })
    });
    if (res.ok) {
      const data = await res.json();
      setEnrollment(data);
    }
  };

  useEffect(() => { fetchEnrollment(); }, [fetchEnrollment]);

  return { 
    enrollment, 
    progressDetail,
    isEnrolled, 
    loading, 
    enroll, 
    updateProgress,
    fetchProgressDetail 
  };
};