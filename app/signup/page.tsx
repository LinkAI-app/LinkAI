"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created. Check your email to confirm your account.");
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white/10 border border-white/10 rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">Create Account</h1>
        <p className="text-gray-300 mb-6">Join LinkAI and save your AI content.</p>

        <input
          className="w-full mb-4 p-4 rounded-xl bg-black border border-purple-500/40"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full mb-6 p-4 rounded-xl bg-black border border-purple-500/40"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signUp}
          className="w-full p-4 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600"
        >
          Sign Up
        </button>
      </div>
    </main>
  );
}