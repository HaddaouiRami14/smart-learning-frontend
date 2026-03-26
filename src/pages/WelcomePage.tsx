import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";

export default function WelcomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role?.toLowerCase();

  useEffect(() => {
    if (!user.email) {
      navigate("/signup");
    }
  }, [user.email, navigate]);

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">
            🎉 Welcome to SkillPath, {user.username}!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Your account has been successfully created
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Confirmation Section */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
            <div className="flex items-start gap-3">
              <Mail className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Confirmation Email Sent
                </h3>
                <p className="text-sm text-gray-600">
                  A welcome email has been sent to:
                </p>
                <p className="text-sm font-medium text-blue-700 mt-1">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 mb-3">
              Your Account Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="font-medium text-gray-800">{user.username}</p>
              </div>
              <div>
                <span className="text-gray-500">Role:</span>
                <p className="font-medium text-gray-800 capitalize">
                  {role}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Email:</span>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Next Steps:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Complete your profile to personalize your experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>
                  {role === "trainer" 
                    ? "Start creating your first course" 
                    : "Browse available courses and start learning"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Connect with the community</span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </div>
  );
}