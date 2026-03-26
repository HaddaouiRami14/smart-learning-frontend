import { useState, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export interface CourseWithTrainer {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;                
  imageUrl: string | null;      
  formateurId: string;          
  formateurName: string | null; 
  isActive: boolean;             
  createdAt: string;            
  updatedAt?: string;           
}
interface CourseDTO {
  id: number;
  title: string;
  description?: string;
  category: string;
  price: number;
  imageUrl?: string;
  formateurId?: number;
  formateurName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const API_BASE = "/api/admin/courses";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const mapDTOToFrontend = (dto: CourseDTO): CourseWithTrainer => ({
  id: dto.id.toString(),
  title: dto.title,
  description: dto.description || null,
  category: dto.category,
  price: dto.price,
  imageUrl: dto.imageUrl || null,
  formateurId: dto.formateurId?.toString() || "",
  formateurName: dto.formateurName || null,
  isActive: dto.isActive,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});


const mapFrontendToDTO = (course: CourseWithTrainer): Partial<CourseDTO> => ({
  title: course.title,
  description: course.description || "",
  category: course.category,
  price: course.price,
  imageUrl: course.imageUrl || "",
  formateurId: parseInt(course.formateurId),
  isActive: course.isActive,
});

export const useAllCourses = () => {
  const [courses, setCourses] = useState<CourseWithTrainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const fetchCourses = useCallback(async () => {
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
          errorData.message || `Failed to fetch courses (${response.status})`
        );
      }

      const data: CourseDTO[] = await response.json();
      const mappedCourses = data.map(mapDTOToFrontend);
      setCourses(mappedCourses);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load courses. Please try again.";
      setError(errorMessage);
      console.error("Error fetching courses:", err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const togglePublish = useCallback(
    async ({
      courseId,
      isPublished,
    }: {
      courseId: string;
      isPublished: boolean;
    }) => {
      const endpoint = isPublished
        ? `${API_BASE}/${courseId}/deactivate`
        : `${API_BASE}/${courseId}/activate`;

         const headers = getAuthHeaders();
          console.log("Endpoint:", endpoint);
          console.log("Headers:", headers); 

      try {
        const response = await fetch(endpoint, {
          method: "PATCH",
          headers,
        });

        console.log("Response status:", response.status); 

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log("Error response:", errorData); 
          throw new Error(
            errorData.message || "Failed to update course status"
          );
        }

        const updatedDTO: CourseDTO = await response.json();
        const updatedCourse = mapDTOToFrontend(updatedDTO);

        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? updatedCourse : c))
        );

        toast({
          title: "Success",
          description: `Course ${isPublished ? "deactivated" : "activated"} successfully`,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update course status";
        console.error("Toggle publish error:", err);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    []
  );

  
  const deleteCourse = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`${API_BASE}/${courseId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete course");
      }

      setCourses((prev) => prev.filter((c) => c.id !== courseId));

      toast({
        title: "Success",
        description: "Course deleted successfully",
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
    }
  }, []);

  
  const refetch = useCallback(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    isLoading,
    error,
    togglePublish,
    deleteCourse,
    refetch,
  };
};