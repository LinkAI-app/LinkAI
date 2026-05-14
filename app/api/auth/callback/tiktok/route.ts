import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      "https://linkaiapp.ai/dashboard?error=tiktok"
    );
  }

  await supabase.from("social_connections").insert([
    {
      platform: "TikTok",
      connected: true,
    },
  ]);

  return NextResponse.redirect(
    "https://linkaiapp.ai/dashboard?tiktok=connected"
  );
}