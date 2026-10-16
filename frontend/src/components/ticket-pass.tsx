"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Download, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { RegistrationItem } from "@/types";

interface TicketPassProps {
  pass: RegistrationItem;
}

export function TicketPass({ pass }: TicketPassProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadCertificate = async () => {
    try {
      setDownloading(true);
      const blob = await apiFetch<Blob>(`/certificates/${pass.id}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate_${(pass.event_title || "Event").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert((err as Error).message || "Certificate download failed");
    } finally {
      setDownloading(false);
    }
  };

  const isAttended = pass.status === "ATTENDED";
  const isConfirmed = pass.status === "CONFIRMED";

  return (
    <Card className="overflow-hidden border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-b from-white to-slate-50">
      <div className="bg-blue-600 text-white px-5 py-3 flex items-center justify-between">
        <span className="font-semibold text-sm tracking-wide">DIGITAL EVENT PASS</span>
        <Badge
          variant="outline"
          className={`text-xs font-bold border-white/40 text-white ${
            isAttended ? "bg-emerald-500/80" : isConfirmed ? "bg-blue-500/80" : "bg-amber-500/80"
          }`}
        >
          {pass.status}
        </Badge>
      </div>

      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="secondary" className="text-[11px] font-semibold bg-blue-50 text-blue-700">
            {pass.event_department || "VES Campus"}
          </Badge>
          <span className="text-[11px] font-mono text-slate-400">
            #{pass.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <h3 className="font-bold text-lg text-slate-900 leading-snug">
          {pass.event_title || "Campus Event Pass"}
        </h3>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Attendee</span>
            <span className="font-medium text-slate-800">{pass.user_name || "Registered Student"}</span>
          </div>
          {pass.user_email && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Email</span>
              <span className="text-[11px] text-slate-500 font-mono truncate max-w-[140px] block">{pass.user_email}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-4">
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-slate-200 shadow-inner">
          <QRCodeSVG
            value={pass.ticket_qr_hash}
            size={200}
            level="L"
            includeMargin={true}
          />
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-[10px] font-mono text-slate-400 select-all truncate max-w-[150px]">
              {pass.ticket_qr_hash.slice(0, 14)}...{pass.ticket_qr_hash.slice(-6)}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(pass.ticket_qr_hash);
                alert("Pass ticket hash copied to clipboard!");
              }}
              className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
            >
              Copy Hash
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
          <div className="flex items-start space-x-2.5">
            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Date & Time</span>
              <span className="font-semibold text-slate-800">
                {pass.event_start_time
                  ? new Date(pass.event_start_time).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Schedule Announced"}
              </span>
              {pass.event_end_time && (
                <span className="text-slate-500 text-[11px] block">
                  Until: {new Date(pass.event_end_time).toLocaleTimeString(undefined, { timeStyle: "short" })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start space-x-2.5 pt-1.5 border-t border-slate-200/50">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Venue</span>
              <span className="font-semibold text-slate-800">{pass.event_location || "Campus Auditorium"}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-slate-100/60 border-t border-slate-200 flex flex-col space-y-2">
        {isAttended ? (
          <Button
            size="sm"
            onClick={handleDownloadCertificate}
            disabled={downloading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Generating PDF..." : "Download Certificate"}</span>
          </Button>
        ) : (
          <div className="w-full text-center py-1 text-xs text-slate-500 flex items-center justify-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Present QR code at gate to check in</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

