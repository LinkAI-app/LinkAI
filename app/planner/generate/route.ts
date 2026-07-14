import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type PlannerRequest = {
  platform?: string;
  niche?: string;
  days?: number;
  tone?: string;
  goal?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PlannerRequest;

    const platform = body.platform?.trim() || "instagram";
    const niche = body.niche?.trim();
    const tone = body.tone?.trim() || "Educational";
    const goal = body.goal?.trim() || "Grow followers";

    const days = Math.min(Math.max(Number(body.days) || 7, 1), 30);

    if (!niche) {
      return NextResponse.json(
        { error: "Please enter an industry or niche." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in Vercel." },
        { status: 500 }
      );
    }

    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        posts: {
          type: "array",
          minItems: days,
          maxItems: days,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              day: {
                type: "integer",
              },
              title: {
                type: "string",
              },
              hook: {
                type: "string",
              },
              caption: {
                type: "string",
              },
              hashtags: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              suggested_time: {
                type: "string",
                description: "Suggested local posting time in HH:MM format.",
              },
              content_type: {
                type: "string",
              },
              call_to_action: {
                type: "string",
              },
            },
            required: [
              "day",
              "title",
              "hook",
              "caption",
              "hashtags",
              "suggested_time",
              "content_type",
              "call_to_action",
            ],
          },
        },
      },
      required: ["posts"],
    };

    const prompt = `
Create a ${days}-day social media content plan.

Platform: ${platform}
Industry or niche: ${niche}
Tone: ${tone}
Primary goal: ${goal}

Requirements:
- Return exactly ${days} posts.
- Every post must be meaningfully different.
- Write platform-appropriate content.
- Include a strong opening hook.
- Include a finished caption.
- Include 5 to 10 relevant hashtags without duplicates.
- Include a clear call to action.
- Suggest a local posting time in 24-hour HH:MM format.
- Do not claim guaranteed results.
- Do not include markdown.
`;

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                "You are an expert social media strategist. Produce practical, varied, ready-to-use content plans.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "content_plan",
              strict: true,
              schema,
            },
          },
        }),
      }
    );

    const responseData = await openAIResponse.json();

    if (!openAIResponse.ok) {
      console.error("OpenAI planner error:", responseData);

      return NextResponse.json(
        {
          error:
            responseData?.error?.message ||
            "The AI content plan could not be generated.",
        },
        { status: openAIResponse.status }
      );
    }

    const outputText = responseData.output_text;

    if (!outputText) {
      console.error("Missing OpenAI output text:", responseData);

      return NextResponse.json(
        { error: "The AI returned an empty content plan." },
        { status: 500 }
      );
    }

    const plan = JSON.parse(outputText);

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Planner route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Content plan generation failed.",
      },
      { status: 500 }
    );
  }
}