"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem } from "@/types";

export default function OrganizerAnalyticsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
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
            status: "APPROVED",
            ai_generated_tags: ["Cloud"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organizer_id: "org-me",
          },
        ]);
      }
    }
    loadEvents();
  }, []);

  const handleDownloadCsv = async (eventId: string, title: string) => {
    try {
      setDownloadingId(eventId);
      const blob = await apiFetch<Blob>(`/reports/events/${eventId}/attendance/csv`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance_${title.slice(0, 15).replace(/\s+/g, "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Analytics & Reports</h1>
        <p className="text-sm text-slate-600">Inspect attendance rates and export official CSV reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => {
          const attendancePct = event.max_capacity > 0
            ? Math.round((event.current_capacity / event.max_capacity) * 100)
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
                      {event.current_capacity} / {event.max_capacity}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Turnout Ratio</span>
                    <span className="text-2xl font-bold text-purple-700">{attendancePct}%</span>
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

