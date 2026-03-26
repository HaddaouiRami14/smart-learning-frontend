import { NavLink } from "react-router-dom";
import { useStreak } from "@/hooks/useStreak";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Trophy,
  Calendar,
  Settings,
  HelpCircle,
  Flame,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/learnercourses", icon: BookOpen, label: "My Courses" },
  { to: "/skills", icon: TrendingUp, label: "Skills" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
  { to: "/schedule", icon: Calendar, label: "Schedule" },
];

const secondaryLinks = [
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/help", icon: HelpCircle, label: "Help Center" },
];

export const Sidebar = () => {
  const { currentStreak, last7Days, loading } = useStreak();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Streak Card */}
        <div className="rounded-xl bg-gradient-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-white/20 p-2">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm opacity-90">Current Streak</p>
              {/* ✅ Remplace "12 Days" par la vraie valeur */}
              <p className="text-2xl font-bold">
                {loading ? "..." : `${currentStreak} ${currentStreak <= 1 ? "Day" : "Days"}`}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {/* ✅ Remplace i < 5 par les vraies données */}
            {last7Days.map((active, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full",
                  active ? "bg-secondary" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Daily Goal */}
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-secondary/10 p-2">
              <Target className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Daily Goal</p>
              <p className="text-xs text-muted-foreground">45 min / 60 min</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-accent" />
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="pt-4 border-t border-border">
          <nav className="space-y-1">
            {secondaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};
