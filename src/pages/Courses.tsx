import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { usePublicCourses } from "@/hooks/usePublicCourses";
import { BookOpen } from "lucide-react";
import { LearnerCourseFilters, LearnerCourseFiltersComponent } from "./LearnerCourseFilters";

interface Enrollment {
  id: number;
  courseId: number;
  courseTitle: string;
  progression: number;
}

const DEFAULT_FILTERS: LearnerCourseFilters = {};

const Courses = () => {
  const { data: courses, isLoading } = usePublicCourses();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [filters, setFilters] = useState<LearnerCourseFilters>(DEFAULT_FILTERS);

  const getUserId = (): number | null => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      return JSON.parse(stored).id ?? null;
    } catch { return null; }
  };

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

  const filteredCourses = (courses ?? [])
    .filter(c => c.isActive)
    .filter(c => !filters.category || c.category === filters.category)
    .filter(c => !filters.level || c.level === filters.level)
    .filter(c => filters.minPrice === undefined || c.price >= filters.minPrice)
    .filter(c => filters.maxPrice === undefined || c.price <= filters.maxPrice);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="ml-64 pt-6 px-8 pb-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Courses</h1>
          <p className="text-muted-foreground">Browse and continue your enrolled courses.</p>
        </div>

        <LearnerCourseFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading || enrollmentsLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course, index) => (
              <div key={course.id} className="animate-fade-in" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                <CourseCard
                  id={course.id}
                  title={course.title}
                  description={course.description || ""}
                  image={course.imageUrl || ""}
                  category={course.category}
                  duration="Self-paced"
                  students={0}
                  rating={0}
                  price={course.price}
                  progress={getCourseProgress(course.id)}
                />
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0 ? "No courses match your filters." : "No courses available yet."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Courses;