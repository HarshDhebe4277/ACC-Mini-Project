import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Look up user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = (profile?.role || "STUDENT").toLowerCase();
      const response = NextResponse.redirect(`${origin}/${role}/dashboard`);
      response.cookies.set("campus_role", (profile?.role || "STUDENT").toUpperCase(), { path: "/" });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

