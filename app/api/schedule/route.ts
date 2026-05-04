import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user?.email || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const scheduledTime = formData.get("scheduledTime") as string;

    if (!file || !title || !description || !scheduledTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${session.user.email}/${fileName}`;

    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("videos")
      .upload(filePath, bytes, {
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("videos")
      .getPublicUrl(filePath);

    const { error: dbError } = await supabaseAdmin
      .from("scheduled_posts")
      .insert({
        user_email: session.user.email,
        title,
        description,
        video_url: publicUrlData.publicUrl,
        scheduled_time: scheduledTime,
        status: "scheduled",
        access_token: session.accessToken,
      });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Scheduled successfully",
      videoUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.log("SERVER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}