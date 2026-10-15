"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, QrCode, BarChart3, Clock, CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem } from "@/types";

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiFetch<EventItem[]>("/events");
        setEvents(data);
      } catch {
        setEvents([
          {
            id: "org-event-demo-1",
            title: "AI Hackathon: Cloud & Vision 2026",
            description: "36-hour collegiate innovation sprint with Mistral AI integration.",
            department: "Computer Science",
            start_time: "2026-11-20T09:00:00Z",
            end_time: "2026-11-21T21:00:00Z",
            registration_deadline: "2026-11-18T23:59:59Z",
            max_capacity: 100,
            current_capacity: 45,
            status: "DRAFT",
            ai_generated_tags: ["AI", "Hackathon"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organizer_id: "org-me",
          },
        ]);
      }
    }
    loadData();
  }, []);

  const handleSubmitEvent = async (eventId: string) => {
    try {
      await apiFetch(`/events/${eventId}/submit`, { method: "PUT" });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "SUBMITTED" } : e))
      );
      alert("Event successfully submitted for Faculty & Admin approval!");
    } catch (err: unknown) {
      alert((err as Error).message || "Submission failed");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-emerald-600 text-white">APPROVED</Badge>;
      case "FACULTY_RECOMMENDED":
        return <Badge className="bg-indigo-600 text-white">RECOMMENDED</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-amber-500 text-white">UNDER REVIEW</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-600 text-white">REJECTED</Badge>;
      case "DRAFT":
      default:
        return <Badge variant="secondary">DRAFT</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Badge variant="outline" className="text-white border-white/30 mb-2">
            Organizer Journey Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Event Organizer Operations</h1>
          <p className="mt-1 text-sm text-purple-100 max-w-xl">
            Draft proposals with the Mistral AI co-pilot, submit to faculty committees, track attendance, and scan HMAC tickets at event gates.
          </p>
        </div>
        <div className="flex space-x-3 shrink-0">
          <Link href="/organizer/create-event">
            <Button className="bg-white text-purple-800 hover:bg-purple-50 font-semibold flex items-center space-x-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </Button>
          </Link>
          <Link href="/organizer/scanner">
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 flex items-center space-x-1.5">
              <QrCode className="w-4 h-4" />
              <span>Gate Scanner</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Managed Events</CardTitle>
            <Clock className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{events.length}</div>
            <p className="text-xs text-slate-500 mt-1">Across all workflow states</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {events.filter((e) => e.status === "SUBMITTED" || e.status === "FACULTY_RECOMMENDED").length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Awaiting committee approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Approved</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {events.filter((e) => e.status === "APPROVED").length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Published to campus schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Management Table / Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">My Managed Events</h2>
          <Link href="/organizer/analytics" className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center space-x-1">
            <BarChart3 className="w-4 h-4" />
            <span>Attendance Reports</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <div key={event.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-slate-900">{event.title}</span>
                    {getStatusBadge(event.status)}
                  </div>
                  <p className="text-xs text-slate-500">
                    Dept: {event.department} &bull; Capacity: {event.current_capacity}/{event.max_capacity} registered
                  </p>
                  {event.rejection_reason && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 mt-2">
                      <b>Rejection Feedback:</b> {event.rejection_reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {event.status === "DRAFT" || event.status === "REJECTED" ? (
                    <>
                      <Link href={`/organizer/edit-event/${event.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300 hover:bg-slate-100 text-slate-700 text-xs flex items-center space-x-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit Event</span>
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleSubmitEvent(event.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                      >
                        Submit for Approval
                      </Button>
                    </>
                  ) : null}

                  {event.status === "APPROVED" && (
                    <Link href="/organizer/scanner">
                      <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs">
                        Open Scanner
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

