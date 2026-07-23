import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkAI",
  description: "AI-powered social media platform",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#050816] text-white antialiased">
        {children}
      </body>
    </html>
  );
}