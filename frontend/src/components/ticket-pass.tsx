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

      <CardHeader className="p-5 pb-2">
        <h3 className="font-bold text-lg text-slate-900 leading-tight">
          {pass.event_title || "Campus Event Pass"}
        </h3>
        <p className="text-xs text-slate-500">Holder: {pass.user_name || "Registered Student"}</p>
      </CardHeader>

      <CardContent className="p-5 pt-2 space-y-4">
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-slate-200 shadow-inner">
          <QRCodeSVG
            value={pass.ticket_qr_hash}
            size={160}
            level="H"
            includeMargin={true}
          />
          <span className="mt-2 text-[10px] font-mono text-slate-400 select-all truncate max-w-[200px]">
            {pass.ticket_qr_hash.slice(0, 16)}...{pass.ticket_qr_hash.slice(-8)}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {pass.event_start_time
                ? new Date(pass.event_start_time).toLocaleString()
                : "Schedule Announced"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{pass.event_location || "Campus Venue / Main Hall"}</span>
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

