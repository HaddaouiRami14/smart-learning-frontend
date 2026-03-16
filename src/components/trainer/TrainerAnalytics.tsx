import { BarChart3, TrendingUp, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useCourses } from "@/hooks/useCourses";
import { useStudents } from "@/hooks/useStudents";

const COLORS = ["hsl(224, 76%, 28%)", "hsl(168, 76%, 42%)", "hsl(38, 92%, 50%)", "hsl(199, 89%, 48%)"];

export const TrainerAnalytics = () => {
  const { courses, enrollments } = useCourses();
  const { students } = useStudents();

  // Course distribution by category
  const categoryData = courses.reduce((acc, course) => {
    const existing = acc.find((item) => item.name === course.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: course.category, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Enrollment trends (simulated weekly data based on enrollments)
  const enrollmentTrends = [
    { name: "Mon", enrollments: Math.floor(Math.random() * 10) },
    { name: "Tue", enrollments: Math.floor(Math.random() * 10) },
    { name: "Wed", enrollments: Math.floor(Math.random() * 10) },
    { name: "Thu", enrollments: Math.floor(Math.random() * 10) },
    { name: "Fri", enrollments: Math.floor(Math.random() * 10) },
    { name: "Sat", enrollments: Math.floor(Math.random() * 10) },
    { name: "Sun", enrollments: Math.floor(Math.random() * 10) },
  ];

  // Course performance data
  const coursePerformance = courses.slice(0, 5).map((course) => {
    const courseEnrollments = enrollments.filter(
      (e) => e.course_id === course.id
    );
    const avgProgress =
      courseEnrollments.length > 0
        ? Math.round(
            courseEnrollments.reduce((sum, e) => sum + e.progress_percent, 0) /
              courseEnrollments.length
          )
        : 0;
    return {
      name: course.title.length > 20 ? course.title.slice(0, 20) + "..." : course.title,
      students: courseEnrollments.length,
      progress: avgProgress,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Enrollment Trends */}
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
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="enrollments"
                fill="hsl(168, 76%, 42%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Course Distribution */}
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
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
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
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Course Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coursePerformance.length > 0 ? (
            <div className="space-y-4">
              {coursePerformance.map((course) => (
                <div key={course.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                      {course.name}
                    </span>
                    <span className="text-muted-foreground">
                      {course.students} students • {course.progress}% avg
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${course.progress}%` }}
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

      {/* Quick Stats */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-foreground">
                {students.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-foreground">
                {enrollments.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-foreground">
                {enrollments.filter((e) => e.progress_percent === 100).length}
              </p>
              <p className="text-sm text-muted-foreground">Completions</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-foreground">
                {enrollments.length > 0
                  ? Math.round(
                      enrollments.reduce((sum, e) => sum + e.progress_percent, 0) /
                        enrollments.length
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-muted-foreground">Avg. Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
