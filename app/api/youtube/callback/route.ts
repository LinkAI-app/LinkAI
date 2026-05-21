import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.linkaiapp.ai";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard?meta=error`);
  }

  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(
        `${appUrl}/api/meta/callback`
      )}&client_secret=${process.env.META_APP_SECRET}&code=${code}`
    );

    const tokenData = await tokenRes.json();
    const userAccessToken = tokenData.access_token;

    const pagesRes = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?access_token=${userAccessToken}`
    );

    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];

    if (!page) {
      return NextResponse.redirect(`${appUrl}/dashboard?meta=nopage`);
    }

    await upsertConnection({
      platform: "facebook",
      username: page.name || "Facebook Page",
      avatar_url: "",
      access_token: page.access_token,
      page_id: page.id,
      instagram_account_id: null,
    });

    const igRes = await fetch(
      `https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );

    const igData = await igRes.json();
    const instagramId = igData.instagram_business_account?.id;

    if (instagramId) {
      let username = "instagram_user";
      let avatar = "";

      const profileRes = await fetch(
        `https://graph.facebook.com/v25.0/${instagramId}?fields=username,profile_picture_url&access_token=${page.access_token}`
      );

      const profileData = await profileRes.json();

      username = profileData.username || username;
      avatar = profileData.profile_picture_url || "";

      await upsertConnection({
        platform: "instagram",
        username,
        avatar_url: avatar,
        access_token: page.access_token,
        page_id: page.id,
        instagram_account_id: instagramId,
      });
    }

    return NextResponse.redirect(`${appUrl}/dashboard?meta=connected`);
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(`${appUrl}/dashboard?meta=error`);
  }
}

async function upsertConnection({
  platform,
  username,
  avatar_url,
  access_token,
  page_id,
  instagram_account_id,
}: {
  platform: string;
  username: string;
  avatar_url: string;
  access_token: string;
  page_id: string | null;
  instagram_account_id: string | null;
}) {
  const { data: existing } = await supabase
    .from("social_connections")
    .select("id")
    .eq("platform", platform)
    .eq("username", username)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("social_connections")
      .update({
        avatar_url,
        access_token,
        connected: true,
        page_id,
        instagram_account_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("social_connections").insert({
      platform,
      username,
      avatar_url,
      access_token,
      connected: true,
      page_id,
      instagram_account_id,
      updated_at: new Date().toISOString(),
    });
  }
}