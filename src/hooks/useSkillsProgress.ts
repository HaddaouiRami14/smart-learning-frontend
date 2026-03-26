import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";


export interface SkillCategoryDTO {
  category:            string; 
  categoryLabel:       string; 
  progressPercentage:  number;
  level:               string; 
  enrolledCourses:     number;
  completedCourses:    number;
}

export interface SkillsDashboardDTO {
  apprenantId:               number;
  learnerName:               string;
  overallProgressPercentage: number;
  totalEnrolledCourses:      number;
  totalCompletedCourses:     number;
  skills:                    SkillCategoryDTO[];
}


const API_BASE = "http://localhost:8080/api/learner/skills";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};


export const useSkillsProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [dashboard, setDashboard] = useState<SkillsDashboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);


  const fetchSkills = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_BASE, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch skills (${response.status})`
        );
      }

      const data: SkillsDashboardDTO = await response.json();
      setDashboard(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch skills";
      console.error("Fetch skills error:", err);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);


  const fetchCategorySkill = useCallback(
    async (category: string): Promise<SkillCategoryDTO | null> => {
      try {
        const response = await fetch(`${API_BASE}/${category}`, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to fetch category skill (${response.status})`
          );
        }

        return (await response.json()) as SkillCategoryDTO;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch category skill";
        console.error("Fetch category skill error:", err);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      }
    },
    [toast]
  );

  const refetch = useCallback(() => {
    fetchSkills();
  }, [fetchSkills]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);
useEffect(() => {
    const handler = () => fetchSkills();
    window.addEventListener('progressUpdated', handler);
    return () => window.removeEventListener('progressUpdated', handler);
}, [fetchSkills]);


  return {
    dashboard,

    skills:          dashboard?.skills          ?? [],
    overallProgress: dashboard?.overallProgressPercentage ?? 0,
    totalEnrolled:   dashboard?.totalEnrolledCourses      ?? 0,
    totalCompleted:  dashboard?.totalCompletedCourses     ?? 0,

    isLoading,
    error,

    refetch,
    fetchCategorySkill,
  };
};