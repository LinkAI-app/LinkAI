"use client";

import { useState } from "react";

export default function Home() {
  const [platform, setPlatform] = useState("TikTok");
  const [niche, setNiche] = useState("Fashion");
  const [video, setVideo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  async function analyzeVideo() {
    if (!video) return alert("Upload a video first.");

    setLoading(true);

    try {
      const res = await fetch("/api/analyze-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          niche,
          videoName: video.name,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setAnalysis(data);
    } catch {
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const platforms = ["TikTok", "YouTube", "Instagram", "Facebook"];

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">LinkAI 🚀</h1>
        <p className="text-gray-400 mb-8">
          Upload your video and get AI feedback to improve hooks, captions,
          hashtags, and viral potential.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {platforms.map((item) => (
            <button
              key={item}
              onClick={() => setPlatform(item)}
              className={`p-4 rounded-xl font-bold ${
                platform === item
                  ? "bg-pink-600 text-white"
                  : "bg-zinc-900 border border-zinc-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
          <p className="mb-3 text-gray-300">Choose your niche</p>

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

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Upload Video</h2>

          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setVideo(e.target.files[0]);
                setAnalysis(null);
              }
            }}
            className="mb-4"
          />

          {video && (
            <video
              controls
              className="w-full rounded-xl border border-zinc-700 mt-4"
              src={URL.createObjectURL(video)}
            />
          )}
        </div>

        <button
          onClick={analyzeVideo}
          disabled={loading}
          className="w-full bg-white text-black font-bold py-4 rounded-xl mb-8 disabled:opacity-50"
        >
          {loading ? "Analyzing Video..." : "Analyze My Video"}
        </button>

        {analysis && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-3">Viral Score</h2>
              <p className="text-5xl font-bold text-pink-500">
                {analysis.viralScore}/100
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-3">Hook Feedback</h2>
              <p className="text-gray-300">{analysis.hookFeedback}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-3">Better Hooks</h2>
              <div className="space-y-3">
                {analysis.betterHooks?.map((hook: string, i: number) => (
                  <div
                    key={i}
                    className="border border-zinc-700 rounded-xl p-4 flex justify-between gap-4"
                  >
                    <span>{hook}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(hook)}
                      className="bg-pink-600 px-3 py-1 rounded-lg"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-3">Improved Caption</h2>
              <p className="text-gray-300">{analysis.caption}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-3">Hashtags</h2>
              <div className="flex flex-wrap gap-3">
                {analysis.hashtags?.map((tag: string, i: number) => (
                  <span key={i} className="bg-pink-600 px-4 py-2 rounded-full">
                    #{tag.replace("#", "")}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-3">What To Improve</h2>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                {analysis.improvements?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}