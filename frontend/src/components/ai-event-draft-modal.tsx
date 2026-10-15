"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { AIDraftResponse } from "@/types";
import ReactMarkdown from "react-markdown";

interface AIDraftModalProps {
  department: string;
  onApplyDraft: (draft: AIDraftResponse) => void;
}

export function AIDraftModal({ department, onApplyDraft }: AIDraftModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<AIDraftResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt || prompt.length < 10) {
      setErrorMsg("Please enter at least 10 characters describing the event.");
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiFetch<AIDraftResponse>("/ai/draft-event", {
        method: "POST",
        body: JSON.stringify({
          rough_prompt: prompt,
          department: department || "Computer Engineering",
        }),
      });
      setDraft(res);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "AI generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (draft) {
      onApplyDraft(draft);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1.5 border-purple-300 text-purple-700 hover:bg-purple-50"
      >
        <Sparkles className="w-4 h-4 text-purple-600" />
        <span>AI Proposal Co-Pilot</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-purple-700 font-bold text-lg mb-1">
              <Sparkles className="w-5 h-5" />
              <span>Mistral AI Event Co-Pilot</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter your raw concepts, themes, and prize details. Mistral AI will craft a structured collegiate proposal.
            </p>

            <div className="space-y-3 mb-4">
              <textarea
                rows={3}
                placeholder="E.g., 36-hour Cloud Native hackathon for 3rd year students with 50,000 INR prize pool, hands-on GKE labs, and industry judges."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Department: {department || "General"}</span>
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !prompt}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Draft</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200 mb-4">
                {errorMsg}
              </div>
            )}

            {/* AI Generated Preview */}
            {draft && (
              <div className="flex-1 overflow-y-auto border border-purple-200 bg-purple-50/30 rounded-lg p-4 space-y-3 text-xs text-slate-700 mb-4">
                <div>
                  <span className="font-semibold text-slate-900 text-sm block">{draft.title}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {draft.tags.map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Suggested Capacity:</span> {draft.suggested_capacity} Attendees
                </div>
                <div className="text-slate-700 bg-white p-3 rounded border border-slate-200 text-xs space-y-1.5">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => <h1 className="text-sm font-bold text-slate-900 mt-1 mb-0.5" {...props} />,
                      h2: ({ ...props }) => <h2 className="text-xs font-bold text-slate-900 mt-1 mb-0.5 border-b pb-0.5" {...props} />,
                      h3: ({ ...props }) => <h3 className="text-xs font-semibold text-slate-800 mt-1 mb-0.5" {...props} />,
                      p: ({ ...props }) => <p className="text-xs text-slate-700 mb-1 leading-relaxed" {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc list-inside text-xs text-slate-700 mb-1 space-y-0.5" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal list-inside text-xs text-slate-700 mb-1 space-y-0.5" {...props} />,
                      li: ({ ...props }) => <li className="text-xs text-slate-700" {...props} />,
                      strong: ({ ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                      blockquote: ({ ...props }) => <blockquote className="border-l-2 border-purple-400 pl-2 italic text-xs text-slate-600 my-1" {...props} />,
                      code: ({ ...props }) => <code className="bg-slate-100 text-purple-800 px-1 py-0.5 rounded text-[11px] font-mono" {...props} />,
                    }}
                  >
                    {draft.description}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {draft && (
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5">
                  <Check className="w-4 h-4" />
                  <span>Apply Draft to Form</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

