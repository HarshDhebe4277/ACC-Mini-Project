"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Users } from "lucide-react";

export default function AdminVenuesPage() {
  const venues = [
    {
      id: "v-1",
      name: "Main Auditorium",
      capacity: 800,
      location: "Campus Building A, Ground Floor",
      facilities: ["Projector", "Dolby Sound", "Stage Lighting", "Air Conditioning", "WiFi"],
      isAvailable: true,
    },
    {
      id: "v-2",
      name: "Seminar Hall 1",
      capacity: 150,
      location: "Academic Block 2, 3rd Floor",
      facilities: ["Projector", "Podium Mic", "Air Conditioning", "WiFi"],
      isAvailable: true,
    },
    {
      id: "v-3",
      name: "Seminar Hall 2",
      capacity: 120,
      location: "Academic Block 3, 2nd Floor",
      facilities: ["Smart Display", "Microphone System", "Air Conditioning"],
      isAvailable: true,
    },
    {
      id: "v-4",
      name: "Central Computer Lab",
      capacity: 80,
      location: "IT Block, 1st Floor",
      facilities: ["80 High-End Workstations", "LAN", "Projector", "UPS Backup"],
      isAvailable: true,
    },
    {
      id: "v-5",
      name: "Open Air Amphitheatre",
      capacity: 1200,
      location: "Central Campus Ground",
      facilities: ["Outdoor Stage", "Floodlights", "Sound Rig"],
      isAvailable: true,
    },
    {
      id: "v-6",
      name: "Sports Complex Arena",
      capacity: 500,
      location: "Campus Gymkhana",
      facilities: ["Indoor Badminton Courts", "Scoreboard", "Seating Stands"],
      isAvailable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus Venues & Facilities Inventory</h1>
        <p className="text-sm text-slate-600">
          Capacity limits and AV equipment across campus auditoriums, labs, and seminar halls
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <Card key={venue.id} className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
                  AVAILABLE
                </Badge>
                <div className="flex items-center space-x-1 text-xs text-slate-600 font-semibold">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Max {venue.capacity}</span>
                </div>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 mt-1">{venue.name}</CardTitle>
              <CardDescription className="text-xs flex items-center space-x-1 mt-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{venue.location}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 text-xs">
              <span className="font-semibold text-slate-700 block">Installed Facilities:</span>
              <div className="flex flex-wrap gap-1">
                {venue.facilities.map((fac, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">
                    {fac}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

