// app/api/youtube/connect/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.YOUTUBE_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/callback`;

  const scope = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
  ].join(" ");

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(url);
}