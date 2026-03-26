import { useState, useEffect } from "react";

export interface AdminStats {
  totalUsers: number;
  totalTrainers: number;
  totalLearners: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
}

const BASE_URL = "http://localhost:8080";

const defaultStats: AdminStats = {
  totalUsers: 0,
  totalTrainers: 0,
  totalLearners: 0,
  totalCourses: 0,
  publishedCourses: 0,
  totalEnrollments: 0,
  completedEnrollments: 0,
};

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      console.log("Fetching admin stats...");

      try {
        const token = localStorage.getItem("token");

        const requestOptions: RequestInit = {
          credentials: "include", 
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (token) {
          requestOptions.headers = {
            ...requestOptions.headers,
            Authorization: `Bearer ${token}`,
          };
        }

        const [usersRes, coursesRes] = await Promise.all([
          fetch(`${BASE_URL}/api/admin/users`, requestOptions),
          fetch(`${BASE_URL}/api/admin/courses`, requestOptions),
        ]);

        if (!usersRes.ok || !coursesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const users = await usersRes.json();
        const courses = await coursesRes.json();

        // ✅ Count users by role
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalTrainers = users.filter((u: any) => u.role === "TRAINER").length;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalLearners = users.filter((u: any) => u.role === "LEARNER").length;

        const totalCourses = courses.length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const publishedCourses = courses.filter((c: any) => c.isActive === true).length;

        setStats({
          totalUsers: users.length,
          totalTrainers,
          totalLearners,
          totalCourses,
          publishedCourses,
          totalEnrollments: 0, 
          completedEnrollments: 0, 
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading };
};