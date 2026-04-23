import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SkillCard } from "@/components/dashboard/SkillCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_CONFIG, getFallbackConfig } from "@/hooks/skillCategoryConfig";
import { useSkillsProgress } from "@/hooks/useSkillsProgress";
import { TrendingUp } from "lucide-react";
import { useState } from "react";

const Skills = () => {
    const [showAllSkills, setShowAllSkills] = useState(false);

const { skills, overallProgress, isLoading, error, refetch } = useSkillsProgress();
  const mappedSkills = skills.map((skill) => {
  const config = CATEGORY_CONFIG[skill.category] ?? getFallbackConfig();
  return {
    name:             skill.categoryLabel,   
    level:            skill.level,           
    progress:         skill.progressPercentage,
    icon:             config.icon,
    color:            config.color,
    enrolledCourses:  skill.enrolledCourses,
    completedCourses: skill.completedCourses,
  };
});

//const displayedSkills = showAllSkills ? mappedSkills : mappedSkills.slice(0, 2);

    return (
        
        <div className="min-h-screen bg-background">
            <Header />
            <Sidebar />
        
        {/* Skills Section */}
        <main className="ml-64 pt-6 px-8 pb-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Your Skills
              </h2>
              <p className="text-muted-foreground">
                Track your progress across different domains
              </p>
            </div>
          </div>
        
          {/* Loading */}
          {isLoading && (                                  // ← "isLoading", pas "loading"
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          )}
        
          {/* Error */}
          {error && (
            <p className="text-sm text-muted-foreground">
              Unable to load skills. Please try again later.
            </p>
          )}
        
          {/* Data */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mappedSkills.map((skill, index) => (
                <div
                  key={skill.name}                          // ← skill.name vient du mapping
                  className="animate-fade-in"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <SkillCard {...skill} />
                </div>
              ))}
            </div>
          )}
        </div>
        </main>
        </div>
    );
};
export default Skills;