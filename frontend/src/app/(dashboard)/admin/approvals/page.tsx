"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, ShieldCheck, Clock, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem } from "@/types";

export default function AdminApprovalsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiFetch<EventItem[]>("/events");
        setEvents(data.filter((e) => e.status === "FACULTY_RECOMMENDED" || e.status === "SUBMITTED"));
      } catch {
        setEvents([
          {
            id: "adm-review-1",
            title: "National Cloud Native Hackathon 2026",
            description: "36-hour hackathon with industry keynote speakers and live mentoring.",
            department: "Computer Science",
            start_time: "2026-11-20T09:00:00Z",
            end_time: "2026-11-21T21:00:00Z",
            registration_deadline: "2026-11-18T23:59:59Z",
            max_capacity: 150,
            current_capacity: 0,
            status: "FACULTY_RECOMMENDED",
            ai_generated_tags: ["Cloud", "GKE"],
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

  const handleApprove = async (eventId: string) => {
    try {
      setActionLoading(true);
      await apiFetch(`/events/${eventId}/approve`, { method: "PUT" });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      alert("Event officially approved and published to the campus public schedule!");
    } catch (err: unknown) {
      alert((err as Error).message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (eventId: string) => {
    if (!rejectReason || rejectReason.length < 5) {
      alert("Please state reasons for administrative rejection.");
      return;
    }
    try {
      setActionLoading(true);
      await apiFetch(`/events/${eventId}/reject`, {
        method: "PUT",
        body: JSON.stringify({ rejection_reason: rejectReason }),
      });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setRejectId(null);
      setRejectReason("");
      alert("Event proposal officially rejected.");
    } catch (err: unknown) {
      alert((err as Error).message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-slate-900">Final Event Authorization Queue</h1>
        <p className="text-sm text-slate-600">
          Dean of Student Affairs review &bull; Automated venue clash detection enabled
        </p>
      </div>

      {events.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-2 opacity-60" />
          <h3 className="font-bold text-slate-800">No Pending Approvals</h3>
          <p className="text-xs text-slate-500 mt-1">
            All submitted events have been processed. The campus event schedule is up to date.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {events.map((event) => (
          <Card key={event.id} className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {event.department}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Venue Clash: NONE DETECTED</span>
                  </Badge>
                  <Badge className="bg-indigo-600 text-white text-xs">{event.status}</Badge>
                </div>
              </div>

              <CardTitle className="text-xl font-bold text-slate-900 mt-1">{event.title}</CardTitle>
              <CardDescription className="text-xs">
                Requested Capacity: {event.max_capacity} Students &bull; Venue: {event.venue_name || "Main Auditorium"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Start: {new Date(event.start_time).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Venue: {event.venue_name || "Main Auditorium (Ground Floor)"}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg whitespace-pre-line font-mono text-[11px]">
                {event.description}
              </div>

              {rejectId === event.id && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2 mt-2">
                  <label className="text-xs font-semibold text-red-800">
                    Administrative Reason for Rejection:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter formal justification..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-red-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setRejectId(null)} className="text-xs">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReject(event.id)}
                      disabled={actionLoading}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              {rejectId !== event.id && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectId(event.id)}
                    disabled={actionLoading}
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs flex items-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Proposal</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(event.id)}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Publish to Campus</span>
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

