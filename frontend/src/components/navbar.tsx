"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  LogOut,
  QrCode,
  Sparkles,
  UserCheck,
  Shield,
  Layers,
  FileText,
  Users
} from "lucide-react";
import { clearAuthToken } from "@/lib/api-client";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string>("STUDENT");
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    // Determine active role from pathname or cookies/localStorage
    if (pathname.includes("/admin")) setRole("ADMIN");
    else if (pathname.includes("/faculty")) setRole("FACULTY");
    else if (pathname.includes("/organizer")) setRole("ORGANIZER");
    else if (pathname.includes("/student")) setRole("STUDENT");

    const userRaw = localStorage.getItem("campus_user");
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        setUserName(u.user_metadata?.full_name || u.email?.split("@")[0] || "User");
      } catch {
        // ignore
      }
    }
  }, [pathname]);

  const handleSignOut = () => {
    clearAuthToken();
    document.cookie = "campus_role=; path=/; max-age=0";
    document.cookie = "campus_token=; path=/; max-age=0";
    router.push("/login");
  };

  const getLinks = () => {
    switch (role) {
      case "ADMIN":
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: Shield },
          { href: "/admin/approvals", label: "Approvals", icon: UserCheck },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/venues", label: "Venues", icon: Layers },
          { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
        ];
      case "FACULTY":
        return [
          { href: "/faculty/dashboard", label: "Dashboard", icon: UserCheck },
          { href: "/faculty/approvals", label: "Approvals", icon: Calendar },
          { href: "/faculty/reports", label: "Reports", icon: FileText },
        ];
      case "ORGANIZER":
        return [
          { href: "/organizer/dashboard", label: "Dashboard", icon: Sparkles },
          { href: "/organizer/create-event", label: "Create Event", icon: Calendar },
          { href: "/organizer/scanner", label: "QR Scanner", icon: QrCode },
          { href: "/organizer/analytics", label: "Analytics", icon: Layers },
        ];
      case "STUDENT":
      default:
        return [
          { href: "/student/dashboard", label: "Dashboard", icon: Calendar },
          { href: "/student/events", label: "Browse Events", icon: Layers },
          { href: "/student/my-passes", label: "My Passes", icon: QrCode },
        ];
    }
  };

  const roleColor = {
    STUDENT: "bg-blue-100 text-blue-800 border-blue-200",
    ORGANIZER: "bg-purple-100 text-purple-800 border-purple-200",
    FACULTY: "bg-amber-100 text-amber-800 border-amber-200",
    ADMIN: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }[role] || "bg-gray-100 text-gray-800";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href={`/${role.toLowerCase()}/dashboard`} className="flex items-center space-x-2">
            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              CE
            </div>
            <span className="font-bold text-lg text-slate-900 hidden sm:inline">CampusEvents</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {getLinks().map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 hidden sm:inline font-medium">{userName}</span>
            <Badge variant="outline" className={`text-xs px-2 py-0.5 font-bold ${roleColor}`}>
              {role}
            </Badge>
          </div>

          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900">
              Switch
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center space-x-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

