"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  PlusCircle,
  Briefcase,
  Calendar,
  ChevronRight,
  Sparkles,
  Award,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { ScoreBadge } from "@/components/score-badge";
import type { Interview } from "@/types/interview";

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInterviews() {
      try {
        const res = await fetch("/api/interviews");
        const data = await res.json();
        if (data.interviews) {
          setInterviews(data.interviews);
        }
      } catch (err) {
        console.error("Failed to load interviews:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInterviews();
  }, []);

  const completed = interviews.filter((i) => i.status === "completed");
  const averageScore = completed.length > 0
    ? Math.round(
        completed.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / completed.length
      )
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Interview Readiness Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your mock interview progress, competency scoring, and readiness over time.
          </p>
        </div>

        <Link
          href="/interview/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Mock Interview</span>
        </Link>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Average Readiness
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{averageScore || "—"}</span>
            {averageScore > 0 && <span className="text-xs text-slate-400">/ 100</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {completed.length > 0 ? "Across all completed sessions" : "Complete a session to view"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed Sessions
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{completed.length}</span>
            <span className="text-xs text-slate-400">interviews</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {interviews.length} total sessions initiated
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              AI Evaluator Model
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">Gemini 1.5</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Structured JSON Rubric & Web Speech STT
          </p>
        </div>
      </div>

      {/* Past Interviews List */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Interview History</h2>
          </div>
          <span className="text-xs text-slate-400">
            {interviews.length} recorded session{interviews.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse space-y-2">
            <Sparkles className="w-6 h-6 text-indigo-400 mx-auto animate-spin" />
            <p className="text-sm">Loading interview records...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">No mock interviews yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Start your first AI-guided mock interview to generate competency analytics and your readiness score.
              </p>
            </div>
            <Link
              href="/interview/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start Mock Interview</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {interviews.map((intv) => {
              const isDone = intv.status === "completed";
              const targetLink = isDone ? `/interview/${intv.id}/report` : `/interview/${intv.id}`;

              return (
                <Link
                  key={intv.id}
                  href={targetLink}
                  className="flex items-center justify-between p-5 hover:bg-slate-850/60 transition-colors group"
                >
                  <div className="space-y-1.5 min-w-0 pr-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {intv.job_role}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          isDone
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                        }`}
                      >
                        {isDone ? "Completed" : "In Progress"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(intv.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>

                      {intv.extracted_skills?.seniority_level && (
                        <span className="capitalize text-slate-400">
                          Level: {intv.extracted_skills.seniority_level}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {isDone && intv.overall_score !== undefined && intv.overall_score !== null && (
                      <ScoreBadge score={intv.overall_score} maxScore={100} size="md" />
                    )}

                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-indigo-600 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
