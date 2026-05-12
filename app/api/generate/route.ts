import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { niche, platform } = await req.json();

    const prompt = `
Create viral content for ${platform} in the ${niche} niche.

Return ONLY valid JSON with this exact structure:
{
  "hooks": [
    "hook 1",
    "hook 2",
    "hook 3",
    "hook 4",
    "hook 5"
  ],
  "caption": "one optimized caption for ${platform}",
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

Make the content feel native to ${platform}.
If platform is YouTube, focus on Shorts titles, strong openings, and searchable ideas.
If platform is TikTok, focus on fast hooks, trends, and curiosity.
If platform is Instagram, focus on Reels, aesthetic captions, and shareable ideas.
If platform is Facebook, focus on engagement, relatability, and community-style posts.
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
      ideas: data.ideas || [],
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
        "Create smarter, grow faster, and turn your ideas into content that performs. 🚀",
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
      ideas: [
        "Show a before and after transformation.",
        "Explain one mistake beginners make.",
        "Share a behind-the-scenes moment.",
        "React to a trending topic in your niche.",
        "Teach one simple tip in under 30 seconds.",
      ],
    });
  }
}