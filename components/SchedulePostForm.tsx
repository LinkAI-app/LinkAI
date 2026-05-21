"use client";

import { useState } from "react";

export default function SchedulePostForm() {
  const [platforms, setPlatforms] = useState<string[]>([
    "instagram",
    "facebook",
    "tiktok",
    "youtube",
  ]);
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setSuccess("");

    try {
      const res = await fetch("/api/schedule-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platforms,
          caption,
          media_url: mediaUrl,
          scheduled_for: scheduledFor,
        }),
      });

      const data = await res.json();

      if (data.posts) {
        setSuccess("Post scheduled across selected platforms ✅");
        setCaption("");
        setMediaUrl("");
        setScheduledFor("");
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
        Schedule Across Platforms
      </h2>

      <p className="text-gray-400 mb-6">
        Create one post and schedule it to Instagram, Facebook, TikTok, and YouTube.
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

        <textarea
          placeholder="Write your caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4 min-h-[120px]"
        />

        <input
          type="text"
          placeholder="Media URL"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4"
        />

        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? "Scheduling..." : "Schedule to Selected Platforms"}
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