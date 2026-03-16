import { cn } from "@/lib/utils";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const progress = [85, 65, 90, 45, 100, 30, 75];

export const WeeklyProgress = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Weekly Activity
          </h3>
          <p className="text-sm text-muted-foreground">
            Your learning progress this week
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted" />
            <span className="text-sm text-muted-foreground">Remaining</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 h-48">
        {days.map((day, index) => {
          const isToday = index === new Date().getDay() - 1;
          const value = progress[index];
          
          return (
            <div
              key={day}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="relative w-full h-40 flex items-end">
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-all duration-500",
                    isToday
                      ? "bg-gradient-accent shadow-glow"
                      : "bg-secondary/80"
                  )}
                  style={{ height: `${value}%` }}
                />
                <span
                  className={cn(
                    "absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium",
                    isToday ? "text-secondary" : "text-muted-foreground"
                  )}
                >
                  {value}%
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
