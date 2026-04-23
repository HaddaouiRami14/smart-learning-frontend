import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, BookOpen, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip,TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";;

const COLORS = [
  "hsl(224, 76%, 28%)",
  "hsl(168, 76%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(199, 89%, 48%)",
];

interface TrainerStats {
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  freeCourses: number;
  paidCourses: number;
  avgProgressPercent: number;
}

export const TrainerAnalytics = () => {
  const { courses, fetchCourses, coursesLoading } = useCourses();
  const { user } = useAuth();

  const [stats, setStats] = useState<TrainerStats | null>(null);

  // ✅ REAL enrollment trends state
  const [enrollmentTrends, setEnrollmentTrends] = useState<
    { name: string; enrollments: number }[]
  >([]);

  // Fetch data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      await fetchCourses();

      const token = localStorage.getItem("token");

      try {
        // =========================
        // STATS FETCH
        // =========================
        const statsRes = await fetch(
          "http://localhost:8080/api/formateur/courses/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }

        // =========================
        // TRENDS FETCH (REAL DATA)
        // =========================
        const trendsRes = await fetch(
          "http://localhost:8080/api/formateur/courses/enrollment-trends",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (trendsRes.ok) {
          const data = await trendsRes.json();

          setEnrollmentTrends(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.map((item: any) => ({
              name: item.day,
              enrollments: item.count,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch trainer analytics:", err);
      }
    };

    fetchData();
  }, [user]);

  // ✅ Course distribution (fixed null safety)
  const categoryData = courses.reduce((acc, course) => {
    const category = course.category || "Uncategorized";

    const existing = acc.find((item) => item.name === category);

    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: category, value: 1 });
    }

    return acc;
  }, [] as { name: string; value: number }[]);

  // Loading state
  if (coursesLoading) {
    return (
      <div className="text-center p-6">Loading analytics...</div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* =========================
          ENROLLMENT TRENDS
      ========================= */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Enrollment Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={enrollmentTrends}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar
                dataKey="enrollments"
                fill="hsl(168, 76%, 42%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* =========================
          COURSE DISTRIBUTION
      ========================= */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No courses to display
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
                <span className="text-muted-foreground">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* =========================
          COURSE OVERVIEW
      ========================= */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Course Overview
          </CardTitle>
        </CardHeader>

        <CardContent>
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="truncate max-w-[200px]">
                      {course.title}
                    </span>

                    <div className="flex gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          course.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {course.isActive ? "Active" : "Inactive"}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {course.price === 0
                          ? "Free"
                          : `$${course.price}`}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        course.isActive
                          ? "bg-gradient-to-r from-primary to-secondary"
                          : "bg-muted-foreground/30"
                      }`}
                      style={{
                        width: course.isActive ? "100%" : "30%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No course data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================
          STUDENT INSIGHTS
      ========================= */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Insights
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">
                {stats?.totalEnrollments ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                Total Enrollments
              </p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">
                {stats?.totalCompletions ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                Completions
              </p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">
                {stats?.avgProgressPercent ?? "—"}%
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-sm text-muted-foreground">Avg. Progress</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[200px]">
                    <p className="font-medium mb-1">Average Progress</p>
                    <p className="text-muted-foreground">
                      Average progress of all your students across all your courses.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">
                {stats?.activeCourses ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                Active Courses
              </p>
              
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};