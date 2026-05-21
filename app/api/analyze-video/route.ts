import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("video") as File | null;
    const platforms = formData.get("platforms")?.toString() || "";

    if (!file) {
      return NextResponse.json({ error: "No video uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadedFile = await toFile(buffer, file.name || "video.mp4", {
      type: file.type || "video/mp4",
    });

    const transcription = await openai.audio.transcriptions.create({
      file: uploadedFile,
      model: "whisper-1",
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `
You are LinkAI, an expert AI social media strategist.

Analyze this uploaded video based on its real transcript.

Platforms selected: ${platforms}

Transcript:
${transcription.text}

Return ONLY valid JSON:
{
  "detectedTopic": "",
  "detectedNiche": "",
  "videoSummary": "",
  "hooks": ["", "", "", "", ""],
  "caption": "",
  "hashtags": ["", "", "", "", "", "", "", "", "", ""],
  "analysis": "",
  "platformTips": {
    "instagram": "",
    "facebook": "",
    "tiktok": "",
    "youtube": ""
  }
}

Make everything specific to the actual video transcript. No generic advice.
`,
        },
      ],
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0]?.message?.content || "{}")
    );
  } catch (error: any) {
    console.error("VIDEO ANALYSIS ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Video analysis failed." },
      { status: 500 }
    );
  }
}