"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Brain,
  Check,
  FileText,
  Mic,
  Play,
  Sparkles,
  Target,
  Video,
} from "lucide-react";

const rolePresets = [
  {
    label: "Frontend Engineer",
    skill: "React architecture",
    question:
      "You mentioned improving a slow dashboard. How did you decide whether the bottleneck was rendering, data fetching, or the API itself?",
  },
  {
    label: "ML Engineer",
    skill: "Model reliability",
    question:
      "Your validation metric looks strong overall. What would you inspect first if performance drops sharply for one user segment?",
  },
  {
    label: "Product Manager",
    skill: "Prioritization",
    question:
      "Two customer problems are urgent, but engineering can only solve one this sprint. How would you make and defend the choice?",
  },
];

const flow = [
  { label: "Brief", note: "Role + evidence", icon: FileText },
  { label: "Practice", note: "Adaptive dialogue", icon: Mic },
  { label: "Reflect", note: "Turn coaching", icon: Brain },
  { label: "Report", note: "Readiness map", icon: Target },
];

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState(0);
  const [previewStep, setPreviewStep] = useState(1);
  const activeRole = rolePresets[selectedRole];

  const feedback = useMemo(() => {
    const items = [
      "Good problem framing",
      "Add one concrete metric",
      "Explain the trade-off you rejected",
    ];
    return items.slice(0, previewStep + 1);
  }, [previewStep]);

  return (
    <div className="overflow-hidden">
      <section className="mx-auto max-w-[1500px] px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-2xl caira-motion-in">
            <div className="caira-chip mb-5 !border-indigo-100 !bg-indigo-50 !text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Interview practice that reacts to you
            </div>

            <h1 className="max-w-xl text-5xl font-extrabold leading-[0.98] tracking-[-0.06em] text-[#1c2437] sm:text-6xl lg:text-[72px]">
              Practice the interview, not the question bank.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              CAIRA turns your role, resume, and answers into a live interview room that adapts after every response and shows you what to improve while the conversation is still fresh.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/interview/new" className="caira-primary-button !px-6 !py-3.5">
                Start a practice interview
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="caira-secondary-button !px-6 !py-3.5">
                Open my reports
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Guest mode available</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Voice + typed answers</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> 5–10 adaptive turns</span>
            </div>
          </div>

          <div className="relative caira-motion-in lg:pl-6" style={{ animationDelay: "100ms" }}>
            <div className="absolute -left-5 top-14 hidden h-24 w-24 rounded-full bg-amber-200/35 blur-2xl lg:block" />
            <div className="caira-surface relative overflow-hidden p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-2 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span className="caira-live-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Live practice preview
                </div>
                <span className="rounded-full bg-[#f4f0e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Adaptive
                </span>
              </div>

              <div className="grid gap-3 pt-3 lg:grid-cols-[190px_1fr_220px]">
                <aside className="rounded-[22px] bg-[#202941] p-4 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Interview rail</div>
                  <div className="mt-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setPreviewStep(Math.min(2, Math.max(0, step - 1)))}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                          step <= previewStep + 1 ? "bg-white text-[#202941]" : "bg-white/10 text-slate-400"
                        }`}>
                          {step <= previewStep ? <Check className="h-3 w-3" /> : step}
                        </span>
                        <span className={step === previewStep + 1 ? "text-xs font-bold text-white" : "text-xs text-slate-400"}>
                          Question {step}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-300">
                      <Video className="h-3.5 w-3.5" /> Camera ready
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                      <Mic className="h-3.5 w-3.5" /> Voice connected
                    </div>
                  </div>
                </aside>

                <main className="rounded-[22px] border border-stone-100 bg-[#fbfaf7] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-700">
                      Question {previewStep + 1} of 5
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">{activeRole.skill}</span>
                  </div>
                  <p className="mt-5 text-lg font-bold leading-7 tracking-[-0.025em] text-[#1c2437]">
                    “{activeRole.question}”
                  </p>
                  <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <AudioLines className="h-3.5 w-3.5 text-indigo-600" /> Your answer
                    </div>
                    <div className="h-2 w-[84%] rounded-full bg-stone-100" />
                    <div className="mt-2 h-2 w-[61%] rounded-full bg-stone-100" />
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-1">
                        {[12, 20, 15, 24, 10].map((height, index) => (
                          <span key={index} className="w-1.5 rounded-full bg-indigo-400" style={{ height }} />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewStep((current) => (current + 1) % 3)}
                        className="rounded-full bg-[#202941] px-3 py-1.5 text-[10px] font-bold text-white transition-transform active:scale-95"
                      >
                        Simulate next
                      </button>
                    </div>
                  </div>
                </main>

                <aside className="rounded-[22px] border border-stone-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <Brain className="h-3.5 w-3.5 text-indigo-600" /> Adaptive coach
                  </div>
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">Live signal</div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-emerald-900">Your structure is clear. Push the evidence one step further.</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {feedback.map((item) => (
                      <div key={item} className="flex gap-2 text-[11px] leading-4 text-slate-600">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        {item}
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {rolePresets.map((role, index) => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => setSelectedRole(index)}
                  className={`rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                    selectedRole === index
                      ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                      : "border-stone-200 bg-white/70 text-slate-500 hover:bg-white"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200/80 bg-white/45">
        <div className="mx-auto max-w-[1300px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-9 max-w-xl">
            <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">One connected practice loop</div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#1c2437]">Every screen should move you forward.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">CAIRA keeps context visible while you move from role setup to adaptive questions, coaching, and a final readiness map.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="group caira-surface-soft relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-extrabold text-stone-300">0{index + 1}</span>
                  </div>
                  <div className="mt-5 text-base font-extrabold tracking-[-0.03em] text-[#1c2437]">{item.label}</div>
                  <div className="mt-1 text-xs font-medium text-slate-500">{item.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="caira-surface relative overflow-hidden px-6 py-12 sm:px-12">
          <div className="absolute left-1/2 top-0 h-28 w-80 -translate-x-1/2 rounded-full bg-indigo-100 blur-3xl" />
          <div className="relative">
            <Play className="mx-auto h-8 w-8 text-indigo-600" />
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-[-0.045em] text-[#1c2437] sm:text-4xl">The next click should feel like entering a room, not filling another form.</h2>
            <Link href="/interview/new" className="caira-primary-button mt-7 !px-7 !py-3.5">
              Build my interview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
