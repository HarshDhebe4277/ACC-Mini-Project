"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Search, CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { EventItem } from "@/types";
import ReactMarkdown from "react-markdown";

export default function StudentEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<EventItem | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const [data, passes] = await Promise.all([
          apiFetch<EventItem[]>("/events"),
          apiFetch<any[]>("/registrations/me").catch(() => []),
        ]);
        setEvents(data);
        if (Array.isArray(passes)) {
          setRegisteredEventIds(new Set(passes.map((p: any) => p.event_id)));
        }
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
      // Mark as registered immediately so button goes away!
      setRegisteredEventIds((prev) => new Set([...prev, eventId]));
      // Increment local capacity
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? { ...ev, current_capacity: ev.current_capacity + 1 } : ev
        )
      );
    } catch (err: unknown) {
      const msg = (err as Error).message || "Registration failed";
      setErrorMsg(msg);
      if (msg.toLowerCase().includes("already registered")) {
        setRegisteredEventIds((prev) => new Set([...prev, eventId]));
      }
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

              const isRegistered = registeredEventIds.has(event.id);

              return (
                <Card key={event.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        <Badge variant="outline" className="text-xs font-semibold bg-slate-50">
                          {event.department}
                        </Badge>
                        {isRegistered && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-0.5" />
                            Registered
                          </Badge>
                        )}
                      </div>
                      <Badge variant={isFull ? "destructive" : "secondary"} className="text-xs">
                        {isFull ? "Waitlist Only" : `${event.max_capacity - event.current_capacity} Seats Left`}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900">{event.title}</CardTitle>
                    <div className="line-clamp-3 text-xs mt-1 text-slate-600">
                      <ReactMarkdown
                        components={{
                          p: ({ ...props }) => <span {...props} />,
                          h1: ({ ...props }) => <strong className="font-semibold text-slate-800 mr-1" {...props} />,
                          h2: ({ ...props }) => <strong className="font-semibold text-slate-800 mr-1" {...props} />,
                          h3: ({ ...props }) => <strong className="font-semibold text-slate-800 mr-1" {...props} />,
                        }}
                      >
                        {event.description}
                      </ReactMarkdown>
                    </div>
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

                  <CardFooter className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEventDetails(event)}
                      className="text-xs text-slate-700 hover:bg-slate-100 flex items-center shrink-0"
                    >
                      <Info className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Details
                    </Button>
                    {isRegistered ? (
                      <Link href="/student/my-passes" className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                          <span>Registered • View Pass</span>
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={() => handleRegister(event.id)}
                        disabled={registeringId === event.id}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
                      >
                        {registeringId === event.id ? "Processing..." : isFull ? "Join Waitlist" : "Register with 1-Click"}
                      </Button>
                    )}
                  </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Event Details Full Markdown Modal */}
      {selectedEventDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <Badge variant="outline" className="text-xs font-semibold bg-slate-50 mb-1">
                  {selectedEventDetails.department}
                </Badge>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedEventDetails.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Start: {new Date(selectedEventDetails.start_time).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Venue: {selectedEventDetails.venue_name || "Campus Auditorium"}</span>
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
                    blockquote: ({ ...props }) => <blockquote className="border-l-4 border-blue-400 pl-3 italic text-xs text-slate-600 my-2 bg-blue-50/50 py-1" {...props} />,
                    code: ({ ...props }) => <code className="bg-slate-100 text-purple-800 px-1 py-0.5 rounded text-[11px] font-mono" {...props} />,
                  }}
                >
                  {selectedEventDetails.description}
                </ReactMarkdown>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEventDetails(null)}
              >
                Close
              </Button>
              {registeredEventIds.has(selectedEventDetails.id) ? (
                <Link href="/student/my-passes">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Registered • View Pass</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    handleRegister(selectedEventDetails.id);
                    setSelectedEventDetails(null);
                  }}
                  disabled={registeringId === selectedEventDetails.id}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
                >
                  Register for Event
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

