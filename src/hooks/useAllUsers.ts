import { useState, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export type AppRole = "trainer" | "learner" | "admin";

export interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  isBanned: boolean;
  banExpiresAt: string | null;
}

interface UserDTO {
  id: number;
  full_name?: string;
  avatar_url?: string;
  role: string;
  isBanned?: boolean;
  banExpiresAt?: string;
}

const API_BASE = "/api/admin/users";

// ✅ Même pattern que useAllCourses
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const roleFromBackend = (role: string): AppRole => {
  switch (role) {
    case "ADMIN":     return "admin";
    case "FORMATEUR": return "trainer";
    case "APPRENANT": return "learner";
    default:          return "learner";
  }
};

const mapDTOToFrontend = (dto: UserDTO): UserWithRole => ({
  id: String(dto.id),
  user_id: String(dto.id),
  full_name: dto.full_name ?? null,
  avatar_url: dto.avatar_url ?? null,
  role: roleFromBackend(dto.role),
  isBanned: dto.isBanned ?? false,
  banExpiresAt: dto.banExpiresAt ?? null,
});

export const useAllUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_BASE, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch users (${response.status})`
        );
      }

      const data: UserDTO[] = await response.json();
      setUsers(data.map(mapDTOToFrontend));
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load users. Please try again.";
      setError(errorMessage);
      console.error("Error fetching users:", err);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ durationDays: undefined = permanent, number = temporaire
  const banUser = useCallback(async (userId: string, durationDays?: number) => {
    const endpoint = `${API_BASE}/${userId}/ban`;
    const body = durationDays ? { durationDays } : {};

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to ban user");
      }

      const banExpiresAt = durationDays
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      setUsers(prev =>
        prev.map(u =>
          u.user_id === userId ? { ...u, isBanned: true, banExpiresAt } : u
        )
      );

      toast({
        title: "User Banned",
        description: durationDays
          ? `User has been banned for ${durationDays} day${durationDays > 1 ? "s" : ""}.`
          : "User has been permanently banned.",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to ban user";
      console.error("Ban user error:", err);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  }, []);

   // ✅ Nouvelle fonction unbanUser
  const unbanUser = useCallback(async (userId: string) => {
    const endpoint = `${API_BASE}/${userId}/unban`;

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to unban user");
      }

      // ✅ Mise à jour optimiste de l'état local
      setUsers(prev =>
        prev.map(u =>
          u.user_id === userId ? { ...u, isBanned: false, banExpiresAt: null } : u
        )
      );

      toast({
        title: "User Unbanned",
        description: "The user's ban has been lifted. They can now access the platform.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unban user";
      console.error("Unban user error:", err);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  }, []);

  const refetch = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, isLoading, error, banUser, unbanUser, refetch };
};