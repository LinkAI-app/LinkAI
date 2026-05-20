import { NextResponse } from "next/server";

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

    console.log("META TOKEN:", tokenData);

    return NextResponse.redirect(`${appUrl}/dashboard?meta=connected`);
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(`${appUrl}/dashboard?meta=error`);
  }
}