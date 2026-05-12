"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [niche, setNiche] = useState("Business");
  const [hooks, setHooks] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<string[]>([]);

  const generateHooks = () => {
    const hooksByNiche: any = {
      Business: [
        "Nobody tells entrepreneurs this...",
        "This business strategy changed everything.",
        "If I started over today, I’d do this.",
        "The easiest way to grow online in 2025.",
        "This is why most businesses fail."
      ],

      Fitness: [
        "Stop doing this at the gym.",
        "This workout mistake is ruining your gains.",
        "The fastest way to lose fat naturally.",
        "I wish I knew this fitness hack sooner.",
        "This changed my physique completely."
      ],

      Fashion: [
        "This outfit trick makes you look expensive.",
        "Fashion creators are hiding this secret.",
        "The trend everyone will wear this summer.",
        "This instantly upgrades your style.",
        "POV: your outfit finally looks luxury."
      ],

      Motivation: [
        "You needed to hear this today.",
        "Your future depends on what you do now.",
        "This mindset changed my entire life.",
        "Nobody is coming to save you.",
        "Start before you feel ready."
      ]
    };

    setHooks(hooksByNiche[niche]);

    setHashtags([
      "#viral",
      "#fyp",
      "#trending",
      "#contentcreator",
      "#ai",
      "#growth"
    ]);

    setIdeas([
      `Create a short ${niche} transformation video.`,
      `Share a secret tip about ${niche}.`,
      `React to a trending ${niche} topic.`,
      `Teach beginners something valuable.`,
      `Tell a personal story related to ${niche}.`
    ]);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-3">
          LinkAI 🚀
        </h1>

        <p className="text-gray-400 mb-10 text-lg">
          AI tools for creators who want to grow faster.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <button
            className="bg-[#fe2c55] text-white p-5 rounded-2xl text-lg font-semibold hover:opacity-90 transition"
            onClick={() =>
              alert("TikTok connected successfully")
            }
          >
            Connect TikTok
          </button>

          <div className="bg-[#111] p-5 rounded-2xl border border-gray-800">
            <p className="mb-3 text-gray-300">
              Choose your niche
            </p>

            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
            >
              <option>Business</option>
              <option>Fitness</option>
              <option>Fashion</option>
              <option>Motivation</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateHooks}
          className="w-full bg-white text-black p-5 rounded-2xl text-xl font-bold hover:opacity-90 transition mb-8"
        >
          Generate Viral Content
        </button>

        {hooks.length > 0 && (
          <div className="bg-[#111] p-6 rounded-2xl mb-6 border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">
              Viral Hooks
            </h2>

            <div className="space-y-3">
              {hooks.map((hook, index) => (
                <div
                  key={index}
                  className="bg-black border border-gray-700 p-4 rounded-xl flex justify-between items-center"
                >
                  <span>{hook}</span>

                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(hook)
                    }
                    className="bg-[#fe2c55] px-3 py-1 rounded-lg text-sm"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {hashtags.length > 0 && (
          <div className="bg-[#111] p-6 rounded-2xl mb-6 border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">
              Trending Hashtags
            </h2>

            <div className="flex flex-wrap gap-3">
              {hashtags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-[#fe2c55] px-4 py-2 rounded-full"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        )}

        {ideas.length > 0 && (
          <div className="bg-[#111] p-6 rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">
              Viral Video Ideas
            </h2>

            <div className="space-y-3">
              {ideas.map((idea, index) => (
                <div
                  key={index}
                  className="bg-black border border-gray-700 p-4 rounded-xl"
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