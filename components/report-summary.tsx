"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Brain,
  Check,
  CheckCircle2,
  ListChecks,
  Printer,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { ScoreBadge } from "./score-badge";
import type { Interview } from "@/types/interview";

interface ReportSummaryProps {
  interview: Interview;
}

type ReportTab = "overview" | "skills" | "turns";

export function ReportSummary({ interview }: ReportSummaryProps) {
  const report = interview.report;
  const questions = interview.questions || [];
  const overallScore = report?.overall_score ?? interview.overall_score ?? 0;
  const [tab, setTab] = useState<ReportTab>("overview");
  const [selectedTurn, setSelectedTurn] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState(0);

  useEffect(() => {
    if (overallScore >= 70) {
      try {
        confetti({
          particleCount: 52,
          spread: 64,
          origin: { y: 0.62 },
          colors: ["#5b57d9", "#3c9c7b", "#f4cf72"],
        });
      } catch {
        // Decorative only.
      }
    }
  }, [overallScore]);

  const skillBreakdown = report?.per_skill_breakdown || [];
  const activeSkill = skillBreakdown[selectedSkill] || skillBreakdown[0];
  const activeQuestion = questions[selectedTurn] || questions[0];
  const strongestSkill = useMemo(
    () => [...skillBreakdown].sort((a, b) => b.score - a.score)[0],
    [skillBreakdown]
  );
  const focusSkill = useMemo(
    () => [...skillBreakdown].sort((a, b) => a.score - b.score)[0],
    [skillBreakdown]
  );

  return (
    <div className="mx-auto max-w-[1300px] pb-14 print-page">
      <header className="no-print mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.17em] text-indigo-600">
            <Sparkles className="h-3.5 w-3.5" /> Interview Report: {interview.job_role}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-[#1c2437] sm:text-4xl">Your readiness map.</h1>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Completed {new Date(interview.completed_at || interview.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="caira-secondary-button">
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
          <Link href="/interview/new" className="caira-primary-button">
            <RotateCcw className="h-4 w-4" /> Practice again
          </Link>
        </div>
      </header>

      <section className="caira-surface overflow-hidden print-card">
        <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
          <div className="bg-[#202941] p-6 text-white sm:p-7">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-200">Overall Readiness Score</div>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-extrabold tracking-[-0.08em]">{overallScore}</span>
              <span className="mb-1 text-sm font-bold text-slate-400">/100</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-white to-emerald-300" style={{ width: `${Math.max(2, overallScore)}%` }} />
            </div>
            <div className="mt-6 rounded-[20px] border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Readiness note</div>
              <p className="mt-2 text-sm font-bold leading-6 text-white">{report?.recommendation || "Use the breakdown to choose the next practice focus."}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Session synthesis</div>
            <h2 className="mt-3 max-w-3xl text-2xl font-extrabold leading-8 tracking-[-0.04em] text-[#1c2437]">{report?.summary || "Your report combines the strongest evidence, gaps, and turn-level feedback from the practice."}</h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <SignalCard
                icon={Award}
                label="Strongest signal"
                value={strongestSkill ? `${strongestSkill.skill} · ${strongestSkill.score}%` : report?.top_strengths?.[0] || "Complete more turns to reveal a pattern"}
                tone="jade"
              />
              <SignalCard
                icon={Target}
                label="Next focus"
                value={focusSkill ? `${focusSkill.skill} · ${focusSkill.score}%` : report?.key_gaps?.[0] || "Choose one gap for the next session"}
                tone="indigo"
              />
            </div>
          </div>
        </div>
      </section>

      <nav className="no-print mt-5 flex max-w-full gap-1 overflow-x-auto rounded-full border border-stone-200 bg-white/80 p-1.5 sm:w-fit">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={Brain} label="Overview" />
        <TabButton active={tab === "skills"} onClick={() => setTab("skills")} icon={TrendingUp} label="Skills" />
        <TabButton active={tab === "turns"} onClick={() => setTab("turns")} icon={ListChecks} label="Turns" />
      </nav>

      <div className="mt-5 caira-motion-in" key={tab}>
        {tab === "overview" ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="caira-surface p-5 sm:p-6 print-card">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#1c2437]"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> What carried the interview</div>
              <div className="mt-5 space-y-3">
                {(report?.top_strengths || []).map((strength, index) => (
                  <div key={`${strength}-${index}`} className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm"><Check className="h-3 w-3" /></span>
                    <p className="text-xs font-semibold leading-5 text-emerald-950">{strength}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="caira-surface p-5 sm:p-6 print-card">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#1c2437]"><Target className="h-4 w-4 text-amber-600" /> What to practice next</div>
              <div className="mt-5 space-y-3">
                {(report?.key_gaps || []).map((gap, index) => (
                  <div key={`${gap}-${index}`} className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/65 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-current" /></span>
                    <p className="text-xs font-semibold leading-5 text-amber-950">{gap}</p>
                  </div>
                ))}
              </div>
              <Link href="/interview/new" className="caira-primary-button mt-5 w-full">Practice this again <ArrowRight className="h-4 w-4" /></Link>
            </section>
          </div>
        ) : null}

        {tab === "skills" ? (
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <aside className="caira-surface p-4 print-card">
              <div className="px-2 pb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Competency map</div>
              <div className="space-y-2">
                {skillBreakdown.map((item, index) => (
                  <button
                    type="button"
                    key={`${item.skill}-${index}`}
                    onClick={() => setSelectedSkill(index)}
                    className={`w-full rounded-2xl border p-3.5 text-left transition-all ${selectedSkill === index ? "border-indigo-200 bg-indigo-50" : "border-stone-200 bg-white hover:border-indigo-100"}`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs font-extrabold text-[#1c2437]"><span>{item.skill}</span><span className="text-indigo-700">{item.score}%</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${item.score}%` }} /></div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="caira-surface p-6 sm:p-8 print-card">
              {activeSkill ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-600">Selected competency</div>
                      <h3 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-[#1c2437]">{activeSkill.skill}</h3>
                    </div>
                    <div className="text-4xl font-extrabold tracking-[-0.06em] text-indigo-700">{activeSkill.score}<span className="text-sm text-slate-400">%</span></div>
                  </div>
                  <div className="mt-7 rounded-[24px] border border-stone-200 bg-[#fbfaf7] p-5">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">CAIRA&apos;s read</div>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">{activeSkill.notes}</p>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-sm font-semibold text-slate-500">No skill breakdown was generated for this report.</div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "turns" ? (
          <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
            <aside className="caira-surface p-4 print-card">
              <div className="px-2 pb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Turn navigator</div>
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <button
                    type="button"
                    key={question.id || index}
                    onClick={() => setSelectedTurn(index)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${selectedTurn === index ? "border-indigo-200 bg-indigo-50" : "border-stone-200 bg-white hover:border-indigo-100"}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${selectedTurn === index ? "bg-[#202941] text-white" : "bg-stone-100 text-slate-500"}`}>{question.question_number}</span>
                    <span className="min-w-0"><span className="block truncate text-xs font-extrabold text-[#1c2437]">{question.targets_skill || question.question_type || "Interview turn"}</span><span className="mt-0.5 block text-[10px] font-semibold text-slate-400">{question.score ?? "—"}/10</span></span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="caira-surface p-5 sm:p-7 print-card">
              {activeQuestion ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2"><span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-700">Question {activeQuestion.question_number}</span><span className="text-[11px] font-bold capitalize text-slate-400">{activeQuestion.question_type || "Interview"}</span></div>
                    <ScoreBadge score={activeQuestion.score ?? 0} maxScore={10} size="md" />
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold leading-8 tracking-[-0.035em] text-[#1c2437]">“{activeQuestion.question_text}”</h3>
                  <div className="mt-5 rounded-[22px] border border-stone-200 bg-[#fbfaf7] p-4"><div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Your answer</div><p className="mt-2 text-sm leading-7 text-slate-700">{activeQuestion.answer_text || "No response recorded."}</p></div>
                  {activeQuestion.evaluation ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <TurnNotes title="What worked" items={activeQuestion.evaluation.strengths || []} tone="jade" />
                      <TurnNotes title="What was missing" items={activeQuestion.evaluation.gaps || []} tone="amber" />
                    </div>
                  ) : null}
                  {activeQuestion.evaluation?.feedback ? <div className="mt-4 rounded-[22px] border border-indigo-100 bg-indigo-50/70 p-4"><div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-700">Coach note</div><p className="mt-2 text-sm font-semibold leading-6 text-indigo-950">{activeQuestion.evaluation.feedback}</p></div> : null}
                </>
              ) : (
                <div className="py-16 text-center text-sm font-semibold text-slate-500">No turn data is available.</div>
              )}
            </section>
          </div>
        ) : null}
      </div>

      <div className="no-print mt-7 flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard" className="caira-secondary-button"><ArrowLeft className="h-4 w-4" /> Back to reports</Link>
        <Link href="/interview/new" className="caira-primary-button">Start another practice <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Brain; label: string }) {
  return <button type="button" onClick={onClick} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition-all ${active ? "bg-[#202941] text-white shadow-sm" : "text-slate-500 hover:bg-stone-100 hover:text-slate-800"}`}><Icon className="h-3.5 w-3.5" />{label}</button>;
}

function SignalCard({ icon: Icon, label, value, tone }: { icon: typeof Award; label: string; value: string; tone: "jade" | "indigo" }) {
  const style = tone === "jade" ? "border-emerald-100 bg-emerald-50/65 text-emerald-900" : "border-indigo-100 bg-indigo-50/65 text-indigo-950";
  return <div className={`rounded-[22px] border p-4 ${style}`}><Icon className="h-4 w-4" /><div className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.13em] opacity-60">{label}</div><p className="mt-1 text-xs font-extrabold leading-5">{value}</p></div>;
}

function TurnNotes({ title, items, tone }: { title: string; items: string[]; tone: "jade" | "amber" }) {
  const style = tone === "jade" ? "border-emerald-100 bg-emerald-50/65 text-emerald-950" : "border-amber-100 bg-amber-50/65 text-amber-950";
  return <div className={`rounded-[22px] border p-4 ${style}`}><div className="text-xs font-extrabold">{title}</div><ul className="mt-3 space-y-2">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-xs font-semibold leading-5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-55" />{item}</li>)}</ul></div>;
}
