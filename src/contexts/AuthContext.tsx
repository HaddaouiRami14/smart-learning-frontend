import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type AppRole = "ADMIN" | "FORMATEUR" | "APPRENANT";

interface User {
  id?: number;
  email: string;
  username: string;
  name?: string;
  picture?: string;
  provider?: string;
  newUser?: boolean;
  role?: AppRole;
}

interface Session {
  user: User;
  access_token: string;
}

interface SignInResponse {
  data?: {
    token: string;
    user: User;
    newUser: boolean;
  };
  error?: {
    message: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    UserName: string,
    role: AppRole
  ) => Promise<{ error: Error | null }>;
  signIn: (
    username: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: (idToken: string, role: AppRole) => Promise<SignInResponse>;
  signOut: () => Promise<void>;
  oauthLogin: (data: {
    id: number;
    name: string;
    email: string;
    role: AppRole;
    token: string;
  }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// API Base URL
const API_BASE_URL = "http://localhost:8080/api";

// ✅ Vérifie si le token JWT est expiré
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// ✅ Nettoie le localStorage et retourne null
const clearStorage = () => {
  localStorage.clear();
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!stored || !token || isTokenExpired(token)) {
      clearStorage();
      return null; // ✅ Force re-login (local ou Google)
    }
    //return stored ? JSON.parse(stored) : null;
     return JSON.parse(stored);
  });

  const [session, setSession] = useState<Session | null>(() => {
    const stored = localStorage.getItem("session");
    const token = localStorage.getItem("token");

    if (!stored || !token || isTokenExpired(token)) return null;

    return JSON.parse(stored);
  });

  const [role, setRole] = useState<AppRole | null>(() => {
    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) return null;
    const stored = localStorage.getItem("role");
    return stored ? (stored as AppRole) : null;
  });

  const [loading] = useState(false);

  // ✅ Pendant la session : vérifie le token à chaque changement d'état
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (user && token && isTokenExpired(token)) {
      clearStorage();
      setUser(null);
      setSession(null);
      setRole(null);
      window.location.href = "/login"; // ✅ Redirige vers login (local ou Google)
    }
  }, [user]);

  const signUp = useCallback(
  async (email: string, password: string, username: string, role: AppRole) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, role }),
      });

      const data = await response.json();

      // Vérifie si la réponse du serveur est OK
      if (!response.ok) {
        return { error: new Error(data.message || "Signup failed") };
      }

      // Si tout s'est bien passé, on peut créer l'utilisateur et la session
      const userData: User = {
        id: data.user.id,
        username: data.user.username || username,
        name: data.user.username || username,
        email: data.user.email,
        role: data.user.role as AppRole,
      };

      const sessionData: Session = {
        user: userData,
        access_token: data.token,
      };

      setUser(userData);
      setSession(sessionData);
      setRole(userData.role);

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("session", JSON.stringify(sessionData));
      localStorage.setItem("role", userData.role);
      localStorage.setItem("token", data.token);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },
  []
);


  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // Check if token exists (successful login)
      if (!data.token) {
        return { error: new Error(data.message || "Invalid username or password") };
      }

      const userData: User = {
        id: data.user.id,
        username: data.user.name,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as AppRole,
      };

      const sessionData: Session = {
        user: userData,
        access_token: data.token,
      };

      setUser(userData);
      setSession(sessionData);
      setRole(userData.role);

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("session", JSON.stringify(sessionData));
      localStorage.setItem("role", userData.role);
      localStorage.setItem("token", data.token);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string, role: AppRole): Promise<SignInResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, role }),
      });

      const data = await response.json();

      // ✅ Gérer le cas ban (403) spécifiquement
      if (response.status === 403) {
        return {
          error: {
            message: data.error || "Your account has been banned"
          }
        };
      }

      if (!response.ok || !data.token) {
        return {
          error: {
            message: data.message || "Google authentication failed"
          }
        };
      }

      const userData: User = {
        id: data.user.id,
        username: data.user.username,
        name: data.user.username,
        email: data.user.email,
        role: data.user.role as AppRole,
        picture: data.user.picture,
        provider: data.user.provider,
        newUser: data.newUser,
      };

      const sessionData: Session = {
        user: userData,
        access_token: data.token,
      };

      setUser(userData);
      setSession(sessionData);
      setRole(userData.role);

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("session", JSON.stringify(sessionData));
      localStorage.setItem("role", userData.role);
      localStorage.setItem("token", data.token);

      return {
        data: {
          token: data.token,
          user: userData,
          newUser: data.newUser,
        }
      };
    } catch (error) {
      return {
        error: {
          message: (error as Error).message || "An error occurred"
        }
      };
    }
  }, []);

  const oauthLogin = useCallback(
    (data: {
      id: number;
      name: string;
      email: string;
      role: AppRole;
      token: string;
    }) => {
      const userData: User = {
        id: data.id,
        name: data.name,
        username: data.name,
        email: data.email,
        role: data.role,
      };

      const sessionData: Session = {
        user: userData,
        access_token: data.token,
      };

      setUser(userData);
      setSession(sessionData);
      setRole(data.role);

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("session", JSON.stringify(sessionData));
      localStorage.setItem("role", data.role);
      localStorage.setItem("token", data.token);
    },
    []
  );

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setRole(null);
    localStorage.clear();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        oauthLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};