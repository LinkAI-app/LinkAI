"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SchedulePostForm() {
  const [platforms, setPlatforms] = useState<string[]>([
    "instagram",
    "facebook",
    "tiktok",
    "youtube",
  ]);

  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [success, setSuccess] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const availablePlatforms = [
    { id: "instagram", label: "Instagram" },
    { id: "facebook", label: "Facebook" },
    { id: "tiktok", label: "TikTok" },
    { id: "youtube", label: "YouTube" },
  ];

  function togglePlatform(platform: string) {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  }

  async function uploadVideo() {
    if (!videoFile) {
      alert("Please upload a video first.");
      return null;
    }

    const fileName = `${Date.now()}-${videoFile.name}`;

    const { error } = await supabase.storage
      .from("scheduled-videos")
      .upload(fileName, videoFile);

    if (error) {
      console.error(error);
      alert("Video upload failed.");
      return null;
    }

    const { data } = supabase.storage
      .from("scheduled-videos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function analyzeVideo() {
    if (!videoFile) {
      alert("Please upload a video first.");
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: platforms.join(", "),
          niche: "Social Media",
          language: "English",
          videoName: videoFile.name,
        }),
      });

      const data = await response.json();

      setAnalysis(data);

      if (data.caption) {
        setCaption(data.caption);
      } else if (data.analysis) {
        setCaption(data.analysis.slice(0, 220));
      }
    } catch (error) {
      console.error(error);
      alert("AI video analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setSuccess("");

    try {
      const uploadedUrl = await uploadVideo();

      if (!uploadedUrl) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/schedule-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platforms,
          caption,
          media_url: uploadedUrl,
          scheduled_for: scheduledFor,
        }),
      });

      const data = await res.json();

      if (data.posts) {
        setSuccess("Video scheduled across selected platforms ✅");
        setCaption("");
        setMediaUrl("");
        setVideoFile(null);
        setScheduledFor("");
        setAnalysis(null);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Scheduling failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-2">
        Schedule Video Across Platforms
      </h2>

      <p className="text-gray-400 mb-6">
        Upload a video, let AI generate better hooks, captions, and hashtags,
        then schedule it to multiple platforms.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availablePlatforms.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => togglePlatform(item.id)}
              className={`p-3 rounded-xl border font-bold ${
                platforms.includes(item.id)
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 border-transparent"
                  : "bg-black/30 border-white/10 text-gray-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="block text-sm text-gray-300 mb-2">
            Upload Video
          </span>

          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setVideoFile(e.target.files[0]);
              }
            }}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-4"
          />
        </label>

        <button
          type="button"
          onClick={analyzeVideo}
          disabled={analyzing || !videoFile}
          className="bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {analyzing ? "Analyzing Video..." : "Analyze Video with AI"}
        </button>

        {analysis && (
          <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-4">
            <h3 className="text-xl font-bold">AI Video Analysis</h3>

            {analysis.hooks && analysis.hooks.length > 0 && (
              <div>
                <p className="font-bold mb-2">Better Hooks:</p>
                <div className="space-y-2">
                  {analysis.hooks.map((hook: string, index: number) => (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/10 rounded-lg p-3"
                    >
                      {hook}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.caption && (
              <div>
                <p className="font-bold mb-2">Suggested Caption:</p>
                <p className="text-gray-300">{analysis.caption}</p>
              </div>
            )}

            {analysis.hashtags && analysis.hashtags.length > 0 && (
              <div>
                <p className="font-bold mb-2">Hashtags:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.hashtags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="bg-purple-600 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag.replace("#", "")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.analysis && (
              <div>
                <p className="font-bold mb-2">Improvement Notes:</p>
                <p className="text-gray-300 whitespace-pre-line">
                  {analysis.analysis}
                </p>
              </div>
            )}
          </div>
        )}

        <textarea
          placeholder="Write or edit your caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4 min-h-[120px]"
        />

        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4"
        />

        <button
          type="submit"
          disabled={loading || !videoFile}
          className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? "Scheduling..." : "Schedule Video to Selected Platforms"}
        </button>

        {success && (
          <p className="text-green-400 font-medium">
            {success}
          </p>
        )}
      </form>
    </div>
  );
}