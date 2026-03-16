import { useState, useEffect } from "react";
import { useAllUsers } from "@/hooks/useAllUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Course {
  id: string;
  isActive: boolean;
}

export const AdminAnalytics = () => {
  const { users, isLoading: usersLoading } = useAllUsers();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/admin/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCourses(data.map((c: any) => ({ id: c.id, isActive: c.isActive })));
      } catch (error) {
        console.error(error);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (usersLoading || coursesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // User distribution
  const totalTrainers = users.filter(u => u.role === "trainer").length;
  const totalLearners = users.filter(u => u.role === "learner").length;
  const userDistribution = [
    { name: "Trainers", value: totalTrainers, color: "#22c55e" },
    { name: "Learners", value: totalLearners, color: "#3b82f6" },
  ];

  // Course status
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.isActive).length;
  const courseStats = [
    { name: "Published", value: publishedCourses },
    { name: "Draft", value: totalCourses - publishedCourses },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* User Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                dataKey="value"
                labelLine={false}
              >
                {userDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Course Status */}
      <Card>
        <CardHeader>
          <CardTitle>Course Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={courseStats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};