import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { platform, niche, language, videoName } = await req.json();

    const prompt = `
You are LinkAI, an AI video growth coach.

Analyze this uploaded creator video concept.

Platform: ${platform}
Niche: ${niche}
Language: ${language}
Video file name: ${videoName}

IMPORTANT:
Write everything completely in ${language}.
Do not use English unless the selected language is English.

Return ONLY valid JSON with this exact structure:
{
  "analysis": "A detailed but easy-to-understand video analysis with hook feedback, pacing advice, retention advice, caption advice, CTA advice, and what the creator should improve.",
  "hooks": [
    "better hook 1",
    "better hook 2",
    "better hook 3",
    "better hook 4",
    "better hook 5"
  ],
  "hashtags": [
    "hashtag1",
    "hashtag2",
    "hashtag3",
    "hashtag4",
    "hashtag5",
    "hashtag6",
    "hashtag7",
    "hashtag8",
    "hashtag9",
    "hashtag10"
  ]
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

    const data = JSON.parse(cleaned);

    return NextResponse.json({
      analysis: data.analysis || "",
      hooks: data.hooks || [],
      hashtags: data.hashtags || [],
    });
  } catch (error: any) {
    console.error("VIDEO ANALYSIS ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "Video analysis failed",
        analysis: "",
        hooks: [],
        hashtags: [],
      },
      { status: 500 }
    );
  }
}