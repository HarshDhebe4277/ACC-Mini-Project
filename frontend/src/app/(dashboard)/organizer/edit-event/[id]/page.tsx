"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIDraftModal } from "@/components/ai-event-draft-modal";
import { apiFetch } from "@/lib/api-client";
import { AIDraftResponse, EventItem } from "@/types";
import { ArrowLeft, AlertCircle, Save, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [description, setDescription] = useState("");
  const [maxCapacity, setMaxCapacity] = useState(100);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState<string>("DRAFT");
  const [descriptionTab, setDescriptionTab] = useState<"write" | "preview">("write");

  const formatDateForInput = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (!eventId) return;

    async function loadEvent() {
      try {
        setInitialLoading(true);
        const data = await apiFetch<EventItem>(`/events/${eventId}`);
        setTitle(data.title || "");
        setDepartment(data.department || "Computer Science");
        setDescription(data.description || "");
        setMaxCapacity(data.max_capacity || 100);
        setStartTime(formatDateForInput(data.start_time));
        setEndTime(formatDateForInput(data.end_time));
        setDeadline(formatDateForInput(data.registration_deadline));
        setTags(data.ai_generated_tags || []);
        setRejectionReason(data.rejection_reason || null);
        setEventStatus(data.status);
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || "Failed to load event details");
      } finally {
        setInitialLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  const handleApplyDraft = (draft: AIDraftResponse) => {
    setTitle(draft.title);
    setDescription(draft.description);
    setMaxCapacity(draft.suggested_capacity || 100);
    if (draft.tags && draft.tags.length > 0) {
      setTags(draft.tags);
    }
  };

  const handleSave = async (submitAfterSave: boolean = false) => {
    if (!title || !description) {
      setErrorMsg("Please provide event title and description.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      await apiFetch(`/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          department,
          description,
          max_capacity: Number(maxCapacity),
          start_time: startTime ? new Date(startTime).toISOString() : undefined,
          end_time: endTime ? new Date(endTime).toISOString() : undefined,
          registration_deadline: deadline ? new Date(deadline).toISOString() : undefined,
          ai_generated_tags: tags,
        }),
      });

      if (submitAfterSave) {
        await apiFetch(`/events/${eventId}/submit`, { method: "PUT" });
      }

      router.push("/organizer/dashboard");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
        <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
        <p className="text-sm">Loading event details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/organizer/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* AI Co-Pilot Dialog */}
        <AIDraftModal department={department} onApplyDraft={handleApplyDraft} />
      </div>

      <Card className="shadow-md border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">Edit Event Proposal</CardTitle>
              <CardDescription>
                Revise submission details, address reviewer feedback, and resubmit for approval.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 uppercase">
              {eventStatus}
            </span>
          </div>

          {rejectionReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start space-x-2 mt-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <div>
                <span className="font-bold">Faculty Reviewer Feedback:</span> {rejectionReason}
              </div>
            </div>
          )}
        </CardHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Event Title</label>
              <Input
                placeholder="e.g. NextGen Web & Cloud Systems Symposium 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Organizing Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Telecommunication">Electronics & Telecom</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Attendee Capacity Limit</label>
                <Input
                  type="number"
                  min="10"
                  max="2000"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Start Time</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">End Time</label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Registration Deadline</label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Event Description & Agenda</label>
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDescriptionTab("write")}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      descriptionTab === "write"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Edit Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescriptionTab("preview")}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      descriptionTab === "preview"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Preview Rendered
                  </button>
                </div>
              </div>

              {descriptionTab === "write" ? (
                <textarea
                  rows={8}
                  placeholder="Markdown formatted overview, eligibility, prizes, and schedule breakdown..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm p-3 rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                  required
                />
              ) : (
                <div className="w-full min-h-[180px] max-h-[360px] overflow-y-auto p-4 rounded-md border border-slate-200 bg-slate-50/70 text-slate-900 space-y-2">
                  {description ? (
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
                        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-purple-400 pl-3 italic text-xs text-slate-600 my-2" {...props} />,
                        code: ({ ...props }) => <code className="bg-slate-200 text-purple-800 px-1 py-0.5 rounded text-[11px] font-mono" {...props} />,
                      }}
                    >
                      {description}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No description entered yet. Switch to Edit Markdown to add content.</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-100 pt-4">
            <Link href="/organizer/dashboard">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => handleSave(false)}
                className="text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center space-x-1"
              >
                <Save className="w-4 h-4 mr-1" />
                <span>{loading ? "Saving..." : "Save Draft"}</span>
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={() => handleSave(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center space-x-1"
              >
                <Send className="w-4 h-4 mr-1" />
                <span>{loading ? "Saving & Submitting..." : "Save & Resubmit"}</span>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
