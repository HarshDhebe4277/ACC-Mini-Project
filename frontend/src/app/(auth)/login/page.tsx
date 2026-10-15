"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { GraduationCap, Shield, UserCheck, Sparkles, LogIn, UserPlus } from "lucide-react";

type AuthMode = "signin" | "signup";
type UserRoleType = "STUDENT" | "ORGANIZER" | "FACULTY" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("Information Technology");
  const [role, setRole] = useState<UserRoleType>("STUDENT");

  const saveAuthSession = (accessToken: string, userPayload: Record<string, unknown>, roleName: string) => {
    // Set cookies for middleware
    document.cookie = `campus_role=${roleName}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `campus_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;

    // Set localStorage for client-side apiFetch
    localStorage.setItem("campus_token", accessToken);
    localStorage.setItem("campus_user", JSON.stringify(userPayload));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error("Unable to establish authentication session.");
      }

      // Query profiles table for role & department
      let userRole: UserRoleType = "STUDENT";
      let userFullName = data.user.user_metadata?.full_name || email.split("@")[0];
      let userDept = data.user.user_metadata?.department || "General";

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, department")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          userRole = (profile.role as UserRoleType) || userRole;
          userFullName = profile.full_name || userFullName;
          userDept = profile.department || userDept;
        }
      } catch {
        // Fall back to metadata if profiles lookup is restricted by RLS
        userRole = (data.user.user_metadata?.role as UserRoleType) || "STUDENT";
      }

      const sessionPayload = {
        sub: data.user.id,
        email: data.user.email,
        role: userRole,
        user_metadata: {
          full_name: userFullName,
          department: userDept,
          role: userRole,
        },
      };

      saveAuthSession(data.session.access_token, sessionPayload, userRole);
      router.push(`/${userRole.toLowerCase()}/dashboard`);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Sign in failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password || !fullName) {
      setErrorMsg("Please fill in your name, email, and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            department: department.trim(),
            role: role,
          },
        },
      });

      if (error) {
        throw error;
      }

      // If Supabase has email confirmation disabled, session is returned immediately
      if (data.session && data.user) {
        const sessionPayload = {
          sub: data.user.id,
          email: data.user.email,
          role: role,
          user_metadata: {
            full_name: fullName.trim(),
            department: department.trim(),
            role: role,
          },
        };
        saveAuthSession(data.session.access_token, sessionPayload, role);
        router.push(`/${role.toLowerCase()}/dashboard`);
        return;
      }

      // If email confirmation is required by Supabase
      setSuccessMsg(
        "Registration successful! If email confirmation is enabled on your instance, please check your inbox to confirm your email. You can now sign in."
      );
      setMode("signin");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (demoRole: UserRoleType, name: string, dept: string) => {
    const demoPayload = {
      sub: `demo-${demoRole.toLowerCase()}-1`,
      email: `${demoRole.toLowerCase()}@ves.ac.in`,
      role: demoRole,
      user_metadata: { full_name: name, department: dept, role: demoRole },
    };

    saveAuthSession(`demo-token-${demoRole}`, demoPayload, demoRole);
    router.push(`/${demoRole.toLowerCase()}/dashboard`);
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
            Native Supabase Authentication &bull; Email &amp; Password
          </CardDescription>

          <div className="flex justify-center mt-4">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === "signin"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === "signup"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
              {successMsg}
            </div>
          )}

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-semibold flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? "Signing in..." : "Sign In with Email"}</span>
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <Input
                    type="text"
                    placeholder="Information Technology"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Portal Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRoleType)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    disabled={loading}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ORGANIZER">Organizer</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min. 6 characters)
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-semibold flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? "Creating Account..." : "Create Account"}</span>
              </Button>
            </form>
          )}

          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 font-medium">
                Or Quick Test Persona
              </span>
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
          Native Supabase Auth &bull; Role-Based Access Control &bull; RLS Secured
        </CardFooter>
      </Card>
    </div>
  );
}
