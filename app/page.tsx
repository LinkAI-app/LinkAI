"use client";

import { useState } from "react";

export default function Home() {
  const [platform, setPlatform] = useState("TikTok");
  const [niche, setNiche] = useState("Fashion");
  const [loading, setLoading] = useState(false);

  const [hooks, setHooks] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<string[]>([]);

  async function generateContent() {
    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niche,
          platform,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setHooks(data.hooks || []);
      setCaption(data.caption || "");
      setHashtags(data.hashtags || []);
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error(error);
      alert("AI request failed.");
    } finally {
      setLoading(false);
    }
  }

  const platforms = [
    "TikTok",
    "YouTube",
    "Instagram",
    "Facebook",
  ];

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">
          LinkAI 🚀
        </h1>

        <p className="text-gray-400 mb-8">
          AI content tools for creators.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {platforms.map((item) => (
            <button
              key={item}
              onClick={() => setPlatform(item)}
              className={`p-4 rounded-xl font-bold transition ${
                platform === item
                  ? "bg-pink-600 text-white"
                  : "bg-zinc-900 text-gray-300 border border-zinc-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
          <p className="mb-3 text-gray-300">
            Choose your niche
          </p>

          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white"
          >
            <option>Fashion</option>
            <option>Fitness</option>
            <option>Beauty</option>
            <option>Gaming</option>
            <option>Business</option>
            <option>Travel</option>
            <option>Motivation</option>
            <option>Food</option>
            <option>Real Estate</option>
            <option>Music</option>
          </select>
        </div>

        <button
          onClick={generateContent}
          disabled={loading}
          className="w-full bg-white text-black font-bold py-4 rounded-xl mb-8 disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : `Generate ${platform} Content`}
        </button>

        {hooks.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-4">
              Viral Hooks
            </h2>

            <div className="space-y-3">
              {hooks.map((hook, index) => (
                <div
                  key={index}
                  className="border border-zinc-700 rounded-xl p-4 flex justify-between items-center gap-4"
                >
                  <p>{hook}</p>

                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(hook)
                    }
                    className="bg-pink-600 px-4 py-2 rounded-lg text-sm"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {caption && (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-4">
              AI Caption
            </h2>

            <p className="text-gray-300">
              {caption}
            </p>
          </div>
        )}

        {hashtags.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-6 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-4">
              Trending Hashtags
            </h2>

            <div className="flex flex-wrap gap-3">
              {hashtags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-pink-600 px-4 py-2 rounded-full"
                >
                  #{tag.replace("#", "")}
                </div>
              ))}
            </div>
          </div>
        )}

        {ideas.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-4">
              Viral Video Ideas
            </h2>

            <div className="space-y-3">
              {ideas.map((idea, index) => (
                <div
                  key={index}
                  className="border border-zinc-700 rounded-xl p-4"
                >
                  {idea}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}