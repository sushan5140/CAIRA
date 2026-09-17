import Link from "next/link";
import { Sparkles, Bot, Shield, Terminal, ArrowUpRight, Cpu, Radio, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 text-slate-400 backdrop-blur-xl no-print">
      {/* Top ambient highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">CAIRA</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  AI INTERVIEWER
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              An intelligent, role-adaptive mock interview readiness platform powered by Google Gemini AI. Practice with live camera preview, real-time voice transcription, adaptive follow-up questioning, and objective STAR rubric evaluation.
            </p>

            {/* Live Platform Operational Status */}
            <div className="pt-1 flex items-center gap-2 text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium text-emerald-400/90">
                Adaptive evaluation + offline fallback ready
              </span>
            </div>
          </div>

          {/* Practice Tracks */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Role Tracks
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/interview/new" className="hover:text-indigo-300 transition-colors">
                  Senior Full-Stack Engineer
                </Link>
              </li>
              <li>
                <Link href="/interview/new" className="hover:text-indigo-300 transition-colors">
                  Frontend & React Architect
                </Link>
              </li>
              <li>
                <Link href="/interview/new" className="hover:text-indigo-300 transition-colors">
                  Backend & Distributed Systems
                </Link>
              </li>
              <li>
                <Link href="/interview/new" className="hover:text-indigo-300 transition-colors">
                  Machine Learning & AI Engineer
                </Link>
              </li>
              <li>
                <Link href="/interview/new" className="hover:text-indigo-300 transition-colors">
                  Engineering Manager & Tech Lead
                </Link>
              </li>
              <li>
                <Link href="/interview/new" className="hover:text-indigo-300 transition-colors">
                  Technical Product Manager
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Platform
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/interview/new" className="hover:text-indigo-300 transition-colors">
                  Interactive Mock Room
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-300 transition-colors">
                  Performance Dashboard
                </Link>
              </li>
              <li>
                <span className="text-slate-400 hover:text-indigo-300 transition-colors cursor-default">
                  Real-time Speech Recognition
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-indigo-300 transition-colors cursor-default">
                  STAR Rubric Scoring (0–100)
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-indigo-300 transition-colors cursor-default">
                  Dynamic Adaptive Follow-ups
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-indigo-300 transition-colors cursor-default">
                  Resume & JD Competency Match
                </span>
              </li>
            </ul>
          </div>

          {/* Privacy & Security */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Privacy & Trust
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-400">
                <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Local Camera & Audio Processing</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Radio className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Zero Server Audio Storing</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Gemini 3.8 Default • Configurable</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Offline Simulation Ready</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider and sub-footer */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} CAIRA AI Readiness Platform. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-slate-400">Empowering candidates to interview with confidence.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
              Gemini 3.8 Default
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
              Web Speech API
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
              Supabase Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
