import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { niche, platform } = await req.json();

    const randomSeed = Math.random().toString(36).substring(2);

    const prompt = `
You are LinkAI, an AI content strategist.

Generate NEW and UNIQUE content every time.

Platform: ${platform}
Niche: ${niche}
Random creative seed: ${randomSeed}

Return ONLY valid JSON:
{
  "hooks": [
    "hook 1",
    "hook 2",
    "hook 3",
    "hook 4",
    "hook 5"
  ],
  "caption": "one optimized caption",
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
  ],
  "ideas": [
    "video idea 1",
    "video idea 2",
    "video idea 3",
    "video idea 4",
    "video idea 5"
  ]
}

Rules:
- Do not repeat generic hooks.
- Make hooks specific to ${platform}.
- Make ideas specific to ${niche}.
- Use different angles each time.
- Avoid repeating previous common phrases.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.1,
      presence_penalty: 0.8,
      frequency_penalty: 0.8,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content || "{}";

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(cleaned);

    return NextResponse.json({
      hooks: data.hooks || [],
      caption: data.caption || "",
      hashtags: data.hashtags || [],
      ideas: data.ideas || [],
    });
  } catch (error: any) {
    console.error("AI GENERATE ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "AI generation failed",
        hooks: [],
        caption: "",
        hashtags: [],
        ideas: [],
      },
      { status: 500 }
    );
  }
}