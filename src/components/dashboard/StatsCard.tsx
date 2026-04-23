import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitle1?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent";
}

export const StatsCard = ({
  title,
  value,
  subtitle,
  subtitle1,
  icon: Icon,
  trend,
  variant = "default",
}: StatsCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        variant === "default" && "bg-card border-border",
        variant === "primary" && "bg-gradient-primary text-primary-foreground border-transparent",
        variant === "accent" && "bg-gradient-accent text-accent-foreground border-transparent"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "text-sm font-medium",
              variant === "default" ? "text-muted-foreground" : "opacity-90"
            )}
          >
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "text-sm whitespace-nowrap",
                variant === "default" ? "text-muted-foreground" : "opacity-80"
              )}
            >
              {subtitle}
            </p>
          )}
          {subtitle1 && (
            <p
              className={cn(
                "text-sm",
                variant === "default" ? "text-muted-foreground" : "opacity-80"
              )}
            >
              {subtitle1}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span
                className={cn(
                  "text-xs",
                  variant === "default" ? "text-muted-foreground" : "opacity-70"
                )}
              >
                vs last week
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "rounded-full p-3",
            variant === "default" && "bg-primary/10",
            variant === "primary" && "bg-white/20",
            variant === "accent" && "bg-white/20"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
