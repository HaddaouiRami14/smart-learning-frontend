import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Shield } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const API_BASE_URL = "http://localhost:8080/api";

interface Profile {
  id: number;
  username: string;
  email: string;
  role: string;
  provider: string;
  loginHistory: string[]; // simple array of strings
  timezone: string;
}

export const LearnerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable state
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  //const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [timezone, setTimezone] = useState("UTC");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setProfile(data);
      setUsername(data.username);
      setTimezone(data.timezone || "UTC");
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
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username, timezone }),
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
    }
    if (newPassword.length < 6) {
      return toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" });
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/profile/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to change password");
      }
      toast({ title: "Success", description: "Password changed successfully" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return <Badge variant="destructive">Admin</Badge>;
      case "trainer": return <Badge variant="default">Trainer</Badge>;
      case "learner": return <Badge variant="secondary">Learner</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!profile) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Failed to load profile</p></div>;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 bg-background text-foreground transition-colors duration-300">
  <h1 className="text-3xl font-bold mb-2">My Profile</h1>
  <p className="text-muted-foreground mb-6">Manage your account settings</p>

  {/* Header */}
  <Card className="mb-6 bg-card text-card-foreground transition-colors duration-300">
    <CardContent className="pt-6 flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">{profile.username}</h2>
        <p className="text-muted-foreground">{profile.email}</p>
        <div className="flex gap-2 mt-2">
          {getRoleBadge(profile.role)}
          <Badge variant="outline">{profile.provider}</Badge>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={toggleTheme}>
        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </Button>
    </CardContent>
  </Card>

  {/* Tabs */}
  <Tabs defaultValue="profile" className="w-full">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="profile">
        <User className="h-4 w-4 mr-2" />Profile
      </TabsTrigger>
      <TabsTrigger value="password" disabled={profile.provider?.toUpperCase() !== "LOCAL"}>
        <Lock className="h-4 w-4 mr-2" />Password
      </TabsTrigger>
    </TabsList>

    <TabsContent value="profile">
      <Card className="mb-4 bg-card text-card-foreground transition-colors duration-300">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your username, timezone, and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full border rounded px-2 py-1 bg-background text-foreground transition-colors duration-300"
              >
                <option value="UTC">UTC</option>
                <option value="GMT">GMT</option>
                <option value="CET">CET</option>
                <option value="EST">EST</option>
                <option value="PST">PST</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Login History</Label>
              <ul className="list-disc list-inside text-sm text-muted-foreground max-h-32 overflow-y-auto">
                {profile.loginHistory?.map((entry, i) => (
                  <li key={i}>{entry}</li>
                ))}
              </ul>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TabsContent>

    {/* Password Tab */}
    <TabsContent value="password">
      <Card className="bg-card text-card-foreground transition-colors duration-300">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
</div>

  );
};

