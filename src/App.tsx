import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TrainerDashboard from "./pages/TrainerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import WelcomePage from "./pages/WelcomePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OAuth2Callback from "./pages/OAuth2Callback";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LearnerProfile } from "./pages/LearnerProfile";
import ChapterEditor from "./components/trainer/ChapterEditor";
import CourseDetail from "./components/trainer/CourseDetail";
import ChapterDetail from "./components/trainer/ChapterDetail";
import { TrainerProfile } from "./components/trainer/TrainerProfile";
import Courses from "./pages/Courses";
import CoursePreview from "./pages/CoursePreview";
import LearnerCoursePreview from "./pages/LearnerCoursePreview";


const queryClient = new QueryClient();

//const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_ID = "944764206669-28i71a3c3dpd58eqo1nidlffjriv5cc9.apps.googleusercontent.com";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="en">
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<LearnerProfile />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/oauth2/callback" element={<OAuth2Callback />} />
                          {/* NOUVELLES ROUTES */}
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/preview" element={<CoursePreview />} /> {/* ✅ ADDED */}
              <Route path="/courses/:courseId/learnerpreview" element={<LearnerCoursePreview />} /> {/* ✅ ADDED */}

              <Route path='/courses/:courseId/chapters/:chapterId' element={<ChapterDetail/>} />
              <Route path="/courses/:courseId/chapters/new" element={<ChapterEditor />} />
              <Route path="/courses/:courseId/chapters/:chapterId/edit" element={<ChapterEditor />} />
              <Route path="/trainer/profile" element={<TrainerProfile />} />
              <Route path="/courses" element={<Courses />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["APPRENANT"]}>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trainer"
                element={
                  <ProtectedRoute allowedRoles={["FORMATEUR"]}>
                    <TrainerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/welcome" element={<WelcomePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
