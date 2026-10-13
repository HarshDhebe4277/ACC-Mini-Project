"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Layers, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem } from "@/types";

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiFetch<EventItem[]>("/events");
        setEvents(data);
      } catch {
        setEvents([
          {
            id: "adm-ev-1",
            title: "National Cloud Native Hackathon 2026",
            description: "36-hr hackathon",
            department: "Computer Science",
            start_time: "2026-11-20T09:00:00Z",
            end_time: "2026-11-21T21:00:00Z",
            registration_deadline: "2026-11-18T23:59:59Z",
            max_capacity: 150,
            current_capacity: 88,
            status: "FACULTY_RECOMMENDED",
            ai_generated_tags: ["Cloud"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organizer_id: "org-1",
            venue_name: "Main Auditorium",
          },
        ]);
      }
    }
    loadData();
  }, []);

  const pendingFinalApproval = events.filter(
    (e) => e.status === "FACULTY_RECOMMENDED" || e.status === "SUBMITTED"
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Badge variant="outline" className="text-white border-white/30 mb-2">
            Administrator Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Campus Operations & Governance</h1>
          <p className="mt-1 text-sm text-emerald-100 max-w-xl">
            Dean of Student Affairs control center: Resolve venue conflicts, authorize final event publications, manage RBAC privileges, and audit logs.
          </p>
        </div>
        <div className="flex space-x-3 shrink-0">
          <Link href="/admin/approvals">
            <Button className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Final Approvals ({pendingFinalApproval.length})</span>
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 flex items-center space-x-1.5">
              <Users className="w-4 h-4" />
              <span>User RBAC</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* System KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-600">Pending Authorization</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{pendingFinalApproval.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Faculty recommended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-600">Approved Events</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {events.filter((e) => e.status === "APPROVED").length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Live on schedule</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-600">Active Venues</CardTitle>
            <Layers className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">6</div>
            <p className="text-[11px] text-slate-500 mt-1">Auditoriums & Labs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-600">Cluster Status</CardTitle>
            <Shield className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">Healthy (GKE)</div>
            <p className="text-[11px] text-slate-500 mt-1">2 Pods Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Modules Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Event Final Approval Queue</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Review proposals with venue clash prevention before publishing to campus calendar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/approvals">
              <Button size="sm" variant="outline" className="w-full text-xs">
                Open Approval Modal
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>User & Role Governance</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Manage student, organizer, faculty, and administrator RBAC roles and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button size="sm" variant="outline" className="w-full text-xs">
                Manage User Roles
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <FileText className="w-5 h-5 text-slate-600" />
              <span>System Audit Logs</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Trace state changes, ticket issuance, role escalations, and security logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/audit-logs">
              <Button size="sm" variant="outline" className="w-full text-xs">
                Inspect Audit Logs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

