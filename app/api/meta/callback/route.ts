import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.linkaiapp.ai";

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/dashboard?meta=error`);
  }

  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(
        `${appUrl}/api/meta/callback`
      )}&client_secret=${process.env.META_APP_SECRET}&code=${code}`
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Meta token error:", tokenData);
      return NextResponse.redirect(`${appUrl}/dashboard?meta=error`);
    }

    const pagesRes = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?access_token=${tokenData.access_token}`
    );

    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];

    if (!page?.id || !page?.access_token) {
      console.error("Meta pages error:", pagesData);
      return NextResponse.redirect(`${appUrl}/dashboard?meta=nopage`);
    }

    const igRes = await fetch(
      `https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );

    const igData = await igRes.json();
    const instagramId = igData.instagram_business_account?.id;

    let instagramUsername = "instagram_user";
    let instagramAvatar = "";

    if (instagramId) {
      const profileRes = await fetch(
        `https://graph.facebook.com/v25.0/${instagramId}?fields=username,profile_picture_url&access_token=${page.access_token}`
      );

      const profileData = await profileRes.json();

      instagramUsername = profileData.username || instagramUsername;
      instagramAvatar = profileData.profile_picture_url || "";
    }

    await supabase
      .from("social_connections")
      .delete()
      .eq("user_id", userId)
      .in("platform", ["facebook", "instagram"]);

    const rowsToInsert = [
      {
        user_id: userId,
        platform: "facebook",
        username: page.name || "Facebook Page",
        avatar_url: "",
        access_token: page.access_token,
        connected: true,
        page_id: page.id,
      },
      {
        user_id: userId,
        platform: "instagram",
        username: instagramUsername,
        avatar_url: instagramAvatar,
        access_token: page.access_token,
        connected: true,
        page_id: page.id,
        instagram_account_id: instagramId,
      },
    ];

    const { data, error } = await supabase
      .from("social_connections")
      .insert(rowsToInsert)
      .select("*");

    if (error || !data || data.length < 2) {
      console.error("Supabase social connection save error:", error, data);
      return NextResponse.redirect(`${appUrl}/dashboard?meta=error`);
    }

    return NextResponse.redirect(`${appUrl}/dashboard?meta=connected`);
  } catch (err) {
    console.error("Meta callback error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard?meta=error`);
  }
}