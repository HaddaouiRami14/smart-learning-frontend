import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./index.css";
import React from "react";
import { AuthProvider } from "./contexts/AuthContext.tsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const savedTheme = localStorage.getItem("theme") ?? "light";
document.documentElement.classList.add(savedTheme);

createRoot(document.getElementById("root")!).render(

<React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>

);
