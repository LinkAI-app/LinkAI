"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("My AI Short 🚀");
  const [description, setDescription] = useState("Uploaded from LinkAI");
  const [hashtags, setHashtags] = useState("");
  const [shortStatus, setShortStatus] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [plan, setPlan] = useState("free");

  const { data: session } = useSession();

  async function loadPosts() {
    const res = await fetch("/api/posts");
    const data = await res.json();
    if (data.posts) setPosts(data.posts);
  }

  async function loadUserPlan() {
    const res = await fetch("/api/user");
    const data = await res.json();
    if (data.plan) setPlan(data.plan);
  }

  useEffect(() => {
    if (session) {
      loadPosts();
      loadUserPlan();
    }
  }, [session]);

  function checkIfShort(videoFile: File) {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);

      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (duration <= 60 && height > width) {
        setShortStatus("✅ Ready for YouTube Shorts");
      } else {
        setShortStatus(
          `⚠️ Not ideal for Shorts: ${Math.round(duration)}s, ${width}x${height}`
        );
      }
    };

    video.src = URL.createObjectURL(videoFile);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={card}>
          <h1 style={{ fontSize: "42px", margin: 0 }}>LinkAI 🚀</h1>
          <p style={{ color: "#cbd5e1", fontSize: "18px" }}>
            Upload once. Schedule smarter. Grow everywhere.
          </p>

          {session ? (
            <div>
              <p style={{ color: "#cbd5e1" }}>
                Signed in as <strong>{session.user?.email}</strong>
              </p>

              <span
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: plan === "premium" ? "#14532d" : "#334155",
                  color: plan === "premium" ? "#86efac" : "#cbd5e1",
                  fontWeight: "bold",
                  marginBottom: "14px",
                }}
              >
                {plan === "premium" ? "Premium Plan" : "Free Plan"}
              </span>

              <br />

              <button onClick={() => signOut()} style={secondaryButton}>
                Sign out
              </button>

              {plan !== "premium" && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/stripe/checkout", {
                        method: "POST",
                      });

                      const data = await res.json();

                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        alert(data.error || "Could not start checkout");
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Checkout failed");
                    }
                  }}
                  style={{ ...primaryButton, marginLeft: "12px" }}
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          ) : (
            <button onClick={() => signIn("google")} style={primaryButton}>
              Sign in with YouTube
            </button>
          )}
        </div>

        <div style={card}>
          <h2>Create Post</h2>

          {plan === "free" && (
            <p style={{ color: "#facc15" }}>
              Free plan: 3 scheduled uploads per day.
            </p>
          )}

          {plan === "premium" && (
            <p style={{ color: "#86efac" }}>
              Premium active: unlimited scheduled uploads.
            </p>
          )}

          <label style={label}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={input}
          />

          <label style={label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            style={textarea}
          />

          <button
            onClick={async () => {
              const res = await fetch("/api/ai/hashtags", {
                method: "POST",
                body: JSON.stringify({ title, description }),
              });

              const data = await res.json();
              setTitle(data.title);
              setDescription(data.description);
              setHashtags(data.hashtags);
            }}
            style={primaryButton}
          >
            Generate AI Caption
          </button>

          <label style={label}>Hashtags</label>
          <textarea
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#shorts #viral #creator"
            style={textarea}
          />

          <label style={label}>Upload Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              if (e.target.files) {
                const f = e.target.files[0];
                setFile(f);
                checkIfShort(f);
              }
            }}
            style={{ marginBottom: "14px" }}
          />

          {shortStatus && <p style={noticeBox}>{shortStatus}</p>}

          <label style={label}>Schedule Time</label>
          <input
            type="datetime-local"
            onChange={(e) => setScheduledTime(e.target.value)}
            style={input}
          />

          <div style={{ marginTop: "16px" }}>
            <button
              onClick={async () => {
                if (!file) return alert("No file selected");

                const fd = new FormData();
                fd.append("file", file);
                fd.append("title", title);
                fd.append("description", description + " " + hashtags);

                const res = await fetch("/api/youtube/upload", {
                  method: "POST",
                  body: fd,
                });

                const data = await res.json();
                alert(`Uploaded: ${data.id}`);
              }}
              style={secondaryButton}
            >
              Upload Now
            </button>

            <button
              onClick={async () => {
                if (!file) return alert("No file selected");
                if (!scheduledTime) return alert("Pick a time first");

                const scheduledIsoTime = new Date(scheduledTime).toISOString();

                const fd = new FormData();
                fd.append("file", file);
                fd.append("title", title);
                fd.append("description", description + " " + hashtags);
                fd.append("scheduledTime", scheduledIsoTime);

                const res = await fetch("/api/schedule", {
                  method: "POST",
                  body: fd,
                });

                const data = await res.json();

                if (data.error) {
                  alert(data.error);
                } else {
                  alert("Scheduled successfully");
                  loadPosts();
                  loadUserPlan();
                }
              }}
              style={{ ...primaryButton, marginLeft: "12px" }}
            >
              Schedule Post
            </button>
          </div>

          {file && (
            <video
              width="100%"
              controls
              style={{
                display: "block",
                marginTop: "20px",
                borderRadius: "12px",
                border: "1px solid #334155",
              }}
            >
              <source src={URL.createObjectURL(file)} />
            </video>
          )}
        </div>

        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>Dashboard</h2>

            <button onClick={loadPosts} style={secondaryButton}>
              Refresh
            </button>
          </div>

          {posts.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No posts yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} style={postCard}>
                <p>
                  <strong>{post.title}</strong>
                </p>

                <p>
                  Status:{" "}
                  <span
                    style={{
                      color:
                        post.status === "posted"
                          ? "#22c55e"
                          : post.status === "failed"
                          ? "#ef4444"
                          : "#facc15",
                    }}
                  >
                    {post.status}
                  </span>
                </p>

                <p style={{ color: "#cbd5e1" }}>
                  Scheduled: {post.scheduled_time}
                </p>

                {post.youtube_video_id && (
                  <a
                    href={`https://www.youtube.com/watch?v=${post.youtube_video_id}`}
                    target="_blank"
                    style={{ color: "#38bdf8" }}
                  >
                    Open YouTube video
                  </a>
                )}

                {post.error_message && (
                  <p style={{ color: "#ef4444" }}>{post.error_message}</p>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

const primaryButton = {
  background: "#6366f1",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryButton = {
  background: "#1e293b",
  color: "white",
  border: "1px solid #475569",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const card = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "24px",
};

const postCard = {
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "14px",
};

const label = {
  display: "block",
  marginTop: "16px",
  marginBottom: "6px",
  color: "#cbd5e1",
};

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
};

const textarea = {
  width: "100%",
  minHeight: "90px",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
};

const noticeBox = {
  background: "#020617",
  border: "1px solid #334155",
  padding: "10px",
  borderRadius: "8px",
  color: "#cbd5e1",
};