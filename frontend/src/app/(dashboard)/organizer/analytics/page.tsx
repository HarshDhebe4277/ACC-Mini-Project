"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem } from "@/types";

export default function OrganizerAnalyticsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    try {
      setRefreshing(true);
      const data = await apiFetch<EventItem[]>("/events");
      setEvents(data);
    } catch {
      // Fallback demo
      setEvents([
        {
          id: "org-event-demo-1",
          title: "National Cloud Native Hackathon 2026",
          description: "Annual hackathon",
          department: "Computer Science",
          start_time: "2026-11-20T09:00:00Z",
          end_time: "2026-11-21T21:00:00Z",
          registration_deadline: "2026-11-18T23:59:59Z",
          max_capacity: 100,
          current_capacity: 88,
          total_attended: 88,
          turnout_rate: 100,
          status: "APPROVED",
          ai_generated_tags: ["Cloud"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organizer_id: "org-me",
        },
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDownloadCsv = async (eventId: string, title: string) => {
    try {
      setDownloadingId(eventId);
      const blob = await apiFetch<Blob>(`/reports/events/${eventId}/attendance/csv`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanTitle = title.slice(0, 20).replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `Attendance_${cleanTitle}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      alert((err as Error).message || "CSV export failed");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/organizer/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <Button
          onClick={loadEvents}
          disabled={refreshing}
          variant="ghost"
          size="sm"
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Refreshing..." : "Refresh Stats"}</span>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Analytics & Reports</h1>
        <p className="text-sm text-slate-600">Inspect real-time attendance rates and export official CSV reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => {
          const registeredCount = event.current_capacity || 0;
          const attendedCount = event.total_attended || 0;
          const turnoutPct = event.turnout_rate !== undefined
            ? Math.round(event.turnout_rate)
            : registeredCount > 0
            ? Math.round((attendedCount / registeredCount) * 100)
            : 0;

          return (
            <Card key={event.id} className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {event.department}
                  </Badge>
                  <span className="text-xs text-slate-500">Status: {event.status}</span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">{event.title}</CardTitle>
                <CardDescription className="text-xs">
                  Event Window: {new Date(event.start_time).toLocaleDateString()}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Registration Volume</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {registeredCount} / {event.max_capacity}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {Math.max(event.max_capacity - registeredCount, 0)} spots remaining
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Turnout Ratio</span>
                    <span className="text-2xl font-bold text-purple-700">{turnoutPct}%</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {attendedCount} / {registeredCount} checked in
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleDownloadCsv(event.id, event.title)}
                  disabled={downloadingId === event.id}
                  variant="outline"
                  className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 text-xs flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingId === event.id ? "Exporting..." : "Download Attendance CSV"}</span>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

