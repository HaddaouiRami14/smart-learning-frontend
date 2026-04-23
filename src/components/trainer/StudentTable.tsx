import { Users, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStudents } from "@/hooks/useStudents";

export const StudentTable = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { students, isLoading } = useStudents();

  const filteredStudents = students.filter(
    (student) =>
      student.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(student.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading students...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage students enrolled in your courses
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No students yet
            </h3>
            <p className="text-muted-foreground">
              Students will appear here once they enroll in your courses
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Courses Enrolled</TableHead>
                <TableHead>Avg. Progress</TableHead>
                <TableHead>Last Enrollment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {/* FIX: Changed 'avatarurl' to 'avatarUrl' to match Java DTO */}
                        <AvatarImage src={student.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {student.username
                            ? student.username
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {student.username || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {/* FIX: Changed 'enrolledcourses' to 'enrolledCourses' */}
                  <TableCell>{student.enrolledCourses}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        // FIX: Changed 'avgprogress' to 'avgProgress'
                        value={student.avgProgress}
                        className="w-20 h-2"
                      />
                      <span className="text-sm text-muted-foreground">
                        {/* FIX: Changed 'avgprogress' to 'avgProgress' */}
                        {Math.round(student.avgProgress)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {/* 'lastActive' was already correct here */}
                    {new Date(student.lastActive).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};