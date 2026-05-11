"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const [plan, setPlan] = useState("free");

  const { data: session } = useSession();

  async function loadUserPlan() {
    const res = await fetch("/api/user");
    const data = await res.json();

    if (data.plan) {
      setPlan(data.plan);
    }
  }

  useEffect(() => {
    if (session) {
      loadUserPlan();
    }
  }, [session]);

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
      <section
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#111827",
            border: "1px solid #334155",
            borderRadius: "20px",
            padding: "32px",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              marginBottom: "10px",
            }}
          >
            LinkAI 🚀
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: "18px",
              marginBottom: "24px",
            }}
          >
            AI-powered creator growth platform for captions, trends,
            hooks, scheduling, and social media automation.
          </p>

          {session ? (
            <div>
              <p style={{ color: "#cbd5e1" }}>
                Signed in as{" "}
                <strong>{session.user?.email}</strong>
              </p>

              <div
                style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background:
                    plan === "premium"
                      ? "#14532d"
                      : "#334155",
                  color:
                    plan === "premium"
                      ? "#86efac"
                      : "#cbd5e1",
                  fontWeight: "bold",
                  marginTop: "10px",
                  marginBottom: "20px",
                }}
              >
                {plan === "premium"
                  ? "Premium Plan"
                  : "Free Plan"}
              </div>

              <br />

              <button
                onClick={() => signOut()}
                style={secondaryButton}
              >
                Sign Out
              </button>

              {plan !== "premium" && (
                <button
                  style={{
                    ...primaryButton,
                    marginLeft: "12px",
                  }}
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              style={primaryButton}
            >
              Sign in with YouTube
            </button>
          )}
        </div>

        <div style={card}>
          <h2 style={sectionTitle}>
            AI Content Tools
          </h2>

          <ul
            style={{
              color: "#cbd5e1",
              lineHeight: "2",
            }}
          >
            <li>✅ AI-generated captions</li>
            <li>✅ Trending hashtag recommendations</li>
            <li>✅ Viral hook generation</li>
            <li>✅ Content idea suggestions</li>
            <li>✅ Smart posting strategies</li>
            <li>✅ Social media scheduling</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={sectionTitle}>
            TikTok Integration
          </h2>

          <p
            style={{
              color: "#cbd5e1",
              marginBottom: "20px",
              lineHeight: "1.8",
            }}
          >
            Connect your TikTok account to manage content,
            analyze trends, generate viral hooks, and
            streamline publishing workflows directly inside
            LinkAI.
          </p>

          <button
            style={{
              background: "#ec4899",
              color: "white",
              border: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Connect TikTok
          </button>
        </div>

        <div style={card}>
          <h2 style={sectionTitle}>
            Trending Hook Intelligence
          </h2>

          <div style={trendCard}>
            <h3>🔥 Trending Hook</h3>

            <p style={{ color: "#cbd5e1" }}>
              “Nobody talks about this AI trick but it
              completely changed my content results...”
            </p>
          </div>

          <div style={trendCard}>
            <h3>📈 Trending Hashtags</h3>

            <p style={{ color: "#cbd5e1" }}>
              #viral #fyp #contentcreator #aitools
              #growthtips
            </p>
          </div>

          <div style={trendCard}>
            <h3>🎥 Video Idea</h3>

            <p style={{ color: "#cbd5e1" }}>
              “3 mistakes creators make before posting
              content”
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

const primaryButton = {
  background: "#6366f1",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryButton = {
  background: "#1e293b",
  color: "white",
  border: "1px solid #475569",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const card = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: "20px",
  padding: "28px",
  marginBottom: "24px",
};

const sectionTitle = {
  fontSize: "28px",
  marginBottom: "20px",
};

const trendCard = {
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: "14px",
  padding: "18px",
  marginBottom: "16px",
};