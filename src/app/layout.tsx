import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetAI — AI-Powered Meeting Intelligence",
  description: "Real-time AI assistant that listens, understands, and summarizes your meetings and lectures. Extract key points, action items, and decisions automatically.",
  keywords: "AI meeting notes, meeting transcription, lecture notes, action items, meeting summary",
  openGraph: {
    title: "MeetAI — AI-Powered Meeting Intelligence",
    description: "Never miss what matters. MeetAI listens, understands, and summarizes your meetings in real-time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
