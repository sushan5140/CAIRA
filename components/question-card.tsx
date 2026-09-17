"use client";

import { Sparkles, Brain, Target, Layers } from "lucide-react";
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
  const getTypeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case "behavioral":
        return "bg-amber-500/10 text-amber-300 border-amber-500/20";
      case "situational":
        return "bg-purple-500/10 text-purple-300 border-purple-500/20";
      default:
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
    }
  };

  const progressPercent = Math.round((questionNumber / totalQuestions) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Question progress & Meta tags */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            {questionNumber}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border capitalize flex items-center gap-1 ${getTypeStyle(
              questionType
            )}`}
          >
            <Brain className="w-3 h-3" />
            {questionType}
          </span>

          {targetsSkill && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-400" />
              {targetsSkill}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-800/80 h-1.5 rounded-full mb-5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* AI Interviewer Audio & Dialogue Voice Controller */}
      <InterviewerVoice
        jobRole={jobRole}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        questionText={questionText}
      />

      {/* Question statement */}
      <div className="min-h-[90px] flex items-start">
        {isLoadingNext ? (
          <div className="flex items-center gap-3 text-slate-400 py-4 animate-pulse">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
            <p className="text-base">CAIRA is crafting your next follow-up question...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed">
              &ldquo;{questionText}&rdquo;
            </h2>
            <p className="text-xs text-slate-500">
              Take your time to structure your response. When ready, answer aloud or edit the text box below.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
