import { Trophy, CheckCircle, Flame, Zap, BookOpen, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityType } from "@/hooks/useRecentActivities";

// Mapping ActivityType → icône + couleur
const TYPE_CONFIG: Record<ActivityType, { icon: LucideIcon; bg: string; text: string }> = {
  ACHIEVEMENT:      { icon: Trophy,       bg: "bg-warning/10",     text: "text-warning"     },
  COURSE_COMPLETED: { icon: BookOpen,     bg: "bg-primary/10",     text: "text-primary"     },
  //LESSON_COMPLETED: { icon: CheckCircle,  bg: "bg-primary/10",     text: "text-primary"     },
  STREAK_MILESTONE: { icon: Flame,        bg: "bg-destructive/10", text: "text-destructive" },
  SKILL_LEVELUP:    { icon: Zap,          bg: "bg-secondary/10",   text: "text-secondary"   },
};

interface ActivityItemProps {
  type:        ActivityType;
  title:       string;
  description: string;
  timeAgo:     string;
}

export const ActivityItem = ({ type, title, description, timeAgo }: ActivityItemProps) => {
  const { icon: Icon, bg, text } = TYPE_CONFIG[type] ?? TYPE_CONFIG.ACHIEVEMENT;

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={cn("rounded-full p-2.5", bg)}>
        <Icon className={cn("h-4 w-4", text)} />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {timeAgo}
      </span>
    </div>
  );
};