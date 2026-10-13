"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Calendar, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem } from "@/types";

export default function FacultyDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiFetch<EventItem[]>("/events");
        setEvents(data);
      } catch {
        setEvents([
          {
            id: "fac-event-1",
            title: "Cloud Architecture Symposium 2026",
            description: "Faculty approved technical symposium.",
            department: "Computer Science",
            start_time: "2026-11-28T09:00:00Z",
            end_time: "2026-11-28T17:00:00Z",
            registration_deadline: "2026-11-27T23:59:59Z",
            max_capacity: 120,
            current_capacity: 50,
            status: "SUBMITTED",
            ai_generated_tags: ["Cloud", "GKE"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organizer_id: "org-1",
          },
        ]);
      }
    }
    loadData();
  }, []);

  const pendingApprovals = events.filter((e) => e.status === "SUBMITTED");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Badge variant="outline" className="text-white border-white/30 mb-2">
            Faculty Advisor Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Departmental Review & Oversight</h1>
          <p className="mt-1 text-sm text-amber-100 max-w-xl">
            Review student proposal submissions, recommend verified events for dean approval, and audit departmental participation metrics.
          </p>
        </div>
        <div className="flex space-x-3 shrink-0">
          <Link href="/faculty/approvals">
            <Button className="bg-white text-amber-800 hover:bg-amber-50 font-semibold flex items-center space-x-1.5">
              <Calendar className="w-4 h-4" />
              <span>Pending Reviews ({pendingApprovals.length})</span>
            </Button>
          </Link>
          <Link href="/faculty/reports">
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 flex items-center space-x-1.5">
              <FileText className="w-4 h-4" />
              <span>Department Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Recommendation</CardTitle>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{pendingApprovals.length}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting advisor verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Recommended for Dean</CardTitle>
            <UserCheck className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {events.filter((e) => e.status === "FACULTY_RECOMMENDED").length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Transferred to Dean of Student Affairs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Officially Approved</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {events.filter((e) => e.status === "APPROVED").length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active on campus schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Link to Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Action Items</CardTitle>
          <CardDescription>Direct shortcuts to pending tasks for your department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <span className="font-semibold text-sm text-slate-800 block">Department Proposal Queue</span>
              <span className="text-xs text-slate-500">
                {pendingApprovals.length} proposal(s) require your review
              </span>
            </div>
            <Link href="/faculty/approvals">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                Open Queue
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

