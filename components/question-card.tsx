"use client";

import { Brain, Sparkles, Target } from "lucide-react";
import { InterviewerVoice } from "./interviewer-voice";
import type { QuestionType } from "@/types/interview";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  questionType?: QuestionType | string;
  targetsSkill?: string;
  isLoadingNext?: boolean;
  jobRole?: string;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  questionText,
  questionType = "technical",
  targetsSkill,
  isLoadingNext = false,
  jobRole,
}: QuestionCardProps) {
  const progressPercent = Math.round((questionNumber / totalQuestions) * 100);

  const typeStyle =
    questionType.toLowerCase() === "behavioral"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : questionType.toLowerCase() === "situational"
      ? "bg-purple-50 text-purple-700 border-purple-100"
      : "bg-indigo-50 text-indigo-700 border-indigo-100";

  return (
    <section className="caira-surface relative overflow-hidden p-5 sm:p-7 caira-motion-in">
      <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-indigo-100/70 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-500">
              Interview prompt
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#202941] text-xs font-extrabold text-white">
                {questionNumber}
              </span>
              <span className="text-xs font-bold text-slate-500">Question {questionNumber} of {totalQuestions}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.11em] ${typeStyle}`}>
              <Brain className="h-3 w-3" /> {questionType}
            </span>
            {targetsSkill ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-extrabold text-emerald-700">
                <Target className="h-3 w-3" /> {targetsSkill}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-6 rounded-[24px] border border-stone-200 bg-[#fbfaf7] p-4 sm:p-5">
          <InterviewerVoice
            jobRole={jobRole}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            questionText={questionText}
          />

          {isLoadingNext ? (
            <div className="flex min-h-28 items-center gap-3 py-5 text-slate-500">
              <Sparkles className="h-5 w-5 animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">CAIRA is reading your last answer and shaping the follow-up...</p>
            </div>
          ) : (
            <div className="min-h-28 pt-4">
              <h2 className="max-w-3xl text-xl font-extrabold leading-8 tracking-[-0.035em] text-[#1c2437] sm:text-2xl">
                “{questionText}”
              </h2>
              <p className="mt-3 text-xs font-medium leading-5 text-slate-500">
                Answer naturally. Specific decisions, trade-offs, evidence, and outcomes give CAIRA more to work with on the next turn.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
