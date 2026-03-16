import { useCallback, useEffect, useState } from "react";
import { toast } from "./use-toast";

export interface PublicCourse {
  id: string;
  title: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
  price: number;
  level: string;
}

interface CourseDTO {
  id: number;
  title: string;
  description?: string;
  category: string;
  price: number;
  level: string;
  imageUrl?: string;
  formateurId?: number;
  formateurName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const API_BASE = "/api/courses";

const mapDTOToFrontend = (dto: CourseDTO): PublicCourse => ({
  id: dto.id.toString(),
  title: dto.title,
  description: dto.description || null,
  category: dto.category,
  imageUrl: dto.imageUrl || null,
  isActive: dto.isActive,
  price: dto.price,
  level: dto.level || "BEGINNER",
});

const mapFrontendToDTO = (course: PublicCourse): Partial<CourseDTO> => ({
  title: course.title,
  description: course.description || "",
  category: course.category,
  imageUrl: course.imageUrl || "",
});

export const usePublicCourses = () => {
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE, { method: "GET" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch courses (${response.status})`);
      }
      const data: CourseDTO[] = await response.json();
      setCourses(data.map(mapDTOToFrontend));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load courses. Please try again.";
      setError(errorMessage);
      console.error("Error fetching courses:", err);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return { data: courses, isLoading, error, refetch: fetchCourses };
};