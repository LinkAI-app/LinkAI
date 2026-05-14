import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkAI",
  description: "AI tools for creators",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}