"use client";

import { useState } from "react";
import { translations } from "@/lib/translations";

export default function Home() {
  const [platform, setPlatform] = useState("TikTok");
  const [niche, setNiche] = useState("Fashion");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [video, setVideo] = useState<File | null>(null);

  const t = translations[language] || translations.English;

  async function generateContent() {
    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform, niche, language }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
      alert("AI request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeVideo() {
    if (!video) {
      alert(t.uploadFirst);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/analyze-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          niche,
          language,
          videoName: video.name,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
      alert("Video analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const platforms = ["TikTok", "YouTube", "Instagram", "Facebook"];

  const languages = [
    "English",
    "Spanish",
    "French",
    "Portuguese",
    "Italian",
    "German",
    "Arabic",
    "Hindi",
    "Chinese",
    "Japanese",
    "Korean",
  ];

  const niches = [
    "Fashion",
    "Fitness",
    "Gaming",
    "Business",
    "Lifestyle",
    "Motivation",
    "Beauty",
    "Tech",
    "Food",
    "Travel",
    "Music",
    "Real Estate",
  ];

  return (
    <main
      className="min-h-screen bg-black text-white p-8"
      dir={language === "Arabic" ? "rtl" : "ltr"}
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">LinkAI 🚀</h1>

        <p className="text-gray-400 mb-8">{t.subtitle}</p>

        <p className="mb-3 text-gray-300">{t.choosePlatform}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {platforms.map((item) => (
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
          <label className="block mb-2">{t.chooseNiche}</label>

          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700"
          >
            {niches.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-2">{t.chooseLanguage}</label>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700"
          >
            {languages.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <button
          onClick={generateContent}
          disabled={loading}
          className="w-full bg-white text-black p-4 rounded-xl font-bold mb-6 disabled:opacity-50"
        >
          {loading ? t.generating : t.generate}
        </button>

        <div className="mb-6">
          <label className="block mb-2">{t.uploadVideo}</label>

          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              if (e.target.files?.[0]) setVideo(e.target.files[0]);
            }}
            className="mb-4"
          />

          <button
            onClick={analyzeVideo}
            disabled={loading}
            className="w-full bg-pink-600 p-4 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? t.analyzing : t.analyze}
          </button>
        </div>

        {results && (
          <div className="space-y-6">
            {results.hooks && (
              <div className="border border-zinc-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">{t.viralHooks}</h2>

                <div className="space-y-3">
                  {results.hooks.map((hook: string, index: number) => (
                    <div key={index} className="bg-zinc-900 p-4 rounded-xl">
                      {hook}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.caption && (
              <div className="border border-zinc-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">Caption</h2>
                <p className="text-gray-300">{results.caption}</p>
              </div>
            )}

            {results.hashtags && (
              <div className="border border-zinc-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">{t.hashtags}</h2>

                <div className="flex flex-wrap gap-3">
                  {results.hashtags.map((tag: string, index: number) => (
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

            {results.analysis && (
              <div className="border border-zinc-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">{t.analysis}</h2>

                <p className="text-gray-300 whitespace-pre-line">
                  {results.analysis}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}