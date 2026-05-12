import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { niche } = await req.json();

    const prompt = `
Create viral social media content for the niche: ${niche}.

Return ONLY valid JSON with this exact structure:
{
  "hooks": [
    "hook 1",
    "hook 2",
    "hook 3",
    "hook 4",
    "hook 5"
  ],
  "caption": "one viral caption",
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
    });
  } catch (error) {
    console.error("AI GENERATE ERROR:", error);

    return NextResponse.json({
      hooks: [
        "Nobody talks about this creator growth hack...",
        "This changed the way I create content forever.",
        "Stop scrolling if you want more views.",
        "Here’s the secret creators use to go viral.",
        "I wish I knew this before posting online.",
      ],
      caption:
        "If you want to grow faster, start creating smarter — not harder. 🚀",
      hashtags: [
        "viral",
        "fyp",
        "contentcreator",
        "aitools",
        "growth",
        "socialmedia",
        "creator",
        "marketing",
        "trending",
        "linkai",
      ],
    });
  }
}