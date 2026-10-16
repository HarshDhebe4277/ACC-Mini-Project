"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Camera, RefreshCw, Upload, Sparkles, SwitchCamera } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { AttendanceScanResult, RegistrationItem } from "@/types";
import jsQR from "jsqr";

export function QRScanner() {
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [manualHash, setManualHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [scanResult, setScanResult] = useState<AttendanceScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Send hash to backend verification endpoint
  const verifyTicketHash = async (hash: string) => {
    const cleanHash = hash?.trim();
    if (!cleanHash || isScanningRef.current) return;

    try {
      isScanningRef.current = true;
      setLoading(true);
      setErrorMsg(null);
      setScanResult(null);
      setStatusNote("Verifying cryptographic ticket with server...");

      const result = await apiFetch<AttendanceScanResult>("/attendance/scan", {
        method: "POST",
        body: JSON.stringify({ ticket_qr_hash: cleanHash }),
      });

      setScanResult(result);
      setStatusNote(null);
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(200);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Ticket verification failed");
      setStatusNote(null);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isScanningRef.current = false;
      }, 2500);
    }
  };

  // Start HTML5 Video Stream
  const startCamera = async (mode: "environment" | "user" = facingMode) => {
    try {
      setErrorMsg(null);
      setStatusNote("Starting camera feed...");
      stopCamera();

      // Check if getUserMedia is supported in the current browser context
      if (!navigator?.mediaDevices?.getUserMedia) {
        const legacyGetUserMedia =
          (navigator as any)?.getUserMedia ||
          (navigator as any)?.webkitGetUserMedia ||
          (navigator as any)?.mozGetUserMedia;

        if (!legacyGetUserMedia) {
          throw new Error(
            "Camera access is restricted in this context. Web browsers require a secure connection ('localhost' or 'https://') to access the camera. If you are opening this via an IP address (e.g. from your mobile phone), please open via http://localhost:3000 or use the 'Upload QR Image' button below to scan."
          );
        }
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let stream: MediaStream;
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      } else {
        const legacyGetUserMedia =
          (navigator as any)?.getUserMedia ||
          (navigator as any)?.webkitGetUserMedia ||
          (navigator as any)?.mozGetUserMedia;
        stream = await new Promise((resolve, reject) => {
          legacyGetUserMedia.call(navigator, { video: true }, resolve, reject);
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setStatusNote("Camera active. Fit all 3 corner square markers of the QR code in view.");
      startLiveDetection();
    } catch (err: unknown) {
      setErrorMsg(((err as Error).message || "Please check camera permissions."));
      setCameraActive(false);
      setStatusNote(null);
    }
  };

  // Stop HTML5 Video Stream
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setStatusNote(null);
  };

  // Real-time live frame scanning with jsQR & BarcodeDetector
  const startLiveDetection = () => {
    let barcodeDetector: any = null;
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      } catch {}
    }

    let lastScanTime = 0;

    const detectLoop = async (time: number) => {
      if (!videoRef.current || !streamRef.current) {
        return;
      }

      if (isScanningRef.current) {
        animFrameRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      // Throttle scanning to every 120ms for smooth performance
      if (time - lastScanTime > 120) {
        lastScanTime = time;
        const video = videoRef.current;

        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          try {
            // 1. Try Native BarcodeDetector if available
            if (barcodeDetector) {
              try {
                const barcodes = await barcodeDetector.detect(video);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  console.log("BarcodeDetector detected QR:", barcodes[0].rawValue);
                  await verifyTicketHash(barcodes[0].rawValue);
                  return;
                }
              } catch {}
            }

            // 2. High-speed jsQR canvas scan
            const canvas = hiddenCanvasRef.current || document.createElement("canvas");
            hiddenCanvasRef.current = canvas;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });

            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              });

              if (code && code.data) {
                console.log("jsQR detected QR in live stream:", code.data);
                await verifyTicketHash(code.data);
                return;
              }
            }
          } catch {}
        }
      }

      animFrameRef.current = requestAnimationFrame(detectLoop);
    };

    animFrameRef.current = requestAnimationFrame(detectLoop);
  };

  // Manual Capture & Verify Frame
  const captureAndScanFrame = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      setErrorMsg("Camera is not ready yet. Please wait a moment.");
      return;
    }

    try {
      setCapturing(true);
      setErrorMsg(null);
      setStatusNote("Scanning captured camera frame...");

      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        throw new Error("Could not initialize 2D canvas");
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 1. Scan with jsQR (supports dark mode & screen inversion)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code && code.data) {
        setStatusNote("QR Code found! Verifying ticket with server...");
        await verifyTicketHash(code.data);
        return;
      }

      // 2. Try Native BarcodeDetector
      if ("BarcodeDetector" in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            setStatusNote("QR Code found! Verifying ticket with server...");
            await verifyTicketHash(barcodes[0].rawValue);
            return;
          }
        } catch {}
      }

      // If neither detected, provide clear actionable guidance
      setErrorMsg(
        "No complete QR code found in this snapshot. Please make sure the entire QR code (including the 3 big corner squares) is visible and not cut off at the edges."
      );
      setStatusNote(null);
    } catch (err: unknown) {
      setErrorMsg("Scan error: " + ((err as Error).message || "Could not process image"));
      setStatusNote(null);
    } finally {
      setCapturing(false);
    }
  };

  // File Upload Scan (Screenshot / Photo)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setStatusNote("Scanning uploaded image for QR code...");

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      await img.decode();

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Could not initialize canvas");

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code && code.data) {
        await verifyTicketHash(code.data);
      } else {
        setErrorMsg("Could not detect a full QR code in the uploaded image. Please ensure the 3 corner squares are fully visible.");
        setStatusNote(null);
      }
    } catch {
      setErrorMsg("Could not process the uploaded image. Please try another image.");
      setStatusNote(null);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Quick Test with user's own pass
  const handleQuickTest = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setStatusNote("Fetching latest pass for test check-in...");
      const passes = await apiFetch<RegistrationItem[]>("/registrations/me");
      if (passes && passes.length > 0) {
        const pass = passes[0];
        setManualHash(pass.ticket_qr_hash);
        await verifyTicketHash(pass.ticket_qr_hash);
      } else {
        setErrorMsg("No registered passes found to test. Please register for an event first.");
        setStatusNote(null);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Quick test failed");
      setStatusNote(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (cameraActive) {
      startCamera(nextMode);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
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
          <Badge
            variant={cameraActive ? "default" : "outline"}
            className={cameraActive ? "bg-emerald-600 text-white" : "text-xs"}
          >
            {cameraActive ? `Live Camera (${facingMode})` : "Standby"}
          </Badge>
        </div>
        <CardDescription>
          Position the student ticket QR in view (ensure all 3 corner square markers are visible)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Camera Viewfinder */}
        <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-950 min-h-[300px] flex flex-col items-center justify-center p-3">
          <div className="relative w-full max-w-sm flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full max-h-[320px] rounded-lg object-contain bg-black border-2 border-purple-500/40 shadow-inner ${
                !cameraActive ? "hidden" : "block"
              }`}
            />

            {/* Target Reticle Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                <div className="w-[85%] h-[85%] border-2 border-dashed border-emerald-400/70 rounded-xl relative flex items-end justify-center pb-2">
                  <span className="text-[10px] text-emerald-300 font-bold bg-black/75 px-2 py-0.5 rounded shadow">
                    Keep all 3 corner squares inside
                  </span>
                </div>
              </div>
            )}
          </div>

          {cameraActive && (
            <div className="w-full max-w-sm mt-3 space-y-2">
              <Button
                type="button"
                onClick={captureAndScanFrame}
                disabled={capturing || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-sm shadow-md flex items-center justify-center space-x-2"
              >
                {capturing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    <span>Analyzing Frame...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-1" />
                    <span>📸 Capture & Verify Pass</span>
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleFacingMode}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
                >
                  <SwitchCamera className="w-3.5 h-3.5 mr-1" />
                  <span>Switch Camera</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={stopCamera}
                  className="bg-red-500/20 text-red-200 border-red-500/30 hover:bg-red-500/30 text-xs"
                >
                  Stop Camera
                </Button>
              </div>
            </div>
          )}

          {!cameraActive && (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-slate-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-slate-300 mb-1 font-medium">Camera is currently idle</p>
              <p className="text-xs text-slate-400 mb-4 max-w-xs">Click start to turn on your webcam or phone camera</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  type="button"
                  onClick={() => startCamera()}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-5"
                >
                  <Camera className="w-4 h-4 mr-1.5" />
                  Start Camera Scanner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload QR Image
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input for Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Status / Working Indicator */}
        {statusNote && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
            <span>{statusNote}</span>
          </div>
        )}

        {/* Verification Success Alert */}
        {scanResult && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-emerald-950 flex items-start space-x-3 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-base text-emerald-900">{scanResult.message}</p>
              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-emerald-800">
                <p>Event: <b className="text-emerald-950">{scanResult.event_title || "Campus Event"}</b></p>
                <p>Attendee: <b className="text-emerald-950">{scanResult.user_name || "Verified Student"}</b></p>
              </div>
              <p className="text-[11px] text-emerald-700 font-mono mt-1 pt-1 border-t border-emerald-200">
                Verified at: {new Date(scanResult.marked_at).toLocaleTimeString()} &bull; Pass #{scanResult.registration_id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        )}

        {/* Verification Failure / Denied Alert */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border-2 border-red-400 rounded-xl text-red-950 flex items-start space-x-3 shadow-sm animate-in fade-in duration-200">
            <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-base text-red-900">Check-In Denied</p>
              <p className="text-xs text-red-800 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Quick Test & Manual Verification */}
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Manual / Quick Test</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickTest}
              disabled={loading}
              className="text-[11px] h-7 text-purple-700 border-purple-200 hover:bg-purple-50 flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-purple-600 mr-1" />
              <span>⚡ Test Check-in With My Pass</span>
            </Button>
          </div>

          <div className="flex space-x-2">
            <Input
              placeholder="Paste ticket_qr_hash string..."
              value={manualHash}
              onChange={(e) => setManualHash(e.target.value)}
              className="text-xs font-mono"
            />
            <Button
              type="button"
              onClick={() => verifyTicketHash(manualHash)}
              disabled={loading || !manualHash}
              className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 text-xs"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify Ticket"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
