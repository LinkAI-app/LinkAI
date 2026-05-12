import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { niche } = await req.json();

    const prompt = `
    Create:
    - 5 viral TikTok hooks
    - 1 viral caption
    - 10 trending hashtags

    For this niche: ${niche}

    Respond ONLY in JSON format like:
    {
      "hooks": [],
      "caption": "",
      "hashtags": []
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = completion.choices[0].message.content || "{}";

    return Response.json(JSON.parse(text));
  } catch (error) {
    console.log(error);

    return Response.json({
      hooks: [],
      caption: "",
      hashtags: [],
    });
  }
}