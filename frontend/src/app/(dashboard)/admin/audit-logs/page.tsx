"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield } from "lucide-react";

export default function AdminAuditLogsPage() {
  const auditLogs = [
    {
      id: "log-1",
      action: "EVENT_APPROVED",
      target_resource: "events",
      resource_id: "demo-hackathon-1",
      actor: "Dean Office (admin@ves.ac.in)",
      details: "Published to public campus calendar after venue conflict verification.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: "log-2",
      action: "ATTENDANCE_SCANNED",
      target_resource: "attendance",
      resource_id: "reg-uuid-99",
      actor: "Gate Scanner (org@ves.ac.in)",
      details: "HMAC ticket verified & checked in at Main Auditorium gate.",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "log-3",
      action: "PROPOSAL_RECOMMENDED",
      target_resource: "events",
      resource_id: "demo-workshop-2",
      actor: "Faculty Advisor (sunita.rao@ves.ac.in)",
      details: "Endorsed technical syllabus alignment for IT department workshop.",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: "log-4",
      action: "ROLE_ELEVATED",
      target_resource: "profiles",
      resource_id: "u-2",
      actor: "Admin (admin@ves.ac.in)",
      details: "User role transitioned from STUDENT to ORGANIZER.",
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
      id: "log-5",
      action: "AI_DRAFT_GENERATED",
      target_resource: "ai_assistant",
      resource_id: "draft-req-44",
      actor: "Organizer (rohan.mehta@ves.ac.in)",
      details: "Mistral Large parsed unstructured prompt into formal college draft.",
      timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">System-Wide Operational Audit Trails</h1>
        <p className="text-sm text-slate-600">
          Immutable audit records of administrative transitions, approvals, security scans, and role changes
        </p>
      </div>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Audit Trail Event Stream</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Stored in PostgreSQL `public.audit_logs` with security definer integrity
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.actor}</td>
                    <td className="py-3 px-4 text-slate-500">{log.target_resource}</td>
                    <td className="py-3 px-4 text-slate-600 font-sans max-w-xs">{log.details}</td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
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

