"use client";

import { useState } from "react";
import { MicRecorder } from "./mic-recorder";
import { ScoreBadge } from "./score-badge";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import type { AnswerEvaluationResult } from "@/types/interview";

interface AnswerInputProps {
  onSubmitAnswer: (answer: string) => Promise<AnswerEvaluationResult | null>;
  onNextQuestion: () => void;
  isSubmitting?: boolean;
  lastEvaluation?: AnswerEvaluationResult | null;
  isLastQuestion?: boolean;
}

export function AnswerInput({
  onSubmitAnswer,
  onNextQuestion,
  isSubmitting = false,
  lastEvaluation = null,
  isLastQuestion = false,
}: AnswerInputProps) {
  const [answerText, setAnswerText] = useState("");
  const [evaluated, setEvaluated] = useState(Boolean(lastEvaluation));
  const [evaluationData, setEvaluationData] = useState<AnswerEvaluationResult | null>(lastEvaluation);

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  const handleSubmit = async () => {
    if (!answerText.trim() || isSubmitting) return;
    const result = await onSubmitAnswer(answerText.trim());
    if (result) {
      setEvaluationData(result);
      setEvaluated(true);
    }
  };

  const handleNext = () => {
    setAnswerText("");
    setEvaluated(false);
    setEvaluationData(null);
    onNextQuestion();
  };

  if (evaluated && evaluationData) {
    return (
      <section className="caira-surface p-5 sm:p-6 caira-motion-in">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-[-0.02em] text-[#1c2437]">Turn evaluation</h3>
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">What landed, what was missing, what to carry forward</p>
            </div>
          </div>
          <ScoreBadge score={evaluationData.score} maxScore={10} size="md" />
        </div>

        <div className="mt-5 rounded-[22px] border border-indigo-100 bg-indigo-50/70 p-4">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-700">Coach note</div>
          <p className="mt-2 text-sm font-semibold leading-6 text-indigo-950">{evaluationData.feedback}</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/65 p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800">
              <Check className="h-3.5 w-3.5" /> What worked
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-emerald-950/80">
              {evaluationData.strengths.map((strength) => (
                <li key={strength} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[22px] border border-amber-100 bg-amber-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-800">
              <AlertCircle className="h-3.5 w-3.5" /> Push further
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-amber-950/80">
              {evaluationData.gaps.map((gap) => (
                <li key={gap} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={handleNext} className="caira-primary-button">
            {isLastQuestion ? "Complete interview" : "Continue to follow-up"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="caira-surface p-4 sm:p-5">
      <div className="rounded-[22px] border border-stone-200 bg-[#fbfaf7] p-3">
        <MicRecorder
          currentTranscript={answerText}
          onTranscriptChange={(newText) => setAnswerText(newText)}
          isEvaluating={isSubmitting}
        />
      </div>

      <div className="relative mt-4">
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Speak naturally with the microphone, or type here. Focus on what you decided, why, and what happened next."
          rows={6}
          disabled={isSubmitting}
          className="caira-input resize-none !pb-9 !leading-6 disabled:opacity-60"
        />
        <div className="pointer-events-none absolute bottom-3 right-4 text-[10px] font-bold text-slate-400">
          {wordCount} words
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setAnswerText("")}
          disabled={!answerText || isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold text-slate-400 transition-colors hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Clear
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!answerText.trim() || isSubmitting}
          className="caira-primary-button disabled:pointer-events-none disabled:opacity-45"
        >
          {isSubmitting ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" /> Reading your answer...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit answer
            </>
          )}
        </button>
      </div>
    </section>
  );
}
