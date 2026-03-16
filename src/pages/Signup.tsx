import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

type AppRole = "FORMATEUR" | "APPRENANT";


const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<AppRole>("APPRENANT");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, username, role);

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to SkillPath. Start your learning journey!",
      });
      navigate(role === "FORMATEUR" ? "/trainer" : "/dashboard");
    }

    setIsLoading(false);
  };

  
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
  if (!credentialResponse.credential) {
    toast({
      variant: "destructive",
      title: "Google sign up failed",
      description: "No credential received from Google.",
    });
    return;
  }

  setIsLoading(true);

  try {
    // ✅ TypeScript infère automatiquement le type depuis AuthContext
    const { data, error } = await signInWithGoogle(credentialResponse.credential, role);

    if (error) {
      toast({
        variant: "destructive",
        title: "Google sign up failed",
        description: error.message,
      });
      console.log("isNewUser type:", typeof data.newUser, data.newUser);
    } else if (data) {
      if (data.newUser) {
        toast({
          title: "Account created!",
          description: "Welcome to SkillPath. Check your email for confirmation!",
        });
        navigate("/welcome",{ replace: true });
      } else {
        toast({
          title: "Welcome back!",
          description: `Good to see you again, ${data.user.username}!`,
        });
        navigate(role === "FORMATEUR" ? "/trainer" : "/dashboard");
      }
    }
  } catch (err) {
    toast({
      variant: "destructive",
      title: "An error occurred",
      description: "Please try again later.",
    });
  } finally {
    setIsLoading(false);
  }
};


  const handleGoogleError = () => {
    toast({
      variant: "destructive",
      title: "Google sign up failed",
      description: "Please try again or use email sign up.",
    });
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <span className="text-2xl font-bold text-foreground">SkillPath</span>
          </div>
          <p className="text-muted-foreground">Create your account and start learning today.</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Choose your role and fill in your details
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("APPRENANT")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                      role === "APPRENANT"
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-secondary/50"
                    )}
                  >
                    <GraduationCap className="h-6 w-6" />
                    <span className="font-medium">Learner</span>
                    <span className="text-xs text-center">Learn new skills & track progress</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("FORMATEUR")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                      role === "FORMATEUR"
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-secondary/50"
                    )}
                  >
                    <Users className="h-6 w-6" />
                    <span className="font-medium">Trainer</span>
                    <span className="text-xs text-center">Create courses & mentor learners</span>
                  </button>
                </div>
              </div>

               {/* Google Sign Up Button */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Sign up with 
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="signup_with"
                  width="350"
            
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Username</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-muted/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-hero hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </span>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-secondary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Signup;