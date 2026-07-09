import ScheduledPostsList from "@/components/ScheduledPostsList";

export default function PublishingPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Publishing
          </h1>

          <p className="text-gray-400 mt-2">
            Manage scheduled, processing, posted, and failed posts.
          </p>

          <a
            href="/dashboard"
            className="inline-block mt-4 bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold"
          >
            ← Back to Dashboard
          </a>
        </div>

        <ScheduledPostsList />
      </div>
    </main>
  );
}