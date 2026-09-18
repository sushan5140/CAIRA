import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

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
      <body className={`${manrope.className} min-h-screen text-slate-900 pb-24 md:pb-0`}>
        <a
          href="#main-content"
          className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-xl bg-[#202941] px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform duration-150 focus:translate-y-0"
        >
          Skip to main content
        </a>

        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 paper-grid opacity-45" />
          <div className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl" />
          <div className="absolute top-[18%] -right-24 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
        </div>

        <Navbar />
        <main id="main-content" tabIndex={-1} className="relative z-10 min-h-[calc(100dvh-76px)] outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
