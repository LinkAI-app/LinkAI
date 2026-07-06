import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const userId = searchParams.get("user_id");

  const clientId = process.env.META_APP_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.linkaiapp.ai";
  const redirectUri = `${appUrl}/api/meta/callback`;

  const scope = [
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_comments",
    "instagram_manage_messages",
  ].join(",");

  const authUrl =
    `https://www.facebook.com/v25.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(userId || "")}`;

  return NextResponse.redirect(authUrl);
}