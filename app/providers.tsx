"use client";

import { SessionProvider } from "next-auth/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Language = "en" | "es";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");

    if (savedLanguage === "en" || savedLanguage === "es") {
      setLanguageState(savedLanguage);
    }
  }, []);

  function setLanguage(newLanguage: Language) {
    setLanguageState(newLanguage);
    localStorage.setItem("language", newLanguage);
    document.documentElement.lang = newLanguage;
  }

  return (
    <SessionProvider>
      <LanguageContext.Provider
        value={{
          language,
          setLanguage,
        }}
      >
        {children}
      </LanguageContext.Provider>
    </SessionProvider>
  );
}