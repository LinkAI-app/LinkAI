"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("saved_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setContent(data || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold">
              LinkAI Dashboard 🚀
            </h1>

            <p className="text-gray-400 mt-2">
              Your saved AI content
            </p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 rounded-xl font-bold"
          >
            Logout
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : content.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">
              No saved content yet
            </h2>

            <p className="text-gray-400">
              Generate and save content from the homepage.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {content.map((item, index) => (
              <div
                key={index}
                className="border border-zinc-800 rounded-2xl p-6 bg-zinc-950"
              >
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="bg-pink-600 px-3 py-1 rounded-full text-sm">
                    {item.platform}
                  </div>

                  <div className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                    {item.niche}
                  </div>

                  <div className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                    {item.language}
                  </div>
                </div>

                {item.content?.hooks && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-3">
                      Viral Hooks
                    </h3>

                    <div className="space-y-3">
                      {item.content.hooks.map(
                        (hook: string, i: number) => (
                          <div
                            key={i}
                            className="bg-zinc-900 p-4 rounded-xl"
                          >
                            {hook}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {item.content?.caption && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-3">
                      Caption
                    </h3>

                    <div className="bg-zinc-900 p-4 rounded-xl">
                      {item.content.caption}
                    </div>
                  </div>
                )}

                {item.content?.hashtags && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-3">
                      Hashtags
                    </h3>

                    <div className="flex flex-wrap gap-3">
                      {item.content.hashtags.map(
                        (tag: string, i: number) => (
                          <div
                            key={i}
                            className="bg-pink-600 px-4 py-2 rounded-full"
                          >
                            #{tag.replace("#", "")}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {item.content?.analysis && (
                  <div>
                    <h3 className="text-xl font-bold mb-3">
                      Video Analysis
                    </h3>

                    <div className="bg-zinc-900 p-4 rounded-xl whitespace-pre-line">
                      {item.content.analysis}
                    </div>
                  </div>
                )}

                <div className="text-gray-500 text-sm mt-6">
                  Saved on{" "}
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}