import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/useStudents";

interface TrainerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mainLinks = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "courses", icon: BookOpen, label: "My Courses" },
  { id: "students", icon: Users, label: "Students" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
];



export const TrainerSidebar = ({ activeTab, onTabChange }: TrainerSidebarProps) => {
  const navigate = useNavigate();
  const { students } = useStudents();
  const totalStudents = students.length;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card p-4 overflow-y-auto">
      <div className="space-y-6">

        {/* Quick Stats Card */}
        <div className="rounded-xl bg-gradient-to-br from-secondary to-secondary/80 p-4 text-secondary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-white/20 p-2">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm opacity-90">Active Students</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
          </div>
          <p className="text-xs opacity-75">Across all your courses</p>
        </div>


        {/* Main Navigation */}
        <nav className="space-y-1">

          {/* Tab Links */}
          {mainLinks.map((link) => (
            <Button
              key={link.id}
              variant={activeTab === link.id ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => onTabChange(link.id)}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Button>
          ))}
        </nav>

        
      </div>
    </aside>
  );
};