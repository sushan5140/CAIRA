import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CAIRA — AI-Powered Interview Readiness Platform",
  description: "Conduct realistic, role-specific mock interviews powered by Gemini AI with live camera preview, speech recognition, adaptive follow-ups, and in-depth readiness scoring.",
  keywords: ["mock interview", "interview prep", "AI interviewer", "Gemini AI", "career readiness", "technical interview"],
  authors: [{ name: "CAIRA Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200`}>
        {/* Subtle background ambient gradients */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-emerald-600/10 rounded-full blur-[140px]" />
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <Navbar />

        <main className="flex-1 relative z-10">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
