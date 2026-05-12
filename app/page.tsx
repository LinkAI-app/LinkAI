"use client";

import { useState } from "react";

export default function Home() {
  const [platform, setPlatform] = useState("TikTok");
  const [niche, setNiche] = useState("Fashion");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [video, setVideo] = useState<File | null>(null);

  const generateContent = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          niche,
          language,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const analyzeVideo = async () => {
    if (!video) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("video", video);
      formData.append("platform", platform);
      formData.append("language", language);

      const response = await fetch("/api/analyze-video", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-5xl font-bold mb-2">LinkAI 🚀</h1>

      <p className="text-gray-400 mb-8">
        AI content tools for creators.
      </p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {["TikTok", "YouTube", "Instagram", "Facebook"].map((item) => (
          <button
            key={item}
            onClick={() => setPlatform(item)}
            className={`p-4 rounded-xl border ${
              platform === item
                ? "bg-pink-600 border-pink-600"
                : "border-gray-700"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="block mb-2">Choose your niche</label>

        <select
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700"
        >
          <option>Fashion</option>
          <option>Fitness</option>
          <option>Gaming</option>
          <option>Business</option>
          <option>Lifestyle</option>
          <option>Motivation</option>
          <option>Beauty</option>
          <option>Tech</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2">Choose language</label>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700"
        >
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>Portuguese</option>
          <option>Italian</option>
          <option>German</option>
          <option>Arabic</option>
          <option>Hindi</option>
          <option>Chinese</option>
          <option>Japanese</option>
          <option>Korean</option>
        </select>
      </div>

      <button
        onClick={generateContent}
        className="w-full bg-white text-black p-4 rounded-xl font-bold mb-6"
      >
        {loading ? "Generating..." : "Generate Viral Content"}
      </button>

      <div className="mb-6">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setVideo(e.target.files[0]);
            }
          }}
          className="mb-4"
        />

        <button
          onClick={analyzeVideo}
          className="w-full bg-pink-600 p-4 rounded-xl font-bold"
        >
          Analyze My Video
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          {results.hooks && (
            <div className="border border-zinc-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">
                Viral Hooks
              </h2>

              <div className="space-y-3">
                {results.hooks.map((hook: string, index: number) => (
                  <div
                    key={index}
                    className="bg-zinc-900 p-4 rounded-xl"
                  >
                    {hook}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.hashtags && (
            <div className="border border-zinc-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">
                Trending Hashtags
              </h2>

              <div className="flex flex-wrap gap-3">
                {results.hashtags.map(
                  (tag: string, index: number) => (
                    <div
                      key={index}
                      className="bg-pink-600 px-4 py-2 rounded-full"
                    >
                      {tag}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {results.analysis && (
            <div className="border border-zinc-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">
                AI Video Analysis
              </h2>

              <p className="text-gray-300 whitespace-pre-line">
                {results.analysis}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}