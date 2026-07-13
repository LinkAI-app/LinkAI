"use client";

import { useState } from "react";

export default function PlannerPage() {
  const [platform, setPlatform] = useState("instagram");
  const [niche, setNiche] = useState("");
  const [days, setDays] = useState(30);
  const [tone, setTone] = useState("Educational");
  const [goal, setGoal] = useState("Grow followers");

  return (
    <main className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent mb-3">
          AI Content Planner
        </h1>

        <p className="text-gray-400 mb-8">
          Generate an entire month's worth of social media content with AI.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">

          <div>
            <label className="block mb-2 font-semibold">
              Platform
            </label>

            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube Shorts</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Industry / Niche
            </label>

            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Fitness, Real Estate, AI, Finance..."
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Days of Content
            </label>

            <input
              type="number"
              value={days}
              min={1}
              max={90}
              onChange={(e) =>
                setDays(Number(e.target.value))
              }
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Tone
            </label>

            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3"
            >
              <option>Educational</option>
              <option>Funny</option>
              <option>Luxury</option>
              <option>Professional</option>
              <option>Motivational</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Goal
            </label>

            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3"
            >
              <option>Grow followers</option>
              <option>Generate leads</option>
              <option>Increase engagement</option>
              <option>Sell products</option>
            </select>
          </div>

          <button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl py-4 font-bold text-lg"
          >
            Generate Monthly Plan
          </button>

        </div>

      </div>
    </main>
  );
}