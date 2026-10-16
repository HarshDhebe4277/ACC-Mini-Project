"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, RefreshCw, Search, Filter, Plus, Check } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { AuditLogItem } from "@/types";

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [dbSource, setDbSource] = useState<string>("FastAPI Backend (PostgreSQL)");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAuditLogs = async () => {
    try {
      setErrorMessage(null);
      // Query dedicated FastAPI backend endpoint /api/v1/audit-logs
      const data = await apiFetch<AuditLogItem[]>("/audit-logs");
      if (Array.isArray(data)) {
        setAuditLogs(data);
        setDbSource("FastAPI Backend (PostgreSQL)");
      } else {
        setAuditLogs([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch audit logs from backend:", err);
      setErrorMessage(err?.message || "Failed to reach dedicated FastAPI backend at http://localhost:8000");
      setAuditLogs([]);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadAuditLogs();
      setLoading(false);
    }
    init();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAuditLogs();
    setRefreshing(false);
  };

  // Test creating an immediate live audit record in PostgreSQL through dedicated FastAPI backend
  const handleSimulateLog = async () => {
    try {
      setIsSimulating(true);
      setErrorMessage(null);
      const testActions = [
        {
          action: "EVENT_APPROVED",
          target_resource: "events",
          details: "Published to public campus calendar after venue conflict verification.",
          actor: "Dean Office (admin@ves.ac.in)",
        },
        {
          action: "ATTENDANCE_SCANNED",
          target_resource: "attendance",
          details: "HMAC ticket verified & checked in at Main Auditorium gate.",
          actor: "Gate Scanner (org@ves.ac.in)",
        },
        {
          action: "PROPOSAL_RECOMMENDED",
          target_resource: "events",
          details: "Endorsed technical syllabus alignment for IT department workshop.",
          actor: "Faculty Advisor (sunita.rao@ves.ac.in)",
        },
        {
          action: "ROLE_ELEVATED",
          target_resource: "profiles",
          details: "User role transitioned from STUDENT to ORGANIZER.",
          actor: "Admin (admin@ves.ac.in)",
        },
        {
          action: "AI_DRAFT_GENERATED",
          target_resource: "ai_assistant",
          details: "Mistral Large parsed unstructured prompt into formal college draft.",
          actor: "Organizer (rohan.mehta@ves.ac.in)",
        },
      ];
      const selected = testActions[Math.floor(Math.random() * testActions.length)];
      
      // POST directly to FastAPI backend: /api/v1/audit-logs
      await apiFetch<AuditLogItem>("/audit-logs", {
        method: "POST",
        body: JSON.stringify(selected),
      });

      await loadAuditLogs();
      setSimulatedNotice(`Logged '${selected.action}' into PostgreSQL via dedicated FastAPI backend!`);
      setTimeout(() => setSimulatedNotice(null), 3500);
    } catch (err: any) {
      console.error("Failed to create audit log:", err);
      setErrorMessage(err?.message || "Failed to post audit log to backend");
    } finally {
      setIsSimulating(false);
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "EVENT_APPROVED":
        return "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold";
      case "ATTENDANCE_SCANNED":
        return "border-sky-300 bg-sky-50 text-sky-800 font-semibold";
      case "PROPOSAL_RECOMMENDED":
        return "border-purple-300 bg-purple-50 text-purple-800 font-semibold";
      case "ROLE_ELEVATED":
        return "border-amber-300 bg-amber-50 text-amber-800 font-semibold";
      case "AI_DRAFT_GENERATED":
        return "border-teal-300 bg-teal-50 text-teal-800 font-semibold";
      case "EVENT_REJECTED":
        return "border-rose-300 bg-rose-50 text-rose-800 font-semibold";
      case "EVENT_CREATED":
      case "EVENT_SUBMITTED":
        return "border-indigo-300 bg-indigo-50 text-indigo-800 font-semibold";
      default:
        return "border-slate-300 bg-slate-50 text-slate-800 font-semibold";
    }
  };

  const formatDateTime = (isoString?: string): { time: string; date: string } => {
    if (!isoString) return { time: "--", date: "" };
    try {
      const date = new Date(isoString);
      return {
        time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        date: date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
      };
    } catch {
      return { time: isoString, date: "" };
    }
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Filter by category
      if (selectedFilter !== "ALL") {
        if (selectedFilter === "APPROVALS" && log.action !== "EVENT_APPROVED" && log.action !== "PROPOSAL_RECOMMENDED") {
          return false;
        }
        if (selectedFilter === "ATTENDANCE" && log.action !== "ATTENDANCE_SCANNED") {
          return false;
        }
        if (selectedFilter === "ROLES" && log.action !== "ROLE_ELEVATED") {
          return false;
        }
        if (selectedFilter === "AI" && log.action !== "AI_DRAFT_GENERATED") {
          return false;
        }
        if (selectedFilter === "LIFECYCLE" && log.action !== "EVENT_CREATED" && log.action !== "EVENT_SUBMITTED" && log.action !== "EVENT_REJECTED") {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const detailsText = typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details || "");
        return (
          log.action.toLowerCase().includes(query) ||
          log.actor.toLowerCase().includes(query) ||
          log.target_resource.toLowerCase().includes(query) ||
          detailsText.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [auditLogs, selectedFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateLog}
            disabled={isSimulating}
            className="text-xs flex items-center space-x-1.5 border-dashed border-slate-300 hover:bg-slate-50"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>{isSimulating ? "Saving..." : "Log Test Event"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Stream"}</span>
          </Button>
        </div>
      </div>

      {simulatedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{simulatedNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-xs h-7 text-rose-800 hover:bg-rose-100">
            Retry
          </Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System-Wide Operational Audit Trails</h1>
          <p className="text-sm text-slate-600">
            Immutable audit records of administrative transitions, approvals, security scans, and role changes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
            {filteredLogs.length} Events in DB
          </Badge>
          <span className="text-[11px] text-slate-400">
            Live Stream: {dbSource}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search action, actor, resource, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          {[
            { id: "ALL", label: "All" },
            { id: "APPROVALS", label: "Approvals" },
            { id: "ATTENDANCE", label: "Attendance" },
            { id: "ROLES", label: "Role Elevations" },
            { id: "AI", label: "AI Drafts" },
            { id: "LIFECYCLE", label: "Lifecycle" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md transition-colors shrink-0 font-medium ${
                selectedFilter === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-3.5">
          <div>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Audit Trail Event Stream</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Stored in PostgreSQL `public.audit_logs` with security definer integrity
            </CardDescription>
          </div>
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                      Loading operational audit stream from PostgreSQL...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-sans space-y-2">
                      <p className="font-semibold text-slate-700">No audit events recorded in database yet.</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Events are automatically written to `public.audit_logs` when events are created, approved, scanned, or roles updated.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSimulateLog}
                        className="mt-2 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Log Initial Test Event
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const dt = formatDateTime(log.created_at || log.timestamp);
                    const detailsStr =
                      typeof log.details === "object" && log.details !== null
                        ? (log.details as any).message || JSON.stringify(log.details)
                        : String(log.details || "");

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <Badge variant="outline" className={`text-[10px] font-mono ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={log.actor}>
                          {log.actor}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-sans font-medium">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {log.target_resource}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-sans max-w-md break-words">
                          {detailsStr}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                          <div className="font-semibold text-slate-700">{dt.time}</div>
                          {dt.date && <div className="text-[10px] text-slate-400">{dt.date}</div>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
