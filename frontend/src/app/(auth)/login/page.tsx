"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { GraduationCap, Shield, UserCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Google sign-in failed");
      setLoading(false);
    }
  };

  const setDemoRole = (role: "STUDENT" | "ORGANIZER" | "FACULTY" | "ADMIN", name: string, dept: string) => {
    // Generate a valid base64 token representation for client-side routing & testing
    const demoPayload = {
      sub: `demo-${role.toLowerCase()}-1`,
      email: `${role.toLowerCase()}@ves.ac.in`,
      role,
      user_metadata: { full_name: name, department: dept }
    };
    
    // Set cookies for middleware
    document.cookie = `campus_role=${role}; path=/; max-age=86400`;
    document.cookie = `campus_token=demo-token-${role}; path=/; max-age=86400`;

    // Set localStorage for api-client
    localStorage.setItem("campus_token", `demo-token-${role}`);
    localStorage.setItem("campus_user", JSON.stringify(demoPayload));

    router.push(`/${role.toLowerCase()}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg shadow-lg border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-2">
            CE
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">CampusEvents Portal</CardTitle>
          <CardDescription>
            Authenticate with Google OAuth 2.0 or select a verified test persona
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {errorMsg}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 flex items-center justify-center space-x-2 border-slate-300 hover:bg-slate-100 font-medium"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.64-5.2 3.64-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.09-6.68-4.91H1.21v3.15C3.26 21.46 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.56H1.21C.44 8.11 0 9.99 0 12s.44 3.89 1.21 5.44l4.11-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.54 1.21 6.56l4.11 3.15c.94-2.82 3.58-4.96 6.68-4.96z"
              />
            </svg>
            <span>Sign in with Google</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or Demo Quick Persona Access</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-auto p-3 flex flex-col items-start text-left border-blue-200 bg-blue-50/50 hover:bg-blue-100/60"
              onClick={() => setDemoRole("STUDENT", "Aarav Sharma", "Information Technology")}
            >
              <div className="flex items-center space-x-2 text-blue-700 font-semibold mb-1">
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </div>
              <span className="text-xs text-slate-500">Aarav Sharma (IT Dept)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-auto p-3 flex flex-col items-start text-left border-purple-200 bg-purple-50/50 hover:bg-purple-100/60"
              onClick={() => setDemoRole("ORGANIZER", "Rohan Mehta", "Computer Science")}
            >
              <div className="flex items-center space-x-2 text-purple-700 font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Organizer</span>
              </div>
              <span className="text-xs text-slate-500">Rohan Mehta (AI Lead)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-auto p-3 flex flex-col items-start text-left border-amber-200 bg-amber-50/50 hover:bg-amber-100/60"
              onClick={() => setDemoRole("FACULTY", "Dr. Sunita Rao", "Computer Science")}
            >
              <div className="flex items-center space-x-2 text-amber-700 font-semibold mb-1">
                <UserCheck className="w-4 h-4" />
                <span>Faculty</span>
              </div>
              <span className="text-xs text-slate-500">Dr. Sunita Rao (Advisor)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-auto p-3 flex flex-col items-start text-left border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60"
              onClick={() => setDemoRole("ADMIN", "Prof. K. N. Iyer", "Central Admin")}
            >
              <div className="flex items-center space-x-2 text-emerald-700 font-semibold mb-1">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </div>
              <span className="text-xs text-slate-500">Dean of Student Affairs</span>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 pt-4 text-xs text-slate-400">
          Role-Based Access Control Protected &bull; Supabase RLS Secured
        </CardFooter>
      </Card>
    </div>
  );
}

