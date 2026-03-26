import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { LearnerCourseFilters, LearnerCourseFiltersComponent } from "./LearnerCourseFilters";
import { useEnrolledCourses } from "@/hooks/useEnrolledCourses";

const DEFAULT_FILTERS: LearnerCourseFilters = {};

const LearnerCourses = () => {
  const { courses, isLoading, error } = useEnrolledCourses();
  const [filters, setFilters] = useState<LearnerCourseFilters>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses
    .filter(c =>!searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(c => !filters.category || c.courseCategory === filters.category)
    .filter(c => !filters.level    || c.level          === filters.level)
    .filter(c => filters.minPrice  === undefined       || c.price >= filters.minPrice)
    .filter(c => filters.maxPrice  === undefined       || c.price <= filters.maxPrice);

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery}/>
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
          {isLoading ? (
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
          ) : error ? (
            <div className="col-span-3 text-center py-16">
              <p className="text-muted-foreground">Unable to load courses. Please try again later.</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course, index) => (
              <div
                key={course.id}
                className="animate-fade-in"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <CourseCard
                  id={String(course.courseId)}
                  title={course.title}
                  description={course.description}
                  image={course.courseImageUrl || ""}
                  category={course.courseCategory}
                  duration="Self-paced"
                  students={0}
                  rating={0}
                  price={course.price}
                  progress={course.progression}
                />
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {Object.keys(filters).some(k => filters[k as keyof LearnerCourseFilters] !== undefined)
                  ? "No courses match your filters."
                  : "You are not enrolled in any course yet."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LearnerCourses;