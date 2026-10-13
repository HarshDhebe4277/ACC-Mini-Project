import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Shield, Sparkles, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              CE
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900">CampusEvents</span>
              <Badge variant="outline" className="ml-2 text-xs">Cloud Native</Badge>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="default">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
            AI-Powered & Cloud-Native
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            College Event Management System
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Automated event lifecycle management, AI-assisted proposal drafting, real-time ticket pass generation, and offline PWA attendance scanning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl">Students</CardTitle>
              <CardDescription>
                Discover campus events, register with one click, get digital HMAC QR tickets, and claim certificates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/dashboard">
                <Button variant="outline" className="w-full">Student Portal</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center text-purple-600 mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl">Organizers</CardTitle>
              <CardDescription>
                Draft event proposals with Mistral AI, track attendees, and scan QR passes with offline camera scanner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/organizer/dashboard">
                <Button variant="outline" className="w-full">Organizer Portal</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-md bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
                <UserCheck className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl">Faculty</CardTitle>
              <CardDescription>
                Review departmental event proposals, recommend approvals, and inspect attendance analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/faculty/dashboard">
                <Button variant="outline" className="w-full">Faculty Portal</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl">Administrators</CardTitle>
              <CardDescription>
                Final event approvals with venue clash detection, global audit logging, and user RBAC controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/dashboard">
                <Button variant="outline" className="w-full">Admin Portal</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          College Event Management System &bull; Micro-Project CI/CD on GKE &bull; Built with Next.js 14, FastAPI & Supabase
        </div>
      </footer>
    </div>
  );
}
