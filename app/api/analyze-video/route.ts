import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import os from "os";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("video") as File | null;
    const platforms = formData.get("platforms")?.toString() || "";

    if (!file) {
      return NextResponse.json(
        { error: "No video uploaded." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempPath = path.join(os.tmpdir(), file.name);
    fs.writeFileSync(tempPath, buffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
    });

    const prompt = `
You are LinkAI, an expert social media strategist.

Analyze this uploaded video based on its transcript.

Platforms selected: ${platforms}

Transcript:
${transcription.text}

Return ONLY valid JSON with this exact shape:
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
- Do NOT make generic social media advice.
- Everything must be based on the actual transcript.
- If the transcript is limited, say what can be inferred and what cannot.
- Hooks must be specific to this exact video.
- Hashtags must be related to the actual topic.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    fs.unlinkSync(tempPath);

    const content = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Video analysis failed." },
      { status: 500 }
    );
  }
}