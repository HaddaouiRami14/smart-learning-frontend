import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";

export interface EnrolledCourseDTO {
  id:number;
  courseId:number;
  title:string;
  description:string;
  courseImageUrl:string;
  category:string;
  level:string;
  price:number;
  progression:number;
}

export const useEnrolledCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses]   = useState<EnrolledCourseDTO[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [inscriptionCounts, setInscriptionCounts] = useState<Record<string, number>>({});

  const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch("http://localhost:8080/api/learner/courses/my-courses", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);
  const fetchInscriptionCounts  = useCallback(async () => {
        try {
      const response = await fetch("http://localhost:8080/api/learner/courses/students", { // ← URL corrigée
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
  
      // Le backend retourne : [[courseId, count], [courseId, count], ...]
      const data: Array<[number, number]> = await response.json();
      const map: Record<string, number> = {};
      data.forEach(([courseId, count]) => {       // ← déstructuration tableau
        map[String(courseId)] = Number(count);
      });
      setInscriptionCounts(map);
    } catch (err) {
      console.error("Error fetching inscription counts:", err);
    }
  }, []);
  useEffect(() => {
  fetchInscriptionCounts();
}, [fetchInscriptionCounts]);

  return { courses, isLoading, error, inscriptionCounts };
};