import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Lock } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const API_BASE_URL = "http://localhost:8080/api/formateur/profile";

interface TrainerProfile {
  id: number;
  username: string;
  email: string;
  picture: string;
  bio: string;
  specialization: string;
  provider: string;
}

export const TrainerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<TrainerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [bio, setBio] = useState("");
  const [specialization, setSpecialization] = useState("");

  // --- Password state ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setProfile(data);
      setBio(data.bio || "");
      setSpecialization(data.specialization || "");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load profile" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bio, specialization }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setProfile(updated);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Password change handler ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error("Failed to change password");
      toast({ title: "Success", description: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to change password" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-primary" />
      </div>
    );

  if (!profile)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6 bg-card shadow-md rounded-xl p-6">
        <div className="flex items-center gap-6">
          <img
            src={profile.picture || "/default-avatar.png"}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover border-2 border-primary"
          />
          <div>
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
            <div className="mt-2">
              <Badge variant="secondary">Trainer</Badge>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
        <Button
          variant="outline"
          onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </Button>
        </div>
      </div>

      {/* Profile Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="password" disabled={profile.provider !== "LOCAL"}>
            <Lock className="h-4 w-4 mr-2" /> Change Password
          </TabsTrigger>
        </TabsList>

        {/* Profile Info */}
        <TabsContent value="profile">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Profile Info Card */}
            <Card className="bg-card shadow-lg rounded-xl p-4">
              <CardHeader>
                <CardTitle className="text-xl">Your Information</CardTitle>
                <CardDescription>View your bio and specialization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Bio</h3>
                  <p className="text-base">{profile.bio || "No bio set yet."}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Specialization</h3>
                  <p className="text-base">{profile.specialization || "No specialization set yet."}</p>
                </div>
              </CardContent>
            </Card>

            {/* Edit Info Card */}
            <Card className="bg-card shadow-lg rounded-xl p-4">
              <CardHeader>
                <CardTitle className="text-xl">Edit Profile</CardTitle>
                <CardDescription>Update your bio and specialization</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write a short bio..."
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="E.g., Web Development, Design..."
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSaving} className="w-full mt-2">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Change Password Tab */}
        <TabsContent value="password">
          <Card className="bg-card shadow-lg rounded-xl p-4">
            <CardHeader>
              <CardTitle className="text-xl">Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={isChangingPassword} className="w-full mt-2">
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};