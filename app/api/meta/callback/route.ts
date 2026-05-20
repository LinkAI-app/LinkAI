import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.linkaiapp.ai";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard?meta=error`);
  }

  try {
    // STEP 1: Exchange code for token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(
        `${appUrl}/api/meta/callback`
      )}&client_secret=${process.env.META_APP_SECRET}&code=${code}`
    );

    const tokenData = await tokenRes.json();

    const accessToken = tokenData.access_token;

    // STEP 2: Get Facebook pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?access_token=${accessToken}`
    );

    const pagesData = await pagesRes.json();

    const page = pagesData.data?.[0];

    if (!page) {
      return NextResponse.redirect(`${appUrl}/dashboard?meta=nopage`);
    }

    // STEP 3: Get Instagram business account
    const igRes = await fetch(
      `https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );

    const igData = await igRes.json();

    const instagramId = igData.instagram_business_account?.id;

    // STEP 4: Get Instagram profile info
    let username = "instagram_user";
    let avatar = "";

    if (instagramId) {
      const profileRes = await fetch(
        `https://graph.facebook.com/v25.0/${instagramId}?fields=username,profile_picture_url&access_token=${page.access_token}`
      );

      const profileData = await profileRes.json();

      username = profileData.username || username;
      avatar = profileData.profile_picture_url || "";
    }

    // STEP 5: Save to Supabase
    await supabase.from("social_connections").insert({
      platform: "instagram",
      username,
      avatar_url: avatar,
      access_token: page.access_token,
      connected: true,
      page_id: page.id,
      instagram_account_id: instagramId,
    });

    return NextResponse.redirect(
      `${appUrl}/dashboard?meta=connected`
    );
  } catch (err) {
    console.error(err);

    return NextResponse.redirect(
      `${appUrl}/dashboard?meta=error`
    );
  }
}