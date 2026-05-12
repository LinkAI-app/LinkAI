import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { platform, niche, videoName } = await req.json();

    const prompt = `
You are LinkAI, an AI video growth coach.

Analyze this uploaded creator video based on:
Platform: ${platform}
Niche: ${niche}
Video file name: ${videoName}

Give feedback as JSON only:
{
  "viralScore": "score from 1-100",
  "hookFeedback": "",
  "betterHooks": [],
  "caption": "",
  "hashtags": [],
  "cta": "",
  "improvements": []
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content || "{}";

    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json(JSON.parse(cleaned));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Video analysis failed" },
      { status: 500 }
    );
  }
}