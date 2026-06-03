"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SchedulePostForm() {
  const [platforms, setPlatforms] = useState<string[]>([
    "instagram",
    "facebook",
    "tiktok",
    "youtube",
  ]);

  const [user, setUser] = useState<any>(null);
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [success, setSuccess] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  function getLocalDateParts(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour24 = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, "0");

    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? "PM" : "AM";

    return {
      date: `${year}-${month}-${day}`,
      time24: `${String(hour24).padStart(2, "0")}:${minute}`,
      time12: `${hour12}:${minute} ${ampm}`,
    };
  }

  function parseTimeTo24Hour(time: string) {
    const clean = time.trim().toUpperCase();

    if (timeFormat === "24h") {
      const match = clean.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return null;

      const hour = Number(match[1]);
      const minute = Number(match[2]);

      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

      return { hour, minute };
    }

    const match = clean.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const period = match[3];

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return { hour, minute };
  }

  function switchTimeFormat(format: "12h" | "24h") {
    const parsed = parseTimeTo24Hour(scheduleTime);

    if (!parsed) {
      const parts = getLocalDateParts();
      setTimeFormat(format);
      setScheduleTime(format === "12h" ? parts.time12 : parts.time24);
      return;
    }

    const tempDate = new Date();
    tempDate.setHours(parsed.hour);
    tempDate.setMinutes(parsed.minute);

    const parts = getLocalDateParts(tempDate);
    setTimeFormat(format);
    setScheduleTime(format === "12h" ? parts.time12 : parts.time24);
  }

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    const parts = getLocalDateParts();
    setScheduleDate(parts.date);
    setScheduleTime(parts.time12);

    getUser();
  }, []);

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

    const formData = new FormData();
    formData.append("video", videoFile);

    const res = await fetch("/api/upload-video", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return null;
    }

    return data.url;
  }

  async function analyzeVideo() {
    if (!videoFile) {
      alert("Please upload a video first.");
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    try {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Could not load video."));
      });

      const duration = video.duration || 1;
      const captureTimes = [
        duration * 0.1,
        duration * 0.3,
        duration * 0.5,
        duration * 0.7,
        duration * 0.9,
      ];

      const formData = new FormData();
      formData.append("platforms", platforms.join(", "));

      for (let i = 0; i < captureTimes.length; i++) {
        video.currentTime = captureTimes[i];

        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
        });

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.8)
        );

        if (blob) {
          formData.append("frames", blob, `frame-${i}.jpg`);
        }
      }

      URL.revokeObjectURL(video.src);

      const response = await fetch("/api/analyze-video", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setAnalysis(data);

      if (data.caption) {
        setCaption(data.caption);
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "AI video analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    if (!user?.email) {
      alert("User email is missing. Please log out and log back in.");
      return;
    }

    if (!videoFile) {
      alert("Please upload a video first.");
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      alert("Please choose a schedule date and time.");
      return;
    }

    const dateMatch = scheduleDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const parsedTime = parseTimeTo24Hour(scheduleTime);

    if (!dateMatch || !parsedTime) {
      alert(
        timeFormat === "12h"
          ? "Use date format YYYY-MM-DD and time like 6:30 PM."
          : "Use date format YYYY-MM-DD and time like 18:30."
      );
      return;
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);

    const scheduledDate = new Date(
      year,
      month - 1,
      day,
      parsedTime.hour,
      parsedTime.minute
    );

    if (Number.isNaN(scheduledDate.getTime())) {
      alert("Please choose a valid schedule date and time.");
      return;
    }

    const scheduledIso = scheduledDate.toISOString();

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
          scheduled_for: scheduledIso,
          scheduled_time: scheduledIso,
          user_id: user?.id,
          user_email: user?.email,
        }),
      });

      const data = await res.json();

      if (data.posts) {
        const parts = getLocalDateParts();

        setSuccess("Video scheduled across selected platforms ✅");
        setCaption("");
        setMediaUrl("");
        setVideoFile(null);
        setScheduleDate(parts.date);
        setScheduleTime(timeFormat === "12h" ? parts.time12 : parts.time24);
        setAnalysis(null);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Scheduling failed.");
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

      <div className="space-y-4">
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
          <span className="block text-sm text-gray-300 mb-2">Upload Video</span>

          <input
            type="file"
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

        <textarea
          placeholder="Write or edit your caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4 min-h-[120px]"
        />

        <div className="bg-black/30 border border-white/10 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-sm text-gray-300">Schedule Time</p>

            <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => switchTimeFormat("12h")}
                className={`px-3 py-2 text-xs font-bold ${
                  timeFormat === "12h"
                    ? "bg-purple-600 text-white"
                    : "text-gray-400"
                }`}
              >
                Regular
              </button>

              <button
                type="button"
                onClick={() => switchTimeFormat("24h")}
                className={`px-3 py-2 text-xs font-bold ${
                  timeFormat === "24h"
                    ? "bg-purple-600 text-white"
                    : "text-gray-400"
                }`}
              >
                Military
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="YYYY-MM-DD"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
            />

            <input
              type="text"
              placeholder={timeFormat === "12h" ? "6:30 PM" : "18:30"}
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
            />
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Auto-filled with your local time. Use{" "}
            {timeFormat === "12h" ? "regular time like 6:30 PM." : "military time like 18:30."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !videoFile}
          className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? "Scheduling..." : "Schedule Video to Selected Platforms"}
        </button>

        {success && <p className="text-green-400 font-medium">{success}</p>}
      </div>
    </div>
  );
}