import { useState } from "react";
import { useAllUsers, AppRole } from "@/hooks/useAllUsers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Shield, GraduationCap, BookOpen, Ban, Clock, ShieldCheck } from "lucide-react";

// ✅ Options de durée de ban
const BAN_DURATIONS = [
  { label: "1 day", value: 1 },
  { label: "3 days", value: 3 },
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "Permanent", value: undefined },
] as const;

export const UserManagement = () => {
  const { users, isLoading, banUser, unbanUser } = useAllUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  // ✅ Durée sélectionnée par user (keyed by user_id)
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number | undefined>>({});

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" /> Admin
          </Badge>
        );
      case "trainer":
        return (
          <Badge variant="default" className="gap-1">
            <BookOpen className="h-3 w-3" /> Trainer
          </Badge>
        );
      case "learner":
        return (
          <Badge variant="secondary" className="gap-1">
            <GraduationCap className="h-3 w-3" /> Learner
          </Badge>
        );
    }
  };

  // ✅ Badge de statut avec date d'expiration si ban temporaire
  const getBanBadge = (isBanned: boolean, banExpiresAt: string | null) => {
    if (!isBanned) {
      return (
        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
          Active
        </Badge>
      );
    }
    if (banExpiresAt) {
      const expiryDate = new Date(banExpiresAt).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      });
      return (
        <Badge variant="destructive" className="gap-1 whitespace-nowrap">
          <Clock className="h-3 w-3" />
          Banned until {expiryDate}
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <Ban className="h-3 w-3" /> Permanently Banned
      </Badge>
    );
  };

  const getDurationForUser = (userId: string): number | undefined =>
    userId in selectedDurations ? selectedDurations[userId] : undefined;

  const handleDurationChange = (userId: string, value: string) => {
    setSelectedDurations(prev => ({
      ...prev,
      [userId]: value === "permanent" ? undefined : Number(value),
    }));
  };

  const handleBanUser = (userId: string) => {
    const duration = getDurationForUser(userId);
    banUser(userId, duration);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="trainer">Trainer</SelectItem>
              <SelectItem value="learner">Learner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-muted-foreground">No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={user.isBanned ? "opacity-60 bg-muted/40" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || "Unknown User"}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.user_id ? user.user_id.slice(0, 8) + "..." : "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{getRoleBadge(user.role)}</TableCell>

                    {/* ✅ Status avec expiration */}
                    <TableCell>{getBanBadge(user.isBanned, user.banExpiresAt)}</TableCell>

                    {/* Actions */}
                    <TableCell>
                      {user.role === "admin" ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Protected
                        </Badge>
                      ) : user.isBanned ? (
                          // ✅ Bouton Unban avec confirmation
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                              <ShieldCheck className="h-4 w-4" />
                              Unban User
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Unban User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to lift the ban on{" "}
                                <strong>{user.full_name || "this user"}</strong>?
                                They will regain full access to the platform immediately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => unbanUser(user.user_id)}
                                className="bg-green-600 text-white hover:bg-green-700"
                              >
                                Confirm Unban
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2">
                              <Ban className="h-4 w-4" />
                              Ban User
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ban User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Select a duration and ban{" "}
                                <strong>{user.full_name || "this user"}</strong>.
                                They will be prevented from accessing the platform.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            {/* ✅ Sélecteur de durée dans la modale */}
                            <div className="py-2 space-y-2">
                              <Label htmlFor={`duration-${user.user_id}`}>
                                Ban Duration
                              </Label>
                              <Select
                                defaultValue="permanent"
                                onValueChange={(val) =>
                                  handleDurationChange(user.user_id, val)
                                }
                              >
                                <SelectTrigger id={`duration-${user.user_id}`}>
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                  {BAN_DURATIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.label}
                                      value={opt.value !== undefined ? String(opt.value) : "permanent"}
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* ✅ Aperçu de la date d'expiration */}
                              {getDurationForUser(user.user_id) !== undefined ? (
                                <p className="text-xs text-muted-foreground">
                                  Will be unbanned on:{" "}
                                  <strong>
                                    {new Date(
                                      Date.now() +
                                        (getDurationForUser(user.user_id) as number) *
                                          24 * 60 * 60 * 1000
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit", month: "long", year: "numeric",
                                    })}
                                  </strong>
                                </p>
                              ) : (
                                <p className="text-xs text-destructive font-medium">
                                  ⚠ This ban will be permanent and cannot be undone.
                                </p>
                              )}
                            </div>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleBanUser(user.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Confirm Ban
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Total: {filteredUsers.length} user{filteredUsers.length !== 1 && "s"}
        </p>
      </CardContent>
    </Card>
  );
};