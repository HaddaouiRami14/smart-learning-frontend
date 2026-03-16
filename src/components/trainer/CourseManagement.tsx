import { useEffect, useState } from "react";
import { Plus, MoreVertical, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Course, useCourses } from "@/hooks/useCourses";
import { CreateCourseDialog } from "./CreateCourseDialog";
import { cn } from "@/lib/utils";
import { EditCourseDialog } from "./EditCourseDialog";
import { useNavigate } from 'react-router-dom';

export interface CourseFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}

interface CourseManagementProps {
  searchQuery?: string;
  filters?: CourseFilters;
}

export const CourseManagement = ({ 
  searchQuery = "", 
  filters = {} 
}: CourseManagementProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  const { courses, coursesLoading, fetchCourses, deleteCourse, toggleActive } = useCourses();
  
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = (courseId: number) => {
    if (confirm("Are you sure you want to delete this course?")) {
      deleteCourse.mutate(courseId);
    }
  };

  const navigate = useNavigate();

  const handleToggleActive = (courseId: number, currentStatus: boolean | undefined) => {
    toggleActive.mutate({
      courseId,
      isActive: !currentStatus,
    });
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setIsEditOpen(true);
  };

  // Apply all filters
  const filteredCourses = courses.filter((course) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        course.title.toLowerCase().includes(searchLower) ||
        course.category.toLowerCase().includes(searchLower) ||
        (course.description && course.description.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.category && course.category !== filters.category) {
      return false;
    }

    // Price filter
    if (filters.minPrice !== undefined && course.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && course.price > filters.maxPrice) {
      return false;
    }

    // Status filter
    if (filters.status === "published" && !course.isActive) {
      return false;
    }
    if (filters.status === "draft" && course.isActive) {
      return false;
    }

    return true;
  });

  if (coursesLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading courses...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Your Courses</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage your learning content
            {filteredCourses.length !== courses.length && (
              <span className="ml-2 text-primary">
                ({filteredCourses.length} of {courses.length} shown)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No courses yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first course to start teaching
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No courses match your filters
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="group hover:shadow-lg transition-shadow"
            >
              {course.imageUrl && (
                <div className="w-full h-40 bg-muted overflow-hidden">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {course.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-xs",
                          course.isActive
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
  <DropdownMenuItem onClick={() => handleEdit(course)}>
    <Edit className="h-4 w-4 mr-2" />
    Edit Course
  </DropdownMenuItem>
  <DropdownMenuItem
    onClick={() =>
      handleToggleActive(course.id, course.isActive)
    }
  >
    {course.isActive ? (
      <>
        <EyeOff className="h-4 w-4 mr-2" />
        Unpublish
      </>
    ) : (
      <>
        <Eye className="h-4 w-4 mr-2" />
        Publish
      </>
    )}
  </DropdownMenuItem>
  <DropdownMenuItem
    onClick={() => navigate(`/courses/${course.id}`)}
  >
    <Edit className="h-4 w-4 mr-2" />
    Manage Chapters
  </DropdownMenuItem>
  <DropdownMenuItem
    onClick={() => navigate(`/courses/${course.id}/preview`)}
  >
    <Eye className="h-4 w-4 mr-2" />
    Preview as Learner
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem
    className="text-destructive"
    onClick={() => handleDelete(course.id)}
  >
    <Trash2 className="h-4 w-4 mr-2" />
    Delete
  </DropdownMenuItem>
</DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {course.description || "No description provided"}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>${course.price}</span>
                  <span>
                    Updated{" "}
                    {new Date(course.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateCourseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditCourseDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        course={selectedCourse}
      />
    </div>
  );
};