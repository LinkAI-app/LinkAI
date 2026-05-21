import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { platforms, caption, media_url, scheduled_for } =
      await req.json();

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "Choose at least one platform." },
        { status: 400 }
      );
    }

    const posts = platforms.map((platform: string) => ({
      platform,
      caption,
      media_url,
      scheduled_for,
      status: "scheduled",
    }));

    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert(posts)
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to schedule posts." },
      { status: 500 }
    );
  }
}