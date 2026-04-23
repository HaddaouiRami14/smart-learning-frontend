import { cn } from "@/lib/utils";
import { useLearningTime } from "@/hooks/useLearningTime";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatDayTime = (seconds: number): string => {
  if (seconds === 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const WeeklyProgress = () => {
  const { weekDaySeconds } = useLearningTime();

  // Normalize: peak day = 100%, others proportional. Min bar height = 4px when > 0.
  const maxSeconds = Math.max(...weekDaySeconds, 1);
  const progress = weekDaySeconds.map((s) =>
    s === 0 ? 0 : Math.max(5, Math.round((s / maxSeconds) * 100))
  );

  // Today's index: getDay() returns 0=Sun…6=Sat → map to Mon=0…Sun=6
  const todayIndex = (new Date().getDay() + 6) % 7;

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
            <span className="text-sm text-muted-foreground">Logged</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted" />
            <span className="text-sm text-muted-foreground">No activity</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 h-48">
        {days.map((day, index) => {
          const isToday = index === todayIndex;
          const isFuture = index > todayIndex;
          const value = progress[index];
          const label = formatDayTime(weekDaySeconds[index]);

          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-40 flex items-end">
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-all duration-500",
                    isFuture
                      ? "bg-muted/40"
                      : isToday
                      ? "bg-gradient-accent shadow-glow"
                      : "bg-secondary/80"
                  )}
                  style={{ height: value === 0 ? "4px" : `${value}%` }}
                />
                {!isFuture && (
                  <span
                    className={cn(
                      "absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap",
                      isToday ? "text-secondary" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                )}
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