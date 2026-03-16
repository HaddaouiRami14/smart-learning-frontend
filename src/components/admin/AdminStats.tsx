import { useAdminStats } from "@/hooks/useAdminStats";
import { Users, BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminStats = () => {
  const { stats, isLoading } = useAdminStats();

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: `${stats.totalTrainers} trainers, ${stats.totalLearners} learners`,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      description: `${stats.publishedCourses} published`,
      icon: BookOpen,
      color: "text-green-500",
    },
    {
      title: "Total Enrollments",
      value: stats.totalEnrollments,
      description: `${stats.completedEnrollments} completed`,
      icon: GraduationCap,
      color: "text-purple-500",
    },
    {
      title: "Completion Rate",
      value:
        stats.totalEnrollments > 0
          ? `${Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100)}%`
          : "0%",
      description: "Overall completion rate",
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
