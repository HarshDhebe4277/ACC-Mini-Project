"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Clock, MapPin, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem } from "@/types";
import ReactMarkdown from "react-markdown";

export default function FacultyApprovalsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiFetch<EventItem[]>("/events");
        setEvents(data.filter((e) => e.status === "SUBMITTED"));
      } catch {
        setEvents([
          {
            id: "fac-review-demo-1",
            title: "Robotics & IoT Embedded Systems Expo",
            description: "Hardware showcase featuring autonomous line-follower robots and ESP32 IoT sensors.",
            department: "Computer Science",
            start_time: "2026-11-28T09:00:00Z",
            end_time: "2026-11-28T17:00:00Z",
            registration_deadline: "2026-11-27T23:59:59Z",
            max_capacity: 100,
            current_capacity: 0,
            status: "SUBMITTED",
            ai_generated_tags: ["Robotics", "IoT"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organizer_id: "org-1",
            venue_name: "Seminar Hall 1",
          },
        ]);
      }
    }
    loadData();
  }, []);

  const handleRecommend = async (eventId: string) => {
    try {
      setActionLoading(true);
      await apiFetch(`/events/${eventId}/recommend`, { method: "PUT" });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      alert("Proposal recommended! Forwarded to Dean Administrator for final scheduling.");
    } catch (err: unknown) {
      alert((err as Error).message || "Recommendation action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (eventId: string) => {
    if (!rejectReason || rejectReason.length < 5) {
      alert("Please enter a clear reason for rejecting or requesting changes.");
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
      alert("Event proposal returned to organizer with change requests.");
    } catch (err: unknown) {
      alert((err as Error).message || "Rejection action failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/faculty/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Department Review Queue</h1>
        <p className="text-sm text-slate-600">
          Scrutinize student event submissions, verify syllabus alignment, and endorse for dean approval
        </p>
      </div>

      {events.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-50" />
          <h3 className="font-bold text-slate-800">Queue is Clear</h3>
          <p className="text-xs text-slate-500 mt-1">
            No student event proposals currently pending faculty review for your department.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {event.department}
                </Badge>
                <Badge className="bg-amber-500 text-white text-xs">
                  Awaiting Faculty Review
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 mt-1">{event.title}</CardTitle>
              <CardDescription className="text-xs">
                Proposed by Student Organizer &bull; Expected Attendees: {event.max_capacity}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Start: {new Date(event.start_time).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Venue: {event.venue_name || "Seminar Hall 1"}</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs space-y-2">
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => <h1 className="text-base font-bold text-slate-900 mt-2 mb-1" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-sm font-bold text-slate-900 mt-2 mb-1 border-b border-slate-200 pb-1" {...props} />,
                    h3: ({ ...props }) => <h3 className="text-xs font-semibold text-slate-800 mt-1.5 mb-1" {...props} />,
                    p: ({ ...props }) => <p className="text-xs text-slate-700 mb-2 leading-relaxed" {...props} />,
                    ul: ({ ...props }) => <ul className="list-disc list-inside text-xs text-slate-700 mb-2 space-y-1" {...props} />,
                    ol: ({ ...props }) => <ol className="list-decimal list-inside text-xs text-slate-700 mb-2 space-y-1" {...props} />,
                    li: ({ ...props }) => <li className="text-xs text-slate-700" {...props} />,
                    strong: ({ ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                    blockquote: ({ ...props }) => <blockquote className="border-l-4 border-amber-400 pl-3 italic text-xs text-slate-600 my-2 bg-amber-50/50 py-1" {...props} />,
                    code: ({ ...props }) => <code className="bg-slate-100 text-purple-800 px-1 py-0.5 rounded text-[11px] font-mono" {...props} />,
                  }}
                >
                  {event.description}
                </ReactMarkdown>
              </div>

              {rejectId === event.id && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2 mt-2">
                  <label className="text-xs font-semibold text-red-800">
                    Specify Required Changes or Rejection Reason:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="E.g., Event overlaps with mid-term examinations; reschedule to post-exam week."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-red-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectId(null)}
                      className="text-xs"
                    >
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
                    <span>Request Changes / Reject</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRecommend(event.id)}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Recommend Approval</span>
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

