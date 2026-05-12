import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { niche, platform, language } = await req.json();

    const prompt = `
You are LinkAI, an AI content strategist.

Generate content for:
Platform: ${platform}
Niche: ${niche}
Language: ${language}

IMPORTANT:
All output must be written completely in ${language}.
Do not use English unless the selected language is English.

Return ONLY valid JSON:
{
  "hooks": ["hook 1", "hook 2", "hook 3", "hook 4", "hook 5"],
  "caption": "one optimized caption",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8", "hashtag9", "hashtag10"]
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
      { error: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}