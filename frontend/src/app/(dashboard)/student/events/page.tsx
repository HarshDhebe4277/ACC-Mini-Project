"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem } from "@/types";

export default function StudentEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await apiFetch<EventItem[]>("/events");
        setEvents(data);
      } catch {
        // Fallback demo events
        setEvents([
          {
            id: "demo-hackathon-1",
            title: "National Cloud Native Hackathon 2026",
            description: "36-hour hackathon focused on containerization, CI/CD, and AI agents. Cash prizes of 50,000 INR.",
            department: "Computer Science",
            start_time: "2026-11-20T09:00:00Z",
            end_time: "2026-11-21T21:00:00Z",
            registration_deadline: "2026-11-18T23:59:59Z",
            max_capacity: 100,
            current_capacity: 45,
            status: "APPROVED",
            ai_generated_tags: ["Hackathon", "GKE", "FastAPI", "Next.js"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organizer_id: "org-1",
            venue_name: "Main Auditorium",
          },
          {
            id: "demo-workshop-2",
            title: "Microservices & Kubernetes Workshop",
            description: "Hands-on engineering lab building production-grade container clusters on GKE with rolling updates.",
            department: "Information Technology",
            start_time: "2026-11-25T10:00:00Z",
            end_time: "2026-11-25T16:00:00Z",
            registration_deadline: "2026-11-24T23:59:59Z",
            max_capacity: 60,
            current_capacity: 60,
            status: "APPROVED",
            ai_generated_tags: ["Docker", "Kubernetes", "DevOps"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organizer_id: "org-2",
            venue_name: "Central Computer Lab",
          },
        ]);
      }
    }
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: string) => {
    try {
      setRegisteringId(eventId);
      setErrorMsg(null);
      setSuccessMsg(null);
      await apiFetch(`/registrations/events/${eventId}`, {
        method: "POST",
      });
      setSuccessMsg("Registration successful! Your digital HMAC QR ticket pass is ready.");
      // Increment local capacity
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? { ...ev, current_capacity: ev.current_capacity + 1 } : ev
        )
      );
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Registration failed");
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "ALL" || ev.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Events Schedule</h1>
          <p className="text-sm text-slate-600">Discover and register for officially approved campus events</p>
        </div>
        <Link href="/student/my-passes">
          <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            View My Active Passes
          </Button>
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
          <Link href="/student/my-passes">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              Open Pass Wallet
            </Button>
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-red-900 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Search by title, topic, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="h-10 px-3 rounded-md border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Electronics & Telecommunication">Electronics & Telecom</option>
        </select>
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const isFull = event.current_capacity >= event.max_capacity;
          const capacityPct = Math.min(
            100,
            Math.round((event.current_capacity / event.max_capacity) * 100)
          );

          return (
            <Card key={event.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs font-semibold bg-slate-50">
                    {event.department}
                  </Badge>
                  <Badge variant={isFull ? "destructive" : "secondary"} className="text-xs">
                    {isFull ? "Waitlist Only" : `${event.max_capacity - event.current_capacity} Seats Left`}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">{event.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-3 mt-1 text-slate-600">
                  {event.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{new Date(event.start_time).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{event.venue_name || "Campus Auditorium"}</span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Capacity: {event.current_capacity} / {event.max_capacity}</span>
                    <span>{capacityPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isFull ? "bg-amber-500" : "bg-blue-600"}`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                </div>

                {event.ai_generated_tags && event.ai_generated_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {event.ai_generated_tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 border-t border-slate-100">
                <Button
                  onClick={() => handleRegister(event.id)}
                  disabled={registeringId === event.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
                >
                  {registeringId === event.id ? "Processing..." : isFull ? "Join Waitlist" : "Register with 1-Click"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

