"use client";

import { useLanguage } from "@/app/providers";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
          language === "en"
            ? "bg-purple-600 text-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        English
      </button>

      <button
        type="button"
        onClick={() => setLanguage("es")}
        className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
          language === "es"
            ? "bg-purple-600 text-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Español
      </button>
    </div>
  );
}