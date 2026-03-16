import { BookOpen, Users, TrendingUp, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useCourses } from "@/hooks/useCourses";
import { useStudents } from "@/hooks/useStudents";
import { useEffect } from "react";

export const TrainerStats = () => {
  const { courses, coursesLoading , fetchCourses  } = useCourses();
  const { students } = useStudents();

  const totalCourses =  courses?.length ?? 0;
  const publishedCourses = (courses ?? []).filter((c) => c.isActive).length;
  const totalStudents = students.length;

  useEffect(() => {
    fetchCourses(); // ✅ déclenche le fetch au montage
  }, [fetchCourses]);
  //const totalEnrollments = enrollments.length;

  // Calculate average completion rate
  /*const avgCompletion =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((sum, e) => sum + e.progress_percent, 0) /
            enrollments.length
        )
      : 0;
      
    <StatsCard
        title="Enrollments"
        value={totalEnrollments}
        subtitle="All time"
        icon={TrendingUp}
      />
      <StatsCard
        title="Avg. Completion"
        value={`${avgCompletion}%`}
        subtitle="Across all courses"
        icon={DollarSign}
        trend={avgCompletion > 50 ? { value: avgCompletion, isPositive: true } : undefined}
      />  
      
      
      
      
      */

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Courses"
        value={coursesLoading ? "..." : totalCourses}
        subtitle={`${publishedCourses} published`}
        icon={BookOpen}
        variant="primary"
      />
      <StatsCard
        title="Total Students"
        value={totalStudents}
        subtitle="Unique learners"
        icon={Users}
        variant="accent"
      />
      
    </div>
  );
};
