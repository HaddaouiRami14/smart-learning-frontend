/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const { oauthLogin } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const userId = params.get("userId");
    const name = params.get("name");
    const email = params.get("email");
    const roleParam = params.get("role");

    if (!token || !userId || !roleParam) {
      navigate("/login", { replace: true });
      return;
    }

    const validRoles = ["ADMIN", "FORMATEUR", "APPRENANT"] as const;
    if (!validRoles.includes(roleParam as any)) {
      navigate("/login", { replace: true });
      return;
    }

    const role = roleParam as "ADMIN" | "FORMATEUR" | "APPRENANT";

    oauthLogin({
      id: Number(userId),
      name: name || "",
      email: email || "",
      role,
      token,
    });

    if (role === "ADMIN") {
      navigate("/admin", { replace: true });
    } else if (role === "FORMATEUR") {
      navigate("/trainer", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, oauthLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Authenticating...</p>
    </div>
  );
};

export default OAuth2Callback;