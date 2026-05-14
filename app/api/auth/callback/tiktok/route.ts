import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(
        "https://linkaiapp.ai/dashboard?error=tiktok"
      );
    }

    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri:
            "https://www.linkaiapp.ai/api/auth/callback/tiktok",
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        "https://linkaiapp.ai/dashboard?error=token"
      );
    }

    const profileResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profileData = await profileResponse.json();
    const userInfo = profileData.data?.user;

    const openId = userInfo?.open_id || "";
    const username = userInfo?.display_name || "TikTok User";
    const avatarUrl = userInfo?.avatar_url || "";

    const { data: existing } = await supabase
      .from("social_connections")
      .select("id")
      .eq("platform", "TikTok")
      .eq("open_id", openId)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from("social_connections")
        .update({
          username,
          avatar_url: avatarUrl,
          access_token: accessToken,
          connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("social_connections").insert([
        {
          platform: "TikTok",
          open_id: openId,
          username,
          avatar_url: avatarUrl,
          access_token: accessToken,
          connected: true,
          updated_at: new Date().toISOString(),
        },
      ]);
    }

    return NextResponse.redirect(
      "https://linkaiapp.ai/dashboard?tiktok=connected"
    );
  } catch (error) {
    console.error(error);

    return NextResponse.redirect(
      "https://linkaiapp.ai/dashboard?error=server"
    );
  }
}