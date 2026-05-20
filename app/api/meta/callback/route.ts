import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      "http://localhost:3000/dashboard?meta=error"
    );
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback&client_secret=${process.env.META_APP_SECRET}&code=${code}`
    );

    const tokenData = await tokenRes.json();

    console.log("META TOKEN:", tokenData);

    // OPTIONAL:
    // save tokenData.access_token to Supabase here

    return NextResponse.redirect(
      "http://localhost:3000/dashboard?meta=connected"
    );
  } catch (err) {
    console.error(err);

    return NextResponse.redirect(
      "http://localhost:3000/dashboard?meta=error"
    );
  }
}