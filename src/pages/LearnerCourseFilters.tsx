import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

export interface LearnerCourseFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  level?: string;
}

interface LearnerCourseFiltersProps {
  filters: LearnerCourseFilters;
  onFiltersChange: (filters: LearnerCourseFilters) => void;
  onReset: () => void;
}

const categories = [
  "All Categories",
  "Programming",
  "Design",
  "Business",
  "Marketing",
  "Photography",
  "Music",
  "Fitness",
  "Language",
];

const levels = [
  { value: "all", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const LearnerCourseFiltersComponent = ({
  filters,
  onFiltersChange,
  onReset,
}: LearnerCourseFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 500,
  ]);

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: category === "All Categories" ? undefined : category,
    });
  };

  const handleLevelChange = (level: string) => {
    onFiltersChange({ ...filters, level: level === "all" ? undefined : level });
  };

  const applyPriceFilter = () => {
    onFiltersChange({ ...filters, minPrice: priceRange[0], maxPrice: priceRange[1] });
  };

  const activeFilterCount = [
    filters.category,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.level,
  ].filter(Boolean).length;

  const hasActiveFilters = filters.category || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.level;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                {activeFilterCount}
              </Badge>
            )}
            {isOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
        </CollapsibleTrigger>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.category && (
              <Badge variant="secondary" className="gap-1">
                {filters.category}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryChange("All Categories")} />
              </Badge>
            )}
            {filters.level && (
              <Badge variant="secondary" className="gap-1">
                {levels.find(l => l.value === filters.level)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleLevelChange("all")} />
              </Badge>
            )}
            {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
              <Badge variant="secondary" className="gap-1">
                ${filters.minPrice ?? 0} – ${filters.maxPrice ?? 500}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, minPrice: undefined, maxPrice: undefined })} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground hover:text-foreground h-7 px-2">
              Clear all
            </Button>
          </div>
        )}
      </div>

      <CollapsibleContent className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select value={filters.category || "All Categories"} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Level</Label>
                <Select value={filters.level || "all"} onValueChange={handleLevelChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Price Range</Label>
                <div className="space-y-3">
                  <Slider
                    value={priceRange}
                    onValueChange={(v) => setPriceRange(v as [number, number])}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={applyPriceFilter} className="w-full">
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};