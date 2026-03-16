import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  type: "achievement" | "course" | "streak" | "skill";
}

const typeStyles = {
  achievement: {
    bg: "bg-warning/10",
    text: "text-warning",
  },
  course: {
    bg: "bg-primary/10",
    text: "text-primary",
  },
  streak: {
    bg: "bg-destructive/10",
    text: "text-destructive",
  },
  skill: {
    bg: "bg-secondary/10",
    text: "text-secondary",
  },
};

export const ActivityItem = ({
  icon: Icon,
  title,
  description,
  time,
  type,
}: ActivityItemProps) => {
  const styles = typeStyles[type];

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={cn("rounded-full p-2.5", styles.bg)}>
        <Icon className={cn("h-4 w-4", styles.text)} />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {time}
      </span>
    </div>
  );
};
