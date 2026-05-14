import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      "https://linkaiapp.ai/dashboard?error=tiktok"
    );
  }

  return NextResponse.redirect(
    "https://linkaiapp.ai/dashboard?tiktok=connected"
  );
}