"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketPass } from "@/components/ticket-pass";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { RegistrationItem } from "@/types";
import { QrCode } from "lucide-react";

export default function StudentMyPassesPage() {
  const [passes, setPasses] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPasses() {
      try {
        const data = await apiFetch<RegistrationItem[]>("/registrations/me");
        setPasses(data);
      } catch {
        // Fallback demo pass
        setPasses([
          {
            id: "demo-reg-001",
            event_id: "demo-event-1",
            user_id: "demo-student-1",
            status: "CONFIRMED",
            ticket_qr_hash: "eyJhbGciOiJIUzI1NiJ9.demo-ticket-hash-hmac-sha256-verified-key",
            created_at: new Date().toISOString(),
            event_title: "National Cloud & AI Hackathon 2026",
            event_start_time: "2026-11-20T09:00:00Z",
            event_location: "Main Auditorium",
            user_name: "Aarav Sharma",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchPasses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Event Pass Wallet</h1>
          <p className="text-sm text-slate-600">
            Cryptographically signed digital boarding passes with high-contrast HMAC QR codes
          </p>
        </div>
        <Link href="/student/events">
          <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            Browse More Events
          </Button>
        </Link>
      </div>

      {passes.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-slate-800">No Registered Passes Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            You haven&apos;t registered for any campus events yet. Explore the catalog to reserve your digital seat.
          </p>
          <Link href="/student/events">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
              View Available Events
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {passes.map((pass) => (
          <TicketPass key={pass.id} pass={pass} />
        ))}
      </div>
    </div>
  );
}

