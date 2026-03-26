import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCourses, Course } from "@/hooks/useCourses";

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
}

const categories = [
  { value: "Programming", label: "Programming" },
  { value: "Design", label: "Design" },
  { value: "Business", label: "Business" },
  { value: "Marketing", label: "Marketing" },
  { value: "DataScience", label: "Data Science" },
  { value: "Language", label: "Language" },
  { value: "Music", label: "Music" },
  { value: "Photography", label: "Photography" },
  { value: "Other", label: "Other" },

]
const levels = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const EditCourseDialog = ({
  open,
  onOpenChange,
  course,
}: EditCourseDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  //const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);
  
  const navigate = useNavigate();
  const { updateCourse } = useCourses();

  // Remplir les champs quand le cours change
  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description || "");
      setCategory(course.category);
      setPrice(course.price.toString());
      setLevel(course.level || "BEGINNER");
      setImageUrl(course.imageUrl || "");
    }
  }, [course, open]);

  // ✅ Valider les données avant d'envoyer
  const isFormValid = () => {
    return (
      title.trim() !== "" &&
      category !== "" &&
      level !== "" &&
      price !== "" &&
      !isNaN(parseFloat(price)) &&
      parseFloat(price) > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid() || !course) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCourse.mutate({
        id: course.id,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        price: parseFloat(price),
        level,
        imageUrl: imageUrl.trim() || undefined,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update course:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limiter la taille à 500KB
      if (file.size > 500 * 1024) {
        alert("Image trop volumineuse (max 500KB)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;

        // Redimensionner l'image via canvas
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setImageUrl(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

   // ✅ Naviguer vers ChapterEditor
  const handleCreateChapter = () => {
    if (course) {
      onOpenChange(false);
      navigate(`/courses/${course.id}/chapters/new`);
      // Réinitialiser
      //setCreatedCourseId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update your course details and content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Course Title</Label>
            <Input
              id="edit-title"
              placeholder="e.g., Introduction to React"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="What will students learn in this course?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div className="space-y-2">
            <Label htmlFor="edit-level">Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-price">Price (USD) *</Label>
            <Input
              id="edit-price"
              type="number"
              placeholder="e.g., 49.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0"
              required
              disabled={isSubmitting}
            />
            {price && parseFloat(price) <= 0 && (
              <p className="text-xs text-red-500">Price must be greater than 0</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-imageFile">Course Image (JPG, PNG, etc.)</Label>
            <Input
              id="edit-imageFile"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSubmitting}
            />
            {imageUrl && (
              <div className="mt-2">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md"
                />
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setImageUrl("")}
                >
                    Remove Image
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid()}>
              {isSubmitting ? "Updating..." : "Update Course"}
            </Button>
             <Button
                type="button"
                onClick={handleCreateChapter}
                className="bg-blue-600 hover:bg-blue-700"
              >
                ✏️ Create new Chapter
              </Button>
          </DialogFooter>
          
        </form>
      </DialogContent>
    </Dialog>
  );
};