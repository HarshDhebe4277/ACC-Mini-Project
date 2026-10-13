"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check } from "lucide-react";
import { UserRole } from "@/types";

interface DemoUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DemoUser[]>([
    {
      id: "u-1",
      name: "Aarav Sharma",
      email: "aarav.sharma@ves.ac.in",
      department: "Information Technology",
      role: "STUDENT",
      isActive: true,
    },
    {
      id: "u-2",
      name: "Rohan Mehta",
      email: "rohan.mehta@ves.ac.in",
      department: "Computer Science",
      role: "ORGANIZER",
      isActive: true,
    },
    {
      id: "u-3",
      name: "Dr. Sunita Rao",
      email: "sunita.rao@ves.ac.in",
      department: "Computer Science",
      role: "FACULTY",
      isActive: true,
    },
    {
      id: "u-4",
      name: "Prof. K. N. Iyer",
      email: "kn.iyer@ves.ac.in",
      department: "Dean Office",
      role: "ADMIN",
      isActive: true,
    },
    {
      id: "u-5",
      name: "Sneha Patil",
      email: "sneha.patil@ves.ac.in",
      department: "Electronics & Telecommunication",
      role: "STUDENT",
      isActive: true,
    },
  ]);

  const [savedUser, setSavedUser] = useState<string | null>(null);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setSavedUser(userId);
    setTimeout(() => setSavedUser(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Role-Based Access Control (RBAC)</h1>
        <p className="text-sm text-slate-600">
          Modify permissions across Student, Organizer, Faculty, and Admin personas in Supabase
        </p>
      </div>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-base font-bold">Registered Campus Profiles</CardTitle>
          <CardDescription className="text-xs">
            Role elevations instantly affect policy enforcement in FastAPI middleware and Supabase RLS
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Assign Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-400">{user.email}</div>
                    </td>
                    <td className="py-3 px-4">{user.department}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`font-bold ${
                          user.role === "ADMIN"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : user.role === "FACULTY"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : user.role === "ORGANIZER"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="h-8 px-2 rounded border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="ORGANIZER">ORGANIZER</option>
                        <option value="FACULTY">FACULTY</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      {savedUser === user.id && (
                        <span className="ml-2 inline-flex items-center text-emerald-600 font-semibold text-[11px]">
                          <Check className="w-3.5 h-3.5 mr-0.5" /> Updated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        ACTIVE
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

