/*import { Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { PublicCourse } from "@/hooks/usePublicCourses";

interface PublicCourseCardProps {
  course: PublicCourse;
}

export const PublicCourseCard = ({ course }: PublicCourseCardProps) => {
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Self-paced";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {course.imageUrl  ? (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            {course.category}
          </Badge>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description || "Start your learning journey with this course."}
          </p>
        </div>
        
        <Button className="w-full bg-gradient-accent hover:opacity-90" asChild>
          <Link to="/signup">Enroll Now</Link>
        </Button>
      </div>
    </div>
  );
};*/
import { Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { PublicCourse } from "@/hooks/usePublicCourses";

interface PublicCourseCardProps {
  course: PublicCourse;
}

export const PublicCourseCard = ({ course }: PublicCourseCardProps) => {
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Self-paced";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {course.imageUrl  ? (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            {course.category}
          </Badge>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description || "Start your learning journey with this course."}
          </p>
        </div>
        
        <Button className="w-full bg-gradient-accent hover:opacity-90" asChild>
          <Link to="/signup">Enroll Now</Link>
        </Button>
      </div>
    </div>
  );
};
