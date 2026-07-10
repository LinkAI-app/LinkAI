"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ScheduledPost = {
  id: string;
  platform: string | null;
  caption: string | null;
  title: string | null;
  status: string | null;
  scheduled_time: string | null;
};

export default function CalendarPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("id,platform,caption,title,status,scheduled_time")
      .eq("user_id", user.id)
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error(error);
    }

    setPosts(data || []);
    setLoading(false);
  }

  function formatDateValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getCalendarDays() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array.from({ length: startDay }, () => null);

    const days = Array.from({ length: daysInMonth }, (_, index) => {
      return new Date(year, month, index + 1);
    });

    return [...blanks, ...days];
  }

  const postsByDate = useMemo(() => {
    const grouped: Record<string, ScheduledPost[]> = {};

    for (const post of posts) {
      if (!post.scheduled_time) continue;

      const key = formatDateValue(new Date(post.scheduled_time));

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(post);
    }

    return grouped;
  }, [posts]);

  const selectedPosts = selectedDate ? postsByDate[selectedDate] || [] : [];

  const monthLabel = calendarMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  function platformBadge(platform: string | null) {
    switch (platform?.toLowerCase()) {
      case "instagram":
        return "bg-pink-500/20 text-pink-300 border-pink-400/30";
      case "tiktok":
        return "bg-white/10 text-white border-white/20";
      case "youtube":
        return "bg-red-500/20 text-red-300 border-red-400/30";
      case "facebook":
        return "bg-blue-500/20 text-blue-300 border-blue-400/30";
      default:
        return "bg-white/10 text-gray-300 border-white/10";
    }
  }

  function statusBadge(status: string | null) {
    switch (status) {
      case "posted":
        return "text-green-300";
      case "failed":
        return "text-red-300";
      case "cancelled":
        return "text-gray-400";
      case "processing":
      case "uploading":
        return "text-blue-300";
      default:
        return "text-yellow-300";
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Content Calendar
            </h1>

            <p className="text-gray-400 mt-2">
              View all scheduled and published posts by date.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold"
            >
              ← Dashboard
            </a>

            <a
              href="/publishing"
              className="bg-purple-500/20 border border-purple-400/30 text-purple-300 px-4 py-2 rounded-xl text-sm font-bold"
            >
              Publishing
            </a>
          </div>
        </div>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() - 1,
                    1
                  )
                )
              }
              className="bg-white/10 border border-white/10 px-4 py-2 rounded-xl font-bold"
            >
              ←
            </button>

            <h2 className="text-2xl font-bold">{monthLabel}</h2>

            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() + 1,
                    1
                  )
                )
              }
              className="bg-white/10 border border-white/10 px-4 py-2 rounded-xl font-bold"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs md:text-sm text-gray-500 font-bold"
              >
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <p className="text-gray-400 py-10 text-center">
              Loading calendar...
            </p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {getCalendarDays().map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`blank-${index}`}
                      className="min-h-[110px] rounded-xl"
                    />
                  );
                }

                const dateValue = formatDateValue(day);
                const dayPosts = postsByDate[dateValue] || [];
                const selected = selectedDate === dateValue;

                return (
                  <button
                    type="button"
                    key={dateValue}
                    onClick={() => setSelectedDate(dateValue)}
                    className={`min-h-[110px] rounded-xl border p-2 text-left align-top transition ${
                      selected
                        ? "border-purple-400 bg-purple-500/10"
                        : "border-white/10 bg-black/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="font-bold mb-2">{day.getDate()}</div>

                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          className={`text-[10px] md:text-xs border rounded-md px-2 py-1 truncate ${platformBadge(
                            post.platform
                          )}`}
                        >
                          {post.platform || "Post"}
                        </div>
                      ))}

                      {dayPosts.length > 3 && (
                        <div className="text-[10px] text-gray-500">
                          +{dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">
            {selectedDate
              ? `Posts for ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString()}`
              : "Select a date"}
          </h2>

          {!selectedDate ? (
            <p className="text-gray-400">
              Click any calendar date to view its posts.
            </p>
          ) : selectedPosts.length === 0 ? (
            <p className="text-gray-400">No posts scheduled for this date.</p>
          ) : (
            <div className="space-y-3">
              {selectedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`border rounded-full px-3 py-1 text-xs font-bold capitalize ${platformBadge(
                          post.platform
                        )}`}
                      >
                        {post.platform || "Unknown"}
                      </span>

                      <span
                        className={`text-xs font-bold capitalize ${statusBadge(
                          post.status
                        )}`}
                      >
                        {post.status || "unknown"}
                      </span>
                    </div>

                    <p className="font-bold">
                      {post.title || post.caption || "Scheduled post"}
                    </p>
                  </div>

                  <p className="text-sm text-gray-400">
                    {post.scheduled_time
                      ? new Date(post.scheduled_time).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "No time"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}