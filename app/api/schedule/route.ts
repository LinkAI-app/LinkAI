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

    const userEmail = session.user.email;
    const today = new Date().toISOString().slice(0, 10);

    let { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", userEmail)
      .single();

    if (!user) {
      const { data: newUser, error: createUserError } = await supabaseAdmin
        .from("users")
        .insert({
          email: userEmail,
          plan: "free",
        })
        .select()
        .single();

      if (createUserError) {
        return NextResponse.json(
          { error: createUserError.message },
          { status: 500 }
        );
      }

      user = newUser;
    }

    if (user.plan === "free") {
      let { data: usage } = await supabaseAdmin
        .from("daily_uploads")
        .select("*")
        .eq("user_email", userEmail)
        .eq("upload_date", today)
        .single();

      if (!usage) {
        const { data: newUsage, error: createUsageError } = await supabaseAdmin
          .from("daily_uploads")
          .insert({
            user_email: userEmail,
            upload_date: today,
            count: 0,
          })
          .select()
          .single();

        if (createUsageError) {
          return NextResponse.json(
            { error: createUsageError.message },
            { status: 500 }
          );
        }

        usage = newUsage;
      }

      if (usage.count >= 3) {
        return NextResponse.json(
          {
            error:
              "Free plan limit reached. You can schedule 3 uploads per day. Upgrade to premium for unlimited uploads.",
          },
          { status: 403 }
        );
      }

      const { error: updateUsageError } = await supabaseAdmin
        .from("daily_uploads")
        .update({ count: usage.count + 1 })
        .eq("user_email", userEmail)
        .eq("upload_date", today);

      if (updateUsageError) {
        return NextResponse.json(
          { error: updateUsageError.message },
          { status: 500 }
        );
      }
    }

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const scheduledTime = formData.get("scheduledTime") as string;

    if (!file || !title || !description || !scheduledTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const filePath = `${userEmail}/${fileName}`;
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
        user_email: userEmail,
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