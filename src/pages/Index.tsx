import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, TrendingUp, Trophy, Clock, Code, Palette, Database, Briefcase,
  Award, CheckCircle, Flame, Zap,
} from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SkillCard } from "@/components/dashboard/SkillCard";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicCourses } from "@/hooks/usePublicCourses";
import { useTheme } from "@/hooks/useTheme";
import { LearnerCourseFilters, LearnerCourseFiltersComponent } from "./LearnerCourseFilters";

const skills = [
  {
    name: "React Development",
    level: "Advanced",
    progress: 78,
    icon: Code,
    color: "primary" as const,
    lessonsCompleted: 24,
    totalLessons: 32,
  },
  {
    name: "UI/UX Design",
    level: "Intermediate",
    progress: 56,
    icon: Palette,
    color: "secondary" as const,
    lessonsCompleted: 14,
    totalLessons: 25,
  },
  {
    name: "Database Management",
    level: "Beginner",
    progress: 35,
    icon: Database,
    color: "info" as const,
    lessonsCompleted: 7,
    totalLessons: 20,
  },
  {
    name: "Project Management",
    level: "Intermediate",
    progress: 62,
    icon: Briefcase,
    color: "warning" as const,
    lessonsCompleted: 18,
    totalLessons: 29,
  },
];

const activities = [
  {
    icon: Trophy,
    title: "Achievement Unlocked!",
    description: 'Earned "React Master" badge',
    time: "2 hours ago",
    type: "achievement" as const,
  },
  {
    icon: CheckCircle,
    title: "Lesson Completed",
    description: "Advanced State Management - Module 4",
    time: "4 hours ago",
    type: "course" as const,
  },
  {
    icon: Flame,
    title: "Streak Milestone",
    description: "You're on a 12-day learning streak!",
    time: "1 day ago",
    type: "streak" as const,
  },
  {
    icon: Zap,
    title: "Skill Level Up",
    description: "React Development reached Advanced level",
    time: "2 days ago",
    type: "skill" as const,
  },
];

// ✅ nouveau
interface Enrollment {
  id: number;
  courseId: number;
  courseTitle: string;
  progression: number;
}

const Index = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { data: courses, isLoading: coursesLoading } = usePublicCourses();
  const [showAllCourses, setShowAllCourses] = useState(false);
  const { theme } = useTheme();

  // ✅ nouveaux états
  const [filters, setFilters] = useState<LearnerCourseFilters>({});
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  // Username depuis le token (fichier 1)
  const getUsername = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || payload.sub;
  };
  const username = getUsername();

  // ✅ nouveau : filtrage des cours
  const filteredCourses = (courses ?? [])
    .filter(c => c.isActive)
    .filter(c => !filters.category || c.category === filters.category)
    .filter(c => !filters.level || c.level === filters.level)
    .filter(c => filters.minPrice === undefined || c.price >= filters.minPrice)
    .filter(c => filters.maxPrice === undefined || c.price <= filters.maxPrice);

  const visibleCourses = showAllCourses ? filteredCourses : filteredCourses.slice(0, 3);

  // ✅ nouveau : récupération de l'userId depuis localStorage
  const getUserId = (): number | null => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      return JSON.parse(stored).id ?? null;
    } catch { return null; }
  };

  // ✅ nouveau : fetch des enrollments
  useEffect(() => {
    const fetchEnrollments = async () => {
      const userId = getUserId();
      if (!userId) { setEnrollmentsLoading(false); return; }
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/learner/enrollments/${userId}`,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        if (response.ok) setEnrollments(await response.json());
      } catch (err) {
        console.error("Failed to fetch enrollments:", err);
      } finally { setEnrollmentsLoading(false); }
    };
    fetchEnrollments();
  }, []);

  // ✅ nouveau : progression par cours
  const getCourseProgress = (courseId: string): number | undefined =>
    enrollments.find(e => e.courseId === parseInt(courseId))?.progression;

  // Redirect selon le rôle
  useEffect(() => {
    if (role === "FORMATEUR") {
      navigate("/trainer", { replace: true });
    } else if (role === "ADMIN") {
      navigate("/admin", { replace: true });
    }
    if (!role) {
      navigate("/", { replace: true });
    }
  }, [role, navigate]);

  if (role === "FORMATEUR" || role === "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="ml-64 pt-6 px-8 pb-12">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {username} 👋
          </h1>
          <p className="text-muted-foreground">
            Continue your learning journey. You're making great progress!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {/* ✅ valeurs dynamiques depuis enrollments */}
            <StatsCard
              title="Courses In Progress"
              value={enrollments.length}
              subtitle={`${enrollments.filter(e => e.progression > 50).length} near completion`}
              icon={BookOpen}
              variant="primary"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <StatsCard
              title="Skills Tracked"
              value={12}
              subtitle="4 skills leveled up"
              icon={TrendingUp}
              trend={{ value: 15, isPositive: true }}
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <StatsCard
              title="Achievements"
              value={28}
              subtitle="3 new this week"
              icon={Trophy}
              variant="accent"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <StatsCard
              title="Learning Time"
              value="48h"
              subtitle="This month"
              icon={Clock}
              trend={{ value: 22, isPositive: true }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Weekly Progress Chart */}
          <div className="xl:col-span-2 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <WeeklyProgress />
          </div>

          {/* Recent Activity */}
          <div className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <div className="rounded-xl border border-border bg-card p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Activity
                </h3>
                <Button variant="ghost" size="sm" className="text-secondary">
                  View All
                </Button>
              </div>
              <div className="space-y-1">
                {activities.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Your Skills
              </h2>
              <p className="text-muted-foreground">
                Track your progress across different domains
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              View All Skills
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill, index) => (
              <div
                key={skill.name}
                className="animate-fade-in"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <SkillCard {...skill} />
              </div>
            ))}
          </div>
        </div>

        {/* Courses Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Continue Learning
              </h2>
              <p className="text-muted-foreground">
                Pick up where you left off or discover new courses
              </p>
            </div>
            <Button
              className="gap-2 bg-gradient-primary hover:opacity-90"
              onClick={() => setShowAllCourses(prev => !prev)}
            >
              <BookOpen className="h-4 w-4" />
              {showAllCourses ? "Show Less" : "Browse All Courses"}
            </Button>
          </div>

          {/* ✅ nouveau : composant de filtres */}
          <LearnerCourseFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onReset={() => setFilters({})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ✅ enrollmentsLoading ajouté à la condition */}
            {coursesLoading || enrollmentsLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : visibleCourses.length > 0 ? (
              visibleCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <CourseCard
                    id={course.id}
                    title={course.title}
                    description={course.description || ""}
                    image={course.imageUrl || ""}
                    category={course.category}
                    duration="Self-paced"
                    students={0}
                    rating={0}
                    price={course.price}           // ✅ nouveau
                    level={course.level}           // ✅ nouveau
                    progress={getCourseProgress(course.id)} // ✅ nouveau
                  />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground col-span-3 text-center py-8">
                {/* ✅ message dynamique selon filtres actifs */}
                {Object.keys(filters).length > 0 ? "No courses match your filters." : "No courses available yet."}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;