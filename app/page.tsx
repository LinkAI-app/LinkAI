"use client";

import { useState } from "react";

export default function Home() {
  const [niche, setNiche] = useState("Fashion");
  const [loading, setLoading] = useState(false);

  const [hooks, setHooks] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  async function generateContent() {
    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ niche }),
      });

      const data = await response.json();

      setHooks(data.hooks || []);
      setCaption(data.caption || "");
      setHashtags(data.hashtags || []);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">
          LinkAI 🚀
        </h1>

        <p className="text-gray-400 mb-8">
          AI tools for creators who want to grow faster.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button className="bg-pink-600 hover:bg-pink-700 p-4 rounded-xl font-semibold">
            Connect TikTok
          </button>

          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"
          >
            <option>Fashion</option>
            <option>Fitness</option>
            <option>Beauty</option>
            <option>Gaming</option>
            <option>Business</option>
            <option>Travel</option>
          </select>
        </div>

        <button
          onClick={generateContent}
          className="w-full bg-white text-black font-bold py-4 rounded-xl mb-8"
        >
          {loading ? "Generating..." : "Generate Viral Content"}
        </button>

        {hooks.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              Viral Hooks
            </h2>

            <div className="space-y-3">
              {hooks.map((hook, index) => (
                <div
                  key={index}
                  className="border border-zinc-700 rounded-xl p-4 flex justify-between items-center"
                >
                  <p>{hook}</p>

                  <button className="bg-pink-600 px-4 py-2 rounded-lg text-sm">
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {caption && (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              Viral Caption
            </h2>

            <p className="text-gray-300">
              {caption}
            </p>
          </div>
        )}

        {hashtags.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">
              Trending Hashtags
            </h2>

            <div className="flex flex-wrap gap-3">
              {hashtags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-pink-600 px-4 py-2 rounded-full"
                >
                  #{tag}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}