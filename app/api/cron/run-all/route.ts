import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.linkaiapp.ai";

  const results: any = {};

  async function runJob(name: string, path: string) {
    try {
      const res = await fetch(`${appUrl}${path}`);
      const data = await res.json();

      results[name] = {
        ok: res.ok,
        status: res.status,
        data,
      };
    } catch (error: any) {
      results[name] = {
        ok: false,
        error: error.message,
      };
    }
  }

await runJob("retryFailedPosts", "/api/cron/retry-failed-posts");
await runJob("cleanupStuckPosts", "/api/cron/cleanup-stuck-posts");
await runJob("publishInstagram", "/api/cron/publish-instagram");
await runJob("publishTikTok", "/api/cron/publish-tiktok");

  return NextResponse.json({
    message: "All cron jobs completed.",
    results,
  });
}