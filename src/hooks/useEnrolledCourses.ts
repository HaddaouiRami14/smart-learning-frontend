import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export interface EnrolledCourseDTO {
  id:number;
  courseId:number;
  title:string;
  description:string;
  courseImageUrl:string;
  courseCategory:string;
  level:string;
  price:number;
  progression:number;
}

export const useEnrolledCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses]   = useState<EnrolledCourseDTO[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

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

  return { courses, isLoading, error };
};