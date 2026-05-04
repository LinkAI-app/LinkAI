import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const finalTitle = title.includes("#shorts")
    ? title
    : `${title} #shorts`;

  const finalDescription = description.includes("#shorts")
    ? description
    : `${description} #shorts`;

  const metadata = {
    snippet: {
      title: finalTitle,
      description: finalDescription,
      tags: ["shorts", "AI", "upload"],
      categoryId: "22",
    },
    status: {
      privacyStatus: "private",
      selfDeclaredMadeForKids: false,
    },
  };

  const boundary = "foo_bar_baz";

  const body = new Uint8Array([
    ...new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
        metadata
      )}\r\n`
    ),
    ...new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: ${file.type || "video/mp4"}\r\n\r\n`
    ),
    ...new Uint8Array(await file.arrayBuffer()),
    ...new TextEncoder().encode(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  const data = await res.json();

  return NextResponse.json(data);
}