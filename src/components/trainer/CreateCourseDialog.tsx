import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,DialogTitle,} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";
import { useCourses } from "@/hooks/useCourses";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
];

const levels = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const CreateCourseDialog = ({
  open,
  onOpenChange,
}: CreateCourseDialogProps) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);

  const { createCourse } = useCourses();

  // ✅ CHANGED: price is optional — empty or 0 means free
  const isFormValid = () => {
    return (
      title.trim() !== "" &&
      category !== "" &&
      level !== ""
    );
  };

  // ✅ CHANGED: if price is empty or 0, treat as free (0)
  const parsedPrice = () => {
    if (price === "" || price === null) return 0;
    const val = parseFloat(price);
    return isNaN(val) || val < 0 ? 0 : val;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      const response = await createCourse.mutate({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        price: parsedPrice(), // ✅ 0 if empty or zero
        level,
        imageUrl: imageUrl.trim() || undefined,
      });

      if (response?.id) {
        setCreatedCourseId(response.id);
      }

      setTitle("");
      setDescription("");
      setCategory("");
      setPrice("");
      setImageUrl("");
    } catch (error) {
      console.error("Failed to create course:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChapter = () => {
    if (createdCourseId) {
      onOpenChange(false);
      navigate(`/courses/${createdCourseId}/chapters/new`);
      setCreatedCourseId(null);
    }
  };

  const handleBackToCourses = () => {
    onOpenChange(false);
    navigate("/courses");
    setCreatedCourseId(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle("");
      setDescription("");
      setCategory("");
      setPrice("");
      setLevel("BEGINNER");
      setImageUrl("");
      setCreatedCourseId(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        {!createdCourseId ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Start by adding the basic details. You can add chapters and content later.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to React"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What will students learn in this course?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
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

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
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

              {/* ✅ CHANGED: price is optional, placeholder shows it's free if empty */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Leave empty or 0 for free"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                />
                {/* ✅ Show free badge when empty or 0 */}
                {(price === "" || parseFloat(price) === 0) && (
                  <p className="text-xs text-green-600 font-medium">✅ This course will be free</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageFile">Course Image (JPG, PNG, etc.)</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setImageUrl(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  disabled={isSubmitting}
                />
                {imageUrl && (
                  <div className="mt-2">
                    <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                    <Button type="button" variant="destructive" size="sm" onClick={() => setImageUrl("")}>
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !isFormValid()}>
                  {isSubmitting ? "Creating..." : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>✅ Course Created Successfully!</DialogTitle>
              <DialogDescription>
                Your course "{title}" has been created. What would you like to do next?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Course:</span> {title}
                </p>
                <p className="text-sm text-green-700 mt-2">
                  You can now add chapters to this course.
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Back to Courses
              </Button>
              <Button type="button" onClick={handleCreateChapter} className="bg-blue-600 hover:bg-blue-700">
                ✏️ Create First Chapter
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};