import { useState } from "react";

export interface StudentWithProgress {
  id: string;
  learner_id: string;
  full_name: string | null;
  avatar_url: string | null;
  enrolled_courses: number;
  avg_progress: number;
  last_active: string;
}

// Mock data
const mockStudents: StudentWithProgress[] = [
  {
    id: "1",
    learner_id: "3",
    full_name: "Jane Learner",
    avatar_url: null,
    enrolled_courses: 3,
    avg_progress: 62,
    last_active: "2024-01-20T10:00:00Z",
  },
  {
    id: "2",
    learner_id: "4",
    full_name: "Bob Smith",
    avatar_url: null,
    enrolled_courses: 2,
    avg_progress: 45,
    last_active: "2024-01-19T14:30:00Z",
  },
  {
    id: "3",
    learner_id: "5",
    full_name: "Alice Johnson",
    avatar_url: null,
    enrolled_courses: 4,
    avg_progress: 78,
    last_active: "2024-01-20T09:15:00Z",
  },
  {
    id: "4",
    learner_id: "6",
    full_name: "Charlie Brown",
    avatar_url: null,
    enrolled_courses: 1,
    avg_progress: 25,
    last_active: "2024-01-18T16:45:00Z",
  },
];

export const useStudents = () => {
  const [students] = useState<StudentWithProgress[]>(mockStudents);
  const [isLoading] = useState(false);

  return {
    students,
    isLoading,
  };
};
