import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const platform = formData.get("platform") as string;
    const niche = formData.get("niche") as string;
    const language = formData.get("language") as string;
    const video = formData.get("video") as File;

    if (!video) {
      return NextResponse.json(
        { error: "No video uploaded" },
        { status: 400 }
      );
    }

    const prompt = `
You are LinkAI, an AI video growth coach.

A creator uploaded a video for:
Platform: ${platform}
Niche: ${niche}
Language: ${language}
File name: ${video.name}
File type: ${video.type}
File size: ${Math.round(video.size / 1024 / 1024)} MB

IMPORTANT:
Write everything completely in ${language}.

Since this first version cannot fully watch every video frame yet, analyze the upload context and give strong creator-growth feedback.

Return ONLY valid JSON:
{
  "viralScore": "score from 1-100",
  "analysis": "detailed video improvement analysis",
  "hookFeedback": "feedback about the first 3 seconds",
  "betterHooks": ["hook 1", "hook 2", "hook 3", "hook 4", "hook 5"],
  "caption": "improved caption",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8", "hashtag9", "hashtag10"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3", "improvement 4", "improvement 5"]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content || "{}";

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return NextResponse.json(JSON.parse(cleaned));
  } catch (error: any) {
    console.error("FRAME ANALYSIS ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Frame analysis failed" },
      { status: 500 }
    );
  }
}