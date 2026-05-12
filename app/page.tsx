"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [caption, setCaption] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<string[]>([]);

  const generateContent = () => {
    setCaption(
      "POV: You finally found the AI tool that makes content creation easier 🚀"
    );

    setHooks([
      "Nobody talks about this growth strategy...",
      "This changed the way I create content forever.",
      "Stop scrolling if you want more views.",
      "Here’s the secret creators use to go viral.",
      "I wish I knew this earlier..."
    ]);

    setHashtags([
      "#fyp",
      "#viral",
      "#contentcreator",
      "#tiktokgrowth",
      "#socialmedia",
      "#ai",
      "#entrepreneur",
      "#reels"
    ]);

    setIdeas([
      "Show a before vs after using AI captions.",
      "Record your content creation process.",
      "Explain one creator mistake nobody talks about.",
      "React to a trending TikTok strategy.",
      "Create a short motivational entrepreneur reel."
    ]);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-3">
          Welcome to LinkAI 🚀
        </h1>

        <p className="text-gray-400 mb-10 text-lg">
          AI-powered tools for creators, influencers, and brands.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            className="bg-[#fe2c55] text-white p-5 rounded-2xl text-lg font-semibold hover:opacity-90 transition"
            onClick={() =>
              alert("TikTok connected successfully")
            }
          >
            Connect TikTok
          </button>

          <button
            className="bg-white text-black p-5 rounded-2xl text-lg font-semibold hover:opacity-90 transition"
            onClick={generateContent}
          >
            Generate Viral Content
          </button>
        </div>

        {caption && (
          <div className="bg-[#111] p-6 rounded-2xl mb-6 border border-gray-800">
            <h2 className="text-2xl font-bold mb-3">
              AI Caption
            </h2>

            <p className="text-gray-300">{caption}</p>
          </div>
        )}

        {hooks.length > 0 && (
          <div className="bg-[#111] p-6 rounded-2xl mb-6 border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">
              Trending Hooks
            </h2>

            <div className="space-y-3">
              {hooks.map((hook, index) => (
                <div
                  key={index}
                  className="bg-black p-4 rounded-xl border border-gray-700"
                >
                  {hook}
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
                  className="bg-black p-4 rounded-xl border border-gray-700"
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