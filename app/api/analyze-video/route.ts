import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const framesRaw = formData.getAll("frames");
    const platforms = formData.get("platforms")?.toString() || "";

    const frames = framesRaw.filter(
      (item): item is File => item instanceof File
    );

    if (!frames.length) {
      return NextResponse.json(
        { error: "No video frames received." },
        { status: 400 }
      );
    }

    const imageInputs = await Promise.all(
      frames.map(async (frame) => {
        const buffer = Buffer.from(await frame.arrayBuffer());
        const base64 = buffer.toString("base64");

        return {
          type: "image_url" as const,
          image_url: {
            url: `data:${frame.type};base64,${base64}`,
          },
        };
      })
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
You are LinkAI, an expert AI social media strategist.

Analyze these frames extracted from an uploaded video.

Platforms selected: ${platforms}

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

Rules:
- Everything must be based on what is visible in the frames.
- Do NOT give generic social media advice.
- If the frames are unclear, say what can and cannot be inferred.
- Hooks must match the actual visible video content.
- Hashtags must match the actual visible topic.
- Caption must be ready to post.
`,
            },
            ...imageInputs,
          ],
        },
      ],
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0]?.message?.content || "{}")
    );
  } catch (error: any) {
    console.error("VISUAL VIDEO ANALYSIS ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Visual video analysis failed." },
      { status: 500 }
    );
  }
}