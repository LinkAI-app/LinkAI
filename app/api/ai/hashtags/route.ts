import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();

    const prompt = `
Create a viral YouTube Shorts caption package.

Return ONLY valid JSON like this:
{
  "title": "short catchy title with #shorts",
  "description": "engaging description with call to action",
  "hashtags": "#shorts #viral #example"
}

Original title: ${title}
Original description: ${description}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0].message.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      title: "My AI Short 🚀 #shorts",
      description: "Watch this and tell me what you think!",
      hashtags: "#shorts #viral #trending #ai",
    });
  }
}