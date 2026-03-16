import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("ADMIN" | "FORMATEUR" | "APPRENANT")[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  // Loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-hero flex items-center justify-center animate-pulse">
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Non connecté → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Connecté mais rôle non autorisé → login (ou page unauthorized)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
    // optionnel : "/unauthorized"
  }

  // Autorisé
  return <>{children}</>;
};
