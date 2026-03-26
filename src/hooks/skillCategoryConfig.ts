import {Code2, Palette, Briefcase, Megaphone,BarChart2, Globe, Music, Camera, Sparkles,} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ColorKey = "primary" | "secondary" | "info" | "warning" | "success";

interface CategoryConfig {
  icon:  LucideIcon;
  color: ColorKey;
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  PROGRAMMING:  { icon: Code2,      color: "primary"   },
  DESIGN:       { icon: Palette,    color: "secondary" },
  BUSINESS:     { icon: Briefcase,  color: "info"      },
  MARKETING:    { icon: Megaphone,  color: "warning"   },
  DATA_SCIENCE: { icon: BarChart2,  color: "success"   },
  LANGUAGE:     { icon: Globe,      color: "info"      },
  MUSIC:        { icon: Music,      color: "secondary" },
  PHOTOGRAPHY:  { icon: Camera,     color: "primary"   },
  OTHER:        { icon: Sparkles,   color: "warning"   },
};

export const getFallbackConfig = (): CategoryConfig => ({
  icon:  Sparkles,
  color: "primary",
});