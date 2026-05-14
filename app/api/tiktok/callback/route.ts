import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({
      error: "No TikTok code received",
    });
  }

  return NextResponse.redirect(
    "https://linkaiapp.ai/dashboard?tiktok=connected"
  );
}