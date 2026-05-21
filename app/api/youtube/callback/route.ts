import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard?youtube=error`);
  }

  const redirectUri = `${appUrl}/api/youtube/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];

  if (!channel) {
    return NextResponse.redirect(`${appUrl}/dashboard?youtube=error`);
  }

  const username = channel.snippet.title;
  const avatarUrl = channel.snippet.thumbnails?.default?.url || "";

  const { data: existing } = await supabase
    .from("social_connections")
    .select("id")
    .eq("platform", "YouTube")
    .eq("username", username)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("social_connections")
      .update({
        avatar_url: avatarUrl,
        access_token: accessToken,
        connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("social_connections").insert({
      platform: "YouTube",
      username,
      avatar_url: avatarUrl,
      access_token: accessToken,
      connected: true,
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.redirect(`${appUrl}/dashboard?youtube=connected`);
}