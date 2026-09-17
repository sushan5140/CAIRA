"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock3,
  Filter,
  History,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { listLocalInterviews } from "@/lib/demo/client-store";
import type { Interview } from "@/types/interview";

function mergeInterviews(server: Interview[], local: Interview[]) {
  const merged = new Map<string, Interview>();
  for (const interview of server) merged.set(interview.id, interview);
  for (const interview of local) {
    if (!merged.has(interview.id) || interview.id.startsWith("caira-")) merged.set(interview.id, interview);
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

const filters = ["All", "Completed", "In progress"] as const;
type FilterValue = (typeof filters)[number];

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("All");

  useEffect(() => {
    async function fetchInterviews() {
      const local = listLocalInterviews();
      try {
        const res = await fetch("/api/interviews", { cache: "no-store" });
        const data = res.ok ? await res.json() : { interviews: [] };
        setInterviews(mergeInterviews(data.interviews || [], local));
      } catch (err) {
        console.error("Failed to load server interviews:", err);
        setInterviews(local);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInterviews();
  }, []);

  const completed = interviews.filter((item) => item.status === "completed");
  const inProgress = interviews.filter((item) => item.status !== "completed");
  const averageScore = completed.length
    ? Math.round(completed.reduce((sum, item) => sum + (item.overall_score || 0), 0) / completed.length)
    : 0;

  const visible = useMemo(() => {
    if (filter === "Completed") return completed;
    if (filter === "In progress") return inProgress;
    return interviews;
  }, [completed, filter, inProgress, interviews]);

  const latestCompleted = completed[0];
  const latestGap = latestCompleted?.report?.key_gaps?.[0];

  return (
    <div className="mx-auto max-w-[1450px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">Review room</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-[#1c2437] sm:text-4xl">Your interview history should teach you something.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Open a session, continue an unfinished practice, or use the pattern across reports to choose what to work on next.</p>
        </div>
        <Link href="/interview/new" className="caira-primary-button shrink-0">
          <Plus className="h-4 w-4" /> New practice
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average readiness" value={averageScore ? `${averageScore}` : "—"} note={completed.length ? "Across completed sessions" : "Complete a session first"} icon={TrendingUp} tone="indigo" />
        <StatCard label="Completed" value={`${completed.length}`} note={`${interviews.length} total sessions`} icon={CheckCircle2} tone="jade" />
        <StatCard label="In progress" value={`${inProgress.length}`} note={inProgress.length ? "Resume where you left off" : "No unfinished sessions"} icon={Clock3} tone="amber" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="caira-surface overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-extrabold tracking-[-0.02em] text-[#1c2437]">Practice history</h2>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-[#f7f3ec] p-1">
              <Filter className="ml-2 h-3.5 w-3.5 text-slate-400" />
              {filters.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold transition-all ${filter === item ? "bg-[#202941] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-slate-400">
              <Sparkles className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-xs font-bold">Loading practice history...</span>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-indigo-50 text-indigo-600"><Briefcase className="h-5 w-5" /></div>
              <h3 className="mt-4 text-base font-extrabold text-[#1c2437]">Nothing in this view yet</h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Start a mock interview and CAIRA will build your review history here.</p>
              <Link href="/interview/new" className="caira-primary-button mt-5">Start first practice <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {visible.map((intv) => {
                const isDone = intv.status === "completed";
                const isGuest = intv.id.startsWith("caira-");
                const answered = intv.questions?.filter((q) => q.answer_text).length || 0;
                const total = intv.target_questions || 5;
                const progress = Math.min(100, Math.round((answered / total) * 100));
                const targetLink = isDone ? `/interview/${intv.id}/report` : `/interview/${intv.id}`;

                return (
                  <Link key={intv.id} href={targetLink} className="group block p-5 transition-colors hover:bg-[#fbfaf7]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-extrabold tracking-[-0.02em] text-[#1c2437] group-hover:text-indigo-700">{intv.job_role}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] ${isDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{isDone ? "Completed" : "In progress"}</span>
                          {isGuest ? <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">This device</span> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-400">
                          <span>{new Date(intv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          <span>{intv.extracted_skills?.seniority_level ? `${intv.extracted_skills.seniority_level} level` : "Adaptive level"}</span>
                          <span>{answered}/{total} answered</span>
                        </div>
                        {!isDone ? (
                          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${Math.max(8, progress)}%` }} />
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {isDone && typeof intv.overall_score === "number" ? (
                          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-700">
                            <span className="text-lg font-extrabold leading-none">{intv.overall_score}</span>
                            <span className="mt-0.5 text-[8px] font-extrabold uppercase">score</span>
                          </div>
                        ) : null}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-400 transition-all group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="caira-surface p-5">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
              <Target className="h-3.5 w-3.5 text-indigo-600" /> Next practice focus
            </div>
            {latestCompleted ? (
              <>
                <div className="mt-4 text-2xl font-extrabold tracking-[-0.045em] text-[#1c2437]">{latestCompleted.overall_score ?? "—"}<span className="ml-1 text-sm text-slate-400">/100</span></div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{latestGap || "Open your latest report and choose one gap to deliberately practice in the next session."}</p>
                <Link href={`/interview/${latestCompleted.id}/report`} className="caira-secondary-button mt-5 w-full">Review latest report <ArrowRight className="h-4 w-4" /></Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">Complete one practice session and CAIRA will turn your report gaps into a concrete next focus here.</p>
                <Link href="/interview/new" className="caira-primary-button mt-5 w-full">Start practice</Link>
              </>
            )}
          </div>

          <div className="rounded-[28px] border border-indigo-100 bg-indigo-50/70 p-5">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-700"><BarChart3 className="h-3.5 w-3.5" /> Review loop</div>
            <div className="mt-4 space-y-3">
              {["Practice a real role", "Read the turn feedback", "Choose one gap", "Run a harder session"].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-indigo-700 shadow-sm">{index + 1}</span>
                  <span className="text-xs font-bold text-indigo-950">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof TrendingUp;
  tone: "indigo" | "jade" | "amber";
}) {
  const toneClass = tone === "jade" ? "bg-emerald-50 text-emerald-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700";
  return (
    <div className="caira-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${toneClass}`}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-4 text-3xl font-extrabold tracking-[-0.05em] text-[#1c2437]">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{note}</div>
    </div>
  );
}
