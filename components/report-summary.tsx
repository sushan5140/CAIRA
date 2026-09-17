"use client";

import Link from "next/link";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Printer,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Briefcase,
  FileText,
  Sparkles,
  ChevronDown,
  Brain,
} from "lucide-react";
import { ScoreBadge } from "./score-badge";
import type { Interview } from "@/types/interview";

interface ReportSummaryProps {
  interview: Interview;
}

export function ReportSummary({ interview }: ReportSummaryProps) {
  const report = interview.report;
  const questions = interview.questions || [];
  const overallScore = report?.overall_score ?? interview.overall_score ?? 75;

  useEffect(() => {
    // Trigger celebratory confetti for scores >= 70
    if (overallScore >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#10b981", "#38bdf8"],
        });
      } catch (e) {
        // Safe ignore
      }
    }
  }, [overallScore]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 print-page">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Interview Readiness Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Interview Report: {interview.job_role}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Completed on {new Date(interview.completed_at || interview.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-sm font-medium transition-all active:scale-95 shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Export / Print PDF</span>
          </button>

          <Link
            href="/interview/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again</span>
          </Link>
        </div>
      </div>

      {/* Main Readiness Score Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-md print-card">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <Award className="w-3.5 h-3.5" />
              <span>Overall Readiness Score</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {report?.recommendation || "Readiness Summary"}
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {report?.summary || "Comprehensive interview evaluation synthesized across technical clarity, behavioral communication, and architectural trade-offs."}
            </p>
          </div>

          {/* Large circular score meter */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-32 h-32 rounded-full bg-slate-950 border-4 border-slate-800 flex flex-col items-center justify-center shadow-inner">
              <div
                className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-emerald-400"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                  transform: `rotate(${Math.round(overallScore * 3.6)}deg)`,
                }}
              />
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {overallScore}
              </span>
              <span className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
                out of 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Gaps 2-column breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/20 p-6 shadow-xl backdrop-blur-md print-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white text-base">Key Strengths Demonstrated</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            {(report?.top_strengths || [
              "Clear, structured communication when breaking down solutions.",
              "Strong technical grounding in core role competencies.",
              "Positive and collaborative framing of past team interactions.",
            ]).map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Priority Growth Areas */}
        <div className="rounded-2xl bg-slate-900/80 border border-amber-500/20 p-6 shadow-xl backdrop-blur-md print-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="font-semibold text-white text-base">Key Gaps & Priority Focus</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            {(report?.key_gaps || [
              "Incorporate more quantitative metrics (e.g. % performance increase, latency numbers).",
              "Elaborate on edge-case scenarios and production failure fallbacks.",
              "Ensure STAR narrative concludes with clear, measurable business impact.",
            ]).map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-Skill Assessment Bars */}
      {report?.per_skill_breakdown && report.per_skill_breakdown.length > 0 && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md space-y-4 print-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white text-base">Skill Competency Breakdown</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.per_skill_breakdown.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-200">{item.skill}</span>
                  <span className="text-indigo-400">{item.score}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{item.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Question Full Transcript & Turn-by-Turn Evaluations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white text-lg">Turn-by-Turn Question Analysis</h3>
          </div>
          <span className="text-xs text-slate-400">
            {questions.length} Question{questions.length !== 1 ? "s" : ""} Evaluated
          </span>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-md space-y-4 print-card"
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                    Q{q.question_number}
                  </span>
                  <span className="text-xs font-medium text-slate-400 capitalize">
                    {q.question_type || "Technical"} • {q.targets_skill || "General"}
                  </span>
                </div>

                <ScoreBadge score={q.score ?? 7} maxScore={10} size="sm" />
              </div>

              {/* Question Text */}
              <div>
                <h4 className="text-sm font-semibold text-slate-200 leading-relaxed">
                  &ldquo;{q.question_text}&rdquo;
                </h4>
              </div>

              {/* Candidate's Answer */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                  Candidate Transcript
                </div>
                <p className="italic leading-relaxed">{q.answer_text || "No verbal response recorded."}</p>
              </div>

              {/* Evaluation Details */}
              {q.evaluation && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/20 text-slate-300">
                    <span className="font-semibold text-emerald-400 block mb-1">Strengths:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {q.evaluation.strengths?.map((s, sIdx) => (
                        <li key={sIdx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/20 text-slate-300">
                    <span className="font-semibold text-amber-400 block mb-1">Recommendations:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {q.evaluation.gaps?.map((g, gIdx) => (
                        <li key={gIdx}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800 no-print">
        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Return to Dashboard
        </Link>

        <Link
          href="/interview/new"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95"
        >
          <span>Start Another Practice Session</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
