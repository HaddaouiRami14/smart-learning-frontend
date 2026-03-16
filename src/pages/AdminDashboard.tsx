import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminStats } from "@/components/admin/AdminStats";
import { UserManagement } from "@/components/admin/UserManagement";
import { AdminCourseManagement } from "@/components/admin/AdminCourseManagement";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminSettings } from "@/components/admin/AdminSettings";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Platform Overview</h1>
              <p className="text-muted-foreground">
                Monitor and manage your learning platform
              </p>
            </div>
            <AdminStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdminCourseManagement />
              <UserManagement />
            </div>
          </div>
        );
      case "courses":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Course Management</h1>
              <p className="text-muted-foreground">
                Manage all courses on the platform
              </p>
            </div>
            <AdminCourseManagement />
          </div>
        );
      case "users":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">
                Manage users and their roles
              </p>
            </div>
            <UserManagement />
          </div>
        );
      case "analytics":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Platform Analytics</h1>
              <p className="text-muted-foreground">
                View detailed platform statistics
              </p>
            </div>
            <AdminAnalytics />
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Platform Settings</h1>
              <p className="text-muted-foreground">
                Configure platform settings
              </p>
            </div>
            <AdminSettings />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
    </div>
  );
};

export default AdminDashboard;
