import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {BookOpen, TrendingUp, Trophy, Clock, Code, Palette, Database, Briefcase,Award, CheckCircle, Flame, Zap,} from "lucide-react";
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
import { useSkillsProgress }                   from "@/hooks/useSkillsProgress";
import { CATEGORY_CONFIG, getFallbackConfig }  from "@/hooks/skillCategoryConfig";
import { Skeleton }                            from "@/components/ui/skeleton";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import ChatBot from "./ChatBot";
import { useRecommendedCourseIds } from "@/hooks/useRecommendedCourseIds";


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
  const [showAllSkills, setShowAllSkills] = useState(false);
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const { activities, isLoading: activitiesLoading } = useRecentActivities();
  const [showAllActivities, setShowAllActivities] = useState(false);
  

  // ✅ nouveaux états
  const [filters, setFilters] = useState<LearnerCourseFilters>({});
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  
  const { skills, overallProgress, isLoading, error, refetch } = useSkillsProgress();
  const mappedSkills = skills.map((skill) => {
  const config = CATEGORY_CONFIG[skill.category] ?? getFallbackConfig();
  return {
    name:             skill.categoryLabel,   
    level:            skill.level,           
    progress:         skill.progressPercentage,
    icon:             config.icon,
    color:            config.color,
    enrolledCourses:  skill.enrolledCourses,
    completedCourses: skill.completedCourses,
  };
});

const displayedSkills = showAllSkills ? mappedSkills : mappedSkills.slice(0, 2);

  const getUsername = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || payload.sub;
  };
  const username = getUsername();
  

  const filteredCourses = (courses ?? [])
    .filter(c => c.isActive)
    .filter(c =>!searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(c => !filters.category || c.category === filters.category)
    .filter(c => !filters.level || c.level === filters.level)
    .filter(c => filters.minPrice === undefined || c.price >= filters.minPrice)
    .filter(c => filters.maxPrice === undefined || c.price <= filters.maxPrice);

  const visibleCourses = showAllCourses ? filteredCourses : filteredCourses.slice(0, 3);

  const getUserId = (): number | null => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      return JSON.parse(stored).id ?? null;
    } catch { return null; }
  };
  const { recommendedIds } = useRecommendedCourseIds(getUserId());


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

  const getCourseProgress = (courseId: string): number | undefined =>
    enrollments.find(e => e.courseId === parseInt(courseId))?.progression;

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
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery}/>
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

        {/* Row 1 : WeeklyProgress seul */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <WeeklyProgress />
          </div>

          {/* Row 2 : RecentActivity + ChatBot côte à côte */}
          <div className="grid grid-cols-[3fr_2fr] gap-8 mb-8 items-stretch">
            
            {/* Recent Activity (gauche) */}
            <div className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="rounded-xl border border-border bg-card p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Recent Activity
                  </h3>
                  {activities.length > 4 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-secondary"
                      onClick={() => setShowAllActivities(prev => !prev)}
                    >
                      {showAllActivities ? "Show Less" : "View All"}
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {activitiesLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                        <div className="h-9 w-9 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    ))
                  ) : activities.length > 0 ? (
                    activities.slice(0, showAllActivities ? 10 : 4).map(activity => (
                      <ActivityItem
                        key={activity.id}
                        type={activity.type}
                        title={activity.title}
                        description={activity.description}
                        timeAgo={activity.timeAgo}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No recent activity yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ChatBot (droite) */}
            <div className="animate-fade-in" style={{ animationDelay: "0.55s" }}>
                <div className="h-full overflow-hidden">
                  <ChatBot apprenantId={getUserId() ?? 0} />
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
            {mappedSkills.length > 2 && (
            <Button
              className="gap-2 bg-gradient-primary hover:opacity-90"
              onClick={() => setShowAllSkills(prev => !prev)}
            >
              <TrendingUp className="h-4 w-4" />
              {showAllSkills ? "Show Less" : "Show All Skills"}
            </Button>
            )}
          </div>
        
          {/* Loading */}
          {isLoading && (                                  // ← "isLoading", pas "loading"
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          )}
        
          {/* Error */}
          {error && (
            <p className="text-sm text-muted-foreground">
              Unable to load skills. Please try again later.
            </p>
          )}
        
          {/* Data */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedSkills.map((skill, index) => (
                <div
                  key={skill.name}                          // ← skill.name vient du mapping
                  className="animate-fade-in"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <SkillCard {...skill} />
                </div>
              ))}
            </div>
          )}
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
                    isRecommended={[...recommendedIds].map(String).includes(String(course.id))}
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