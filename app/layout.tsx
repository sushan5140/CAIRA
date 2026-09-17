import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "CAIRA — Interactive AI Interview Practice",
  description:
    "Practice realistic, role-specific interviews with adaptive AI questions, voice and camera support, turn-by-turn coaching, and readiness reports.",
  keywords: [
    "mock interview",
    "interview prep",
    "AI interviewer",
    "Gemini AI",
    "career readiness",
    "technical interview",
  ],
  authors: [{ name: "CAIRA Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.className} min-h-screen text-slate-900 pb-20 md:pb-0`}>
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 paper-grid opacity-45" />
          <div className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl" />
          <div className="absolute top-[18%] -right-24 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
        </div>

        <Navbar />
        <main className="relative z-10 min-h-[calc(100dvh-76px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
