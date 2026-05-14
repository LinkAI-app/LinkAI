import { NextResponse } from "next/server";

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;

  const redirectUri = "https://linkaiapp.ai/api/tiktok/callback";

  const scope = ["user.info.basic"].join(",");

  const authUrl =
    "https://www.tiktok.com/v2/auth/authorize/" +
    `?client_key=${clientKey}` +
    "&response_type=code" +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&state=linkai";

  return NextResponse.redirect(authUrl);
}