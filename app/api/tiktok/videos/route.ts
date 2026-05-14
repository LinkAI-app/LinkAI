import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: connection, error } = await supabase
      .from("social_connections")
      .select("access_token")
      .eq("platform", "TikTok")
      .eq("connected", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !connection?.access_token) {
      return NextResponse.json(
        { error: "No connected TikTok account found." },
        { status: 404 }
      );
    }

    const response = await fetch(
      "https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url,view_count,like_count,comment_count,share_count,create_time",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_count: 20,
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("TIKTOK VIDEOS ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Failed to fetch TikTok videos." },
      { status: 500 }
    );
  }
}