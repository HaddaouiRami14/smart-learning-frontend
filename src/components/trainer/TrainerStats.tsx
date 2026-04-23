import { BookOpen, Users, TrendingUp, DollarSign, Award } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useCourses } from "@/hooks/useCourses";
import { useStudents } from "@/hooks/useStudents";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface TrainerStats {
  totalEnrollments: number;
  totalCompletions: number;
  avgProgressPercent: number;
}

export const TrainerStats = () => {
  const { courses, coursesLoading , fetchCourses  } = useCourses();
  const { students } = useStudents();
  const [stats, setStats] = useState<TrainerStats | null>(null);

  const totalCourses =  courses?.length ?? 0;
  const publishedCourses = (courses ?? []).filter((c) => c.isActive).length;
  const totalStudents = students.length;
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/formateur/courses/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const totalEnrollments = stats?.totalEnrollments ?? students.reduce((sum, s) => sum + s.enrolledCourses, 0);
  const totalCompletions = stats?.totalCompletions ?? 0;
  const avgCompletion    = totalEnrollments > 0
  ? Math.round((totalCompletions / totalEnrollments) * 100)
  : 0;
  

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
      <StatsCard
        title="Enrollments"
        value={totalEnrollments}
        subtitle={`${totalCompletions} completed`}  
        icon={TrendingUp}
      />
      <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <div>
        <StatsCard
          title="Completion rate"
          value={`${avgCompletion}%`} 
          subtitle="Across your courses"
          icon={Award}
          variant="accent"
        />
      </div>
      </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-[200px]">
            <p className="font-medium mb-1">Average Completion rate</p>
            <p className="text-muted-foreground">
              = courses completed ÷ total enrollments × 100
            </p>
            <p className="text-muted-foreground mt-1">
              {totalCompletions} completed out of {totalEnrollments} enrollments
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
    </div>
  );
};