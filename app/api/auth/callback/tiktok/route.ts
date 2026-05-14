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
        "https://linkaiapp.ai/dashboard?error=no_code"
      );
    }

    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret:
            process.env.TIKTOK_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri:
            "https://www.linkaiapp.ai/api/auth/callback/tiktok",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    console.log("TOKEN DATA:", tokenData);

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        "https://linkaiapp.ai/dashboard?error=no_token"
      );
    }

    const profileResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,profile_deep_link",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profileData = await profileResponse.json();

    console.log("PROFILE DATA:", profileData);

    const userInfo =
      profileData?.data?.user ||
      profileData?.data ||
      {};

    const openId =
      userInfo.open_id ||
      userInfo.union_id ||
      crypto.randomUUID();

    const username =
      userInfo.display_name ||
      userInfo.username ||
      "TikTok Creator";

    const avatarUrl =
      userInfo.avatar_url ||
      "";

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
      await supabase
        .from("social_connections")
        .insert([
          {
            platform: "TikTok",
            open_id: openId,
            username,
            avatar_url: avatarUrl,
            access_token: accessToken,
            connected: true,
            updated_at:
              new Date().toISOString(),
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