"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Camera, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { AttendanceScanResult } from "@/types";

export function QRScanner() {
  const [scannerActive, setScannerActive] = useState(false);
  const [manualHash, setManualHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<AttendanceScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);

  const processTicketHash = async (hash: string) => {
    if (!hash || loading) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      setScanResult(null);

      const result = await apiFetch<AttendanceScanResult>("/attendance/scan", {
        method: "POST",
        body: JSON.stringify({ ticket_qr_hash: hash.trim() }),
      });

      setScanResult(result);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Ticket verification failed");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    try {
      setErrorMsg(null);
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      
      const scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          processTicketHash(decodedText);
        },
        () => {
          // Continuous frame scan, errors can be silently ignored
        }
      );

      scannerRef.current = scanner;
      setScannerActive(true);
    } catch (err: unknown) {
      setErrorMsg("Camera access unavailable: " + (err as Error).message);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        const s = scannerRef.current as { clear: () => Promise<void> };
        s.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Card className="w-full max-w-xl mx-auto shadow-md border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center space-x-2">
            <Camera className="w-5 h-5 text-purple-600" />
            <span>Attendance Pass Scanner</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {scannerActive ? "Live Camera" : "Standby"}
          </Badge>
        </div>
        <CardDescription>
          Scan student ticket QR codes via device camera or paste HMAC ticket hashes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Camera Container */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 min-h-[280px] flex flex-col items-center justify-center p-4">
          <div id="qr-reader-container" className="w-full max-w-sm text-white" />
          {!scannerActive && (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-slate-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-slate-400 mb-4">Camera scanner is currently idle</p>
              <Button onClick={startScanner} className="bg-purple-600 hover:bg-purple-700 text-white">
                Start Camera Scanner
              </Button>
            </div>
          )}
          {scannerActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={stopScanner}
              className="mt-4 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Stop Camera
            </Button>
          )}
        </div>

        {/* Verification Result Alerts */}
        {scanResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-base">{scanResult.message}</p>
              <p className="text-xs text-emerald-700 mt-1">
                Event: <b>{scanResult.event_title}</b> &bull; Attendee: <b>{scanResult.user_name}</b>
              </p>
              <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
                Checked in at: {new Date(scanResult.marked_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-red-900 flex items-start space-x-3">
            <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-base">Check-In Denied</p>
              <p className="text-xs text-red-700 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Manual Input Fallback */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <label className="text-xs font-semibold text-slate-700">Manual Ticket Hash Validation</label>
          <div className="flex space-x-2">
            <Input
              placeholder="Paste ticket_qr_hash string..."
              value={manualHash}
              onChange={(e) => setManualHash(e.target.value)}
              className="text-xs font-mono"
            />
            <Button
              onClick={() => processTicketHash(manualHash)}
              disabled={loading || !manualHash}
              className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

