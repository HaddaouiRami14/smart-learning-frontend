import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {  useToast } from "@/hooks/use-toast";

export interface Course {
  id: number;
  title: string;
  description?: string;
  category: string;
  price: number;
  level: string;                
  imageUrl: string | null;      
  formateurId: number;          
  formateurName: string | null; 
  isActive: boolean;             
  createdAt: string;            
  updatedAt?: string;  
}

const API_BASE = "http://localhost:8080/api/formateur/courses";

interface CreateCourseData {
  title: string;
  description?: string;
  category: string;
  price: number;
  level?: string;
  imageUrl?: string;
}

interface UpdateCourseData extends Partial<CreateCourseData> {
  id: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const useCourses = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Récupérer tous les cours du formateur
  const fetchCourses = useCallback(async () => {
    if (!user) {
      console.warn("No user found, skipping fetch");
      return;
    }

    setCoursesLoading(true);
    try {
      const response = await fetch(API_BASE, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch courses (${response.status})`
        );
      }

      const data: Course[] = await response.json();
      setCourses(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch courses";
      console.error("Fetch courses error:", err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCoursesLoading(false);
    }
  }, [user]);

  // Créer un nouveau cours
  const createCourse = {
    mutate: useCallback(
      async (courseData: CreateCourseData) => {
        try {
          const response = await fetch(API_BASE, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              title: courseData.title,
              description: courseData.description || "",
              category: courseData.category,
              price: courseData.price,
               level: courseData.level || "BEGINNER",
              imageUrl: courseData.imageUrl || null,
              // formateurId, formateurName, isActive, createdAt, updatedAt sont générés côté serveur
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message || "Failed to create course"
            );
          }

          const newCourse: Course = await response.json();
          setCourses((prev) => [newCourse, ...prev]);

          toast({
            title: "Success",
            description: "Your new course has been created successfully.",
          });

          return newCourse;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to create course";
          console.error("Create course error:", err);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          throw err;
        }
      },
      [toast]
    ),
    isPending: false,
  };

  // Mettre à jour un cours
  const updateCourse = {
    mutate: useCallback(
      async (data: UpdateCourseData) => {
        try {
          const { id, ...updateData } = data;
          const response = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
             body: JSON.stringify({
            ...updateData,
            level: updateData.level || "BEGINNER",
          }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message || "Failed to update course"
            );
          }

          const updatedCourse: Course = await response.json();
          setCourses((prev) =>
            prev.map((c) => (c.id === id ? updatedCourse : c))
          );

          toast({
            title: "Success",
            description: "Your course has been updated successfully.",
          });

          return updatedCourse;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to update course";
          console.error("Update course error:", err);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          throw err;
        }
      },
      [toast]
    ),
    isPending: false,
  };

  // Supprimer un cours
  const deleteCourse = {
    mutate: useCallback(
      async (courseId: number) => {
        try {
          const response = await fetch(`${API_BASE}/${courseId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message || "Failed to delete course"
            );
          }

          setCourses((prev) => prev.filter((c) => c.id !== courseId));

          toast({
            title: "Success",
            description: "Your course has been deleted successfully.",
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to delete course";
          console.error("Delete course error:", err);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          throw err;
        }
      },
      [toast]
    ),
    isPending: false,
  };

  // Activer/Désactiver un cours
  const toggleActive = {
    mutate: useCallback(
      async (data: { courseId: number; isActive: boolean }) => {
        try {
          // Le endpoint appelle activate ou deactivate
          const endpoint = data.isActive
            ? `${API_BASE}/${data.courseId}/activate`
            : `${API_BASE}/${data.courseId}/deactivate`;

          const response = await fetch(endpoint, {
            method: "PATCH",
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message || "Failed to update course status"
            );
          }

          const updatedCourse: Course = await response.json();
          setCourses((prev) =>
            prev.map((c) =>
              c.id === data.courseId ? updatedCourse : c
            )
          );

          toast({
            title: "Success",
            description: data.isActive
              ? "Your course is now active and visible to learners."
              : "Your course has been deactivated and hidden from learners.",
          });

          return updatedCourse;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to update course status";
          console.error("Toggle active error:", err);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          throw err;
        }
      },
      [toast]
    ),
    isPending: false,
  };

  return {
    courses,
    coursesLoading,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    toggleActive,
  };
};