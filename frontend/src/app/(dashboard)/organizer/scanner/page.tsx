"use client";

import Link from "next/link";
import { QRScanner } from "@/components/qr-scanner";
import { ArrowLeft, ShieldCheck, WifiOff } from "lucide-react";

export default function OrganizerScannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/organizer/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>HMAC-SHA256 Cryptographic Verification</span>
        </div>
      </div>

      <div className="text-center max-w-lg mx-auto mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Event Gate Attendance Scanner</h1>
        <p className="text-xs text-slate-600 mt-1">
          Position the camera in front of the student digital pass QR code. Checked-in tickets cannot be redeemed more than once.
        </p>
      </div>

      <QRScanner />

      <div className="max-w-xl mx-auto p-4 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-start space-x-2">
        <WifiOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-700">Offline PWA Resilience Notice</p>
          <p className="mt-0.5">
            Student passes are cached in local browser storage via Service Workers. Organizers can verify passes quickly even with intermittent venue Wi-Fi.
          </p>
        </div>
      </div>
    </div>
  );
}

