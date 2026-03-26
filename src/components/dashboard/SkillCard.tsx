import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface SkillCardProps {
  name:             string;
  level:            string;
  progress:         number;
  icon:             LucideIcon;
  color:            "primary" | "secondary" | "info" | "warning" | "success";
  enrolledCourses:  number; 
  completedCourses: number; 
}

const colorMap = {
  primary:   { bg: "bg-primary/10",   text: "text-primary",   progress: "bg-primary"   },
  secondary: { bg: "bg-secondary/10", text: "text-secondary", progress: "bg-secondary" },
  info:      { bg: "bg-info/10",      text: "text-info",      progress: "bg-info"      },
  warning:   { bg: "bg-warning/10",   text: "text-warning",   progress: "bg-warning"   },
  success:   { bg: "bg-success/10",   text: "text-success",   progress: "bg-success"   },
};

export const SkillCard = ({
  name,
  level,
  progress,
  icon: Icon,
  color,
  enrolledCourses,
  completedCourses,
}: SkillCardProps) => {
  const colors = colorMap[color];

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:border-secondary/50">
      <div className="flex items-start gap-4">

        {/* Icon */}
        <div className={cn("rounded-xl p-3", colors.bg)}>
          <Icon className={cn("h-6 w-6", colors.text)} />
        </div>

        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground">{level}</p>
            </div>
            <span className={cn("text-lg font-bold", colors.text)}>
              {progress}%
            </span>
          </div>

          {/* Progress bar — indicatorClassName now actually applies the right color */}
          <div className="space-y-2">
            <Progress
              value={progress}
              className="h-2"
              indicatorClassName={colors.progress} // ← was ignored before
            />
            <p className="text-xs text-muted-foreground">
              {completedCourses} of {enrolledCourses} courses completed
            </p>
          </div>
        </div>
      </div>

      {/* Hover shimmer */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-r from-transparent via-white/5 to-transparent"
        )}
      />
    </div>
  );
};