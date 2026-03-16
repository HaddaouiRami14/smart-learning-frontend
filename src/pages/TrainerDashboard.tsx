import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { TrainerSidebar } from "@/components/trainer/TrainerSidebar";
import { TrainerStats } from "@/components/trainer/TrainerStats";
import { CourseFilters, CourseManagement } from "@/components/trainer/CourseManagement";
import { StudentTable } from "@/components/trainer/StudentTable";
import { TrainerAnalytics } from "@/components/trainer/TrainerAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, BarChart3 } from "lucide-react";
import { CourseFiltersComponent } from "@/components/trainer/CourseFilters";

interface TrainerDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TrainerDashboard = ({ activeTab: initialTab = "dashboard", onTabChange }: TrainerDashboardProps) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<CourseFilters>({});

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  const handleFiltersChange = (newFilters: CourseFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <TrainerSidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Trainer Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your courses, track student progress, and analyze
              performance.
            </p>
          </div>
          
          

          {/* Stats Overview - SEULEMENT sur "dashboard" */}
         {/* Main Content */}
          {(activeTab === "dashboard" ) && (
            <div className="space-y-3">
              <TrainerStats />
              <CourseFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
              />
              <CourseManagement searchQuery={searchQuery} filters={filters} />
            </div>
          )}
           {(activeTab === "courses") && (
            <div className="space-y-0">
              <CourseFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
              />
              <CourseManagement searchQuery={searchQuery} filters={filters} />
            </div>
            
          )}
          {activeTab === "students" && (
            <StudentTable />
          )}
          {activeTab === "analytics" && (
            <TrainerAnalytics />
          )}
        </div>
      </main>
    </div>
  );
};

export default TrainerDashboard;