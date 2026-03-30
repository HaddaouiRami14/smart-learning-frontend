import { Clock, Users, Star, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  id?: string;
  title: string;
  description: string;
  image: string;
  duration: string;
  students: number;
  rating: number;
  category: string;
  price?: number;
  level?: string;
  progress?: number;
  isNew?: boolean;
}

const levelConfig: Record<string, { label: string; className: string }> = {
  BEGINNER:     { label: "Beginner",     className: "bg-green-100 text-green-700" },
  INTERMEDIATE: { label: "Intermediate", className: "bg-yellow-100 text-yellow-700" },
  ADVANCED:     { label: "Advanced",     className: "bg-red-100 text-red-700" },
};

export const CourseCard = ({
  id, title, description, image, duration, students, rating,
  category, price, level, progress, isNew,
}: CourseCardProps) => {
  const navigate = useNavigate();
  const levelInfo = level ? levelConfig[level] : null;

  const handleClick = () => {
    // Already enrolled (has progress) → go to learning page
    // Not enrolled → go to detail/payment page first ✅
    if (progress !== undefined) {
      navigate(`/courses/${id}/learnerpreview`);
    } else {
      navigate(`/courses/${id}/enroll`);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">{category}</Badge>
          {isNew && <Badge className="bg-warning text-warning-foreground animate-pulse-glow">New</Badge>}
        </div>

        {price !== undefined && (
          <div className="absolute top-3 right-3">
            {price === 0 ? (
              <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow">Free</span>
            ) : (
              <span className="px-2.5 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full shadow">${price.toFixed(2)}</span>
            )}
          </div>
        )}

        <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <PlayCircle className="h-14 w-14 text-white drop-shadow-lg" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {levelInfo && (
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5", levelInfo.className)}>
                {levelInfo.label}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{duration}</span></div>
          <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{students.toLocaleString()}</span></div>
          <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /><span>{rating}</span></div>
        </div>

        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-secondary">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <Button
          onClick={handleClick}
          className={cn("w-full", progress !== undefined ? "bg-gradient-primary hover:opacity-90" : "bg-gradient-accent hover:opacity-90")}
        >
          {progress !== undefined ? "Continue Learning" : "View Course"}
        </Button>
      </div>
    </div>
  );
};