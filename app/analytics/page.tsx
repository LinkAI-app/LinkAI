"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    processing: 0,
    posted: 0,
    failed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data } = await supabase
      .from("scheduled_posts")
      .select("status");

    const rows = data || [];

    setStats({
      total: rows.length,
      scheduled: rows.filter(p => p.status === "scheduled").length,
      processing: rows.filter(
        p => p.status === "processing" || p.status === "uploading"
      ).length,
      posted: rows.filter(p => p.status === "posted").length,
      failed: rows.filter(p => p.status === "failed").length,
      cancelled: rows.filter(p => p.status === "cancelled").length,
    });
  }

  const cards = [
    { label: "Total Posts", value: stats.total },
    { label: "Scheduled", value: stats.scheduled },
    { label: "Processing", value: stats.processing },
    { label: "Published", value: stats.posted },
    { label: "Failed", value: stats.failed },
    { label: "Cancelled", value: stats.cancelled },
  ];

  return (
    <main className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Analytics
          </h1>

          <p className="text-gray-400 mt-2">
            View publishing performance across all connected platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-5">
          {cards.map(card => (
            <div
              key={card.label}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <p className="text-gray-400 text-sm">
                {card.label}
              </p>

              <p className="text-4xl font-bold mt-2">
                {card.value}
              </p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}