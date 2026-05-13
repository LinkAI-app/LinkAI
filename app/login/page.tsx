"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white/10 border border-white/10 rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
        <p className="text-gray-300 mb-6">Log in to your LinkAI account.</p>

        <input
          className="w-full mb-4 p-4 rounded-xl bg-black border border-blue-500/40"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full mb-6 p-4 rounded-xl bg-black border border-blue-500/40"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full p-4 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600"
        >
          Log In
        </button>
      </div>
    </main>
  );
}