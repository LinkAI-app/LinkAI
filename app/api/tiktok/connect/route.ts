import { NextResponse } from "next/server";

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;

  const redirectUri =
    "https://www.linkaiapp.ai/api/auth/callback/tiktok";

  const scope = "user.info.basic";

  const authUrl =
    "https://www.tiktok.com/v2/auth/authorize/" +
    `?client_key=${clientKey}` +
    "&response_type=code" +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&state=linkai";

  return NextResponse.redirect(authUrl);
}