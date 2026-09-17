import Link from "next/link";
import {
  Sparkles,
  Video,
  Mic,
  Brain,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 shadow-inner text-xs font-medium text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI-Powered Interview Readiness Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Master Your Next Interview with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Realistic AI Simulation
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Upload your resume and target job description. CAIRA extracts required competencies, conducts an adaptive multi-turn interview via camera & voice, and delivers an in-depth readiness score.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/interview/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold text-base shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Start Mock Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-medium text-base transition-all"
            >
              <span>View Past Reports</span>
            </Link>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No signup required for demo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% private local capture</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Preview Card Mockup */}
        <div className="mt-16 relative max-w-4xl mx-auto">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-20 blur-xl pointer-events-none" />
          <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-slate-400 ml-2 font-mono">caira.interview-room/live</span>
              </div>
              <span className="text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                Adaptive Evaluator • Gemini 3.8 Default
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Camera Preview Mock */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between min-h-[180px]">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Webcam Active
                  </span>
                  <span>1080p</span>
                </div>
                <div className="flex flex-col items-center justify-center my-4 text-slate-500">
                  <Video className="w-8 h-8 text-slate-600 mb-1" />
                  <span className="text-xs">Live Candidate Stream</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg">
                  <span className="flex items-center gap-1">
                    <Mic className="w-3 h-3 text-emerald-400" /> Mic Connected
                  </span>
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-emerald-400 rounded-full" />
                    <span className="w-1 h-4 bg-emerald-400 rounded-full" />
                    <span className="w-1 h-2 bg-emerald-400 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Dynamic Q&A Mock */}
              <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold">
                      Question 2 of 5
                    </span>
                    <span className="text-xs text-slate-400">Technical • Distributed Architecture</span>
                  </div>
                  <h3 className="text-base font-medium text-slate-100 leading-snug">
                    &ldquo;You mentioned migrating from REST to gRPC for service-to-service calls. How did you handle schema versioning and backward compatibility during zero-downtime deployments?&rdquo;
                  </h3>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                  <span className="text-indigo-400 font-medium block mb-1">Turn Evaluation:</span>
                  <p className="italic text-slate-400">
                    &ldquo;Strong explanation of Protobuf field tagging and deprecation rules. Score: 9/10.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Steps Section */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Designed for Realistic, High-Stakes Preparation
            </h2>
            <p className="text-sm text-slate-400">
              Unlike static question banks, CAIRA listens to your specific answers and probes deeper like a senior hiring manager.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">1. Role & Resume Extraction</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Provide your target role and upload your resume or paste the JD. Gemini extracts core competencies, seniority signals, and focus themes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">2. Adaptive AI Interview</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Experience dynamic questions generated turn-by-turn. Speak naturally with the Web Speech API or type answers, framed by your local camera preview.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">3. Actionable Readiness Report</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Receive an overall readiness score (0–100), key strengths, gaps, per-skill analysis, and turn-by-turn feedback that you can print or export to PDF.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
