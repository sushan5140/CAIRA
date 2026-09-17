"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Video, BarChart2, PlusCircle, User, ShieldCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  // Hide or minimize navbar during full-immersion interview session if desired, or keep lean
  const isInterviewSession = pathname.startsWith("/interview/") && !pathname.endsWith("/new") && !pathname.endsWith("/report");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 p-[1.5px] shadow-sm transition-transform duration-200 group-hover:scale-105">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400 transition-colors group-hover:text-emerald-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                CAIRA
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 font-medium tracking-wider uppercase">
                Interview AI
              </span>
            </div>
          </Link>

          {!isInterviewSession && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800/80">
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
              </Link>
              <Link
                href="/interview/new"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/interview/new"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4" />
                  <span>Setup Interview</span>
                </div>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isInterviewSession && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Session In Progress</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gemini 1.5 Evaluator</span>
          </div>

          <Link
            href="/interview/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-medium shadow-sm transition-all hover:shadow-indigo-500/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Interview</span>
          </Link>

          <Link
            href="/login"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            title="Account / Login"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
