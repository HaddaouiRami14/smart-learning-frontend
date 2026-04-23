import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";


export interface StudentWithProgress {
  id: string;
  username: string | null;    
  email: string | null;        
  avatarUrl: string | null;   
  enrolledCourses: number;     
  avgProgress: number;         
  lastActive: string;         
}


const API_BASE = "http://localhost:8080/api/formateur/courses/students"; 

export const useStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch students (${response.status})`);

      const data = await response.json();

      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: StudentWithProgress[] = data.map((s: any) => ({
        id:               String(s.id),
        username:         s.username ?? "Unknown", 
        email:            s.email ?? null,
        avatarUrl:        s.avatarUrl ?? null,    
        enrolledCourses:  s.enrolledCourses,      
        avgProgress:      s.avgProgress,          
        lastActive:       s.lastActive,           
      }));

      setStudents(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch students");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, isLoading, error, refetch: fetchStudents };
};