"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("My AI Short 🚀");
  const [description, setDescription] = useState("Uploaded from my app");
  const [hashtags, setHashtags] = useState("");
  const [shortStatus, setShortStatus] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const { data: session } = useSession();

  function checkIfShort(videoFile: File) {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);

      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (duration <= 60 && height > width) {
        setShortStatus("✅ Ready for Shorts");
      } else {
        setShortStatus(
          `⚠️ Not ideal. ${Math.round(duration)}s, ${width}x${height}`
        );
      }
    };

    video.src = URL.createObjectURL(videoFile);
  }

  return (
    <main style={{ padding: "20px" }}>
      <h1>LinkAI 🚀</h1>

      {session ? (
        <div>
          <p>Signed in as {session.user?.email}</p>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      ) : (
        <button onClick={() => signIn("google")}>
          Sign in with YouTube
        </button>
      )}

      <br /><br />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />

      <br /><br />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />

      <br /><br />

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
      >
        Generate AI Caption
      </button>

      <br /><br />

      <textarea
        value={hashtags}
        onChange={(e) => setHashtags(e.target.value)}
        placeholder="Hashtags"
      />

      <br /><br />

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
      />

      <br /><br />

      {shortStatus && <p>{shortStatus}</p>}

      <br />

      <input
        type="datetime-local"
        onChange={(e) => {
          setScheduledTime(e.target.value);
        }}
      />

      <br /><br />

      {/* Upload Now */}
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
      >
        Upload Now
      </button>

      <br /><br />

      {/* Schedule Post */}
      <button
        onClick={async () => {
          if (!file) return alert("No file selected");
          if (!scheduledTime) return alert("Pick a time first");

          const fd = new FormData();
          fd.append("file", file); // 🔥 THIS IS THE IMPORTANT LINE
          fd.append("title", title);
          fd.append("description", description + " " + hashtags);
          fd.append("scheduledTime", scheduledTime);

          const res = await fetch("/api/schedule", {
            method: "POST",
            body: fd,
          });

          const data = await res.json();

          if (data.error) {
            alert(data.error);
          } else {
            alert("Scheduled successfully");
          }
        }}
      >
        Schedule Post
      </button>

      <br /><br />

      {file && (
        <video width="300" controls>
          <source src={URL.createObjectURL(file)} />
        </video>
      )}
    </main>
  );
}