import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import os from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

function extractAudio(videoPath: string, audioPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .format("mp3")
      .save(audioPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
}

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

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const videoPath = path.join(os.tmpdir(), `${Date.now()}-${safeName}`);
    const audioPath = path.join(os.tmpdir(), `${Date.now()}-audio.mp3`);

    fs.writeFileSync(videoPath, buffer);

    await extractAudio(videoPath, audioPath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });

    const prompt = `
You are LinkAI, an expert AI social media strategist.

Analyze this uploaded video based on the actual transcript.

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
- Everything must be based on the actual transcript.
- Do NOT give generic social media advice.
- If the transcript is short or unclear, say what can and cannot be inferred.
- Hooks must match the actual video content.
- Caption must be ready to post.
- Hashtags must match the actual topic.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

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