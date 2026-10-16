"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, QrCode, Award, ArrowRight, Clock, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem, RegistrationItem } from "@/types";
import ReactMarkdown from "react-markdown";

export default function StudentDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [passes, setPasses] = useState<RegistrationItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [evList, passList] = await Promise.all([
          apiFetch<EventItem[]>("/events"),
          apiFetch<RegistrationItem[]>("/registrations/me").catch(() => []),
        ]);
        setEvents(evList);
        setPasses(passList);
      } catch {
        // Fallback demo data if offline or mock
        setEvents([
          {
            id: "demo-event-1",
            title: "National Cloud & AI Hackathon 2026",
            description: "36-hour coding challenge on Google Kubernetes Engine and AI Agents.",
            department: "Computer Science",
            start_time: "2026-11-20T09:00:00Z",
            end_time: "2026-11-21T21:00:00Z",
            registration_deadline: "2026-11-18T23:59:59Z",
            max_capacity: 150,
            current_capacity: 84,
            status: "APPROVED",
            ai_generated_tags: ["Cloud", "AI", "Kubernetes"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organizer_id: "org-1",
          },
        ]);
      }
    }
    loadData();
  }, []);

  const attendedCount = passes.filter((p) => p.status === "ATTENDED").length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Badge variant="outline" className="text-white border-white/30 mb-2">
            Student Journey Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome back to CampusEvents</h1>
          <p className="mt-1 text-sm text-blue-100 max-w-xl">
            Explore college workshops, reserve your digital QR seat passes, and download verified certificates of participation.
          </p>
        </div>
        <div className="flex space-x-3 shrink-0">
          <Link href="/student/events">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 font-semibold">
              Browse Events
            </Button>
          </Link>
          <Link href="/student/my-passes">
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
              My Passes ({passes.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Registered Passes</CardTitle>
            <QrCode className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{passes.length}</div>
            <p className="text-xs text-slate-500 mt-1">Confirmed tickets in wallet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Events Attended</CardTitle>
            <Calendar className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{attendedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Attendance checked in at venue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Certificates Earned</CardTitle>
            <Award className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{attendedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Ready for PDF download</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Spotlight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Upcoming Approved Events</h2>
          <Link href="/student/events" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(0, 3).map((event) => {
            const isRegistered = passes.some((p) => p.event_id === event.id);
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {event.department}
                      </Badge>
                      {isRegistered && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                          Registered
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {event.current_capacity} / {event.max_capacity} Seats
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 leading-snug">
                    {event.title}
                  </CardTitle>
                  <div className="line-clamp-2 text-xs mt-1 text-slate-500">
                    <ReactMarkdown
                      components={{
                        p: ({ ...props }) => <span {...props} />,
                        h1: ({ ...props }) => <strong className="font-semibold text-slate-700 mr-1" {...props} />,
                        h2: ({ ...props }) => <strong className="font-semibold text-slate-700 mr-1" {...props} />,
                        h3: ({ ...props }) => <strong className="font-semibold text-slate-700 mr-1" {...props} />,
                      }}
                    >
                      {event.description}
                    </ReactMarkdown>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2 text-xs text-slate-600 pb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{new Date(event.start_time).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{event.venue_name || "Campus Auditorium"}</span>
                  </div>
                </CardContent>

                <div className="p-4 pt-0">
                  <Link href={isRegistered ? "/student/my-passes" : "/student/events"}>
                    <Button
                      variant="outline"
                      className={`w-full text-xs font-semibold ${
                        isRegistered ? "border-emerald-500 text-emerald-700 hover:bg-emerald-50" : ""
                      }`}
                    >
                      {isRegistered ? "Registered • View Pass" : "View & Register"}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

