import { useState, useEffect } from "react";
import { useAllUsers } from "@/hooks/useAllUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";

interface Course {
  id: string;
  title: string;
  isActive: boolean;
}

interface TrendPoint {
  day: string;
  count: number;
}

interface EnrollmentCount {
  courseId: string;
  count: number;
}

export const AdminAnalytics = () => {
  const { users, isLoading: usersLoading } = useAllUsers();
  const [courses, setCourses]                     = useState<Course[]>([]);
  const [enrollmentCounts, setEnrollmentCounts]   = useState<EnrollmentCount[]>([]);
  const [enrollmentTrends, setEnrollmentTrends]   = useState<TrendPoint[]>([]);
  const [coursesLoading, setCoursesLoading]       = useState(true);
  const [countsLoading, setCountsLoading]         = useState(true);
  const [trendsLoading, setTrendsLoading]         = useState(true);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // ── Fetch courses ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/admin/courses", { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCourses(data.map((c: any) => ({
          id: String(c.id),
          title: c.title,
          isActive: c.isActive,
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // ── Fetch enrollment counts per course ──────────────────────────────────
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/admin/users/inscription-counts", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch inscription counts");

        // Backend retourne [[courseId, count], ...]
        const data: Array<[number, number]> = await res.json();
        setEnrollmentCounts(
          data.map(([courseId, count]) => ({
            courseId: String(courseId),
            count: Number(count),
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setCountsLoading(false);
      }
    };
    fetchCounts();
  }, []);

  // ── Fetch enrollment trends (30 derniers jours) ─────────────────────────
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch("/api/admin/users/enrollment-trends", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch trends");

        // Backend retourne [[dateString, count], ...]
        const data: Array<[string, number]> = await res.json();
        setEnrollmentTrends(
          data.map(([day, count]) => ({
            day: new Date(day).toLocaleDateString("fr-FR", {
              month: "short",
              day: "numeric",
            }),
            count: Number(count),
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setTrendsLoading(false);
      }
    };
    fetchTrends();
  }, []);

  const isLoading = usersLoading || coursesLoading || countsLoading || trendsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader><div className="h-6 w-32 bg-muted rounded" /></CardHeader>
            <CardContent><div className="h-64 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Data prep ────────────────────────────────────────────────────────────
  const totalTrainers = users.filter(u => u.role === "trainer").length;
  const totalLearners = users.filter(u => u.role === "learner").length;
  const userDistribution = [
    { name: "Trainers", value: totalTrainers, color: "#22c55e" },
    { name: "Learners", value: totalLearners, color: "#3b82f6" },
  ];

  const totalCourses    = courses.length;
  const publishedCourses = courses.filter(c => c.isActive).length;
  const courseStats = [
    { name: "Published", value: publishedCourses },
    { name: "Draft",     value: totalCourses - publishedCourses },
  ];

  // Joindre les counts avec les titres des cours
  const enrollmentByCoursData = enrollmentCounts
    .map(({ courseId, count }) => ({
      name: courses.find(c => c.id === courseId)?.title ?? `Course ${courseId}`,
      inscriptions: count,
    }))
    .sort((a, b) => b.inscriptions - a.inscriptions); // tri décroissant

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* User Distribution ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>User Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userDistribution}
                cx="50%" cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                dataKey="value"
                labelLine={false}
              >
                {userDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Course Status ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Course Status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={courseStats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
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

      {/* ── NOUVEAU : Enrollments par cours ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollments par cours</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollmentByCoursData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-16">
              Aucune inscription enregistrée.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={enrollmentByCoursData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value} inscriptions`, ""]}
                />
                <Bar
                  dataKey="inscriptions"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                  label={{ position: "right", fontSize: 12 }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── NOUVEAU : Tendance des inscriptions (30j) ─────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Tendance des inscriptions — 30 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollmentTrends.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-16">
              Aucune donnée de tendance disponible.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={enrollmentTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value} inscriptions`, "Inscriptions"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#22c55e" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

    </div>
  );
};