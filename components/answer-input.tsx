"use client";

import { useState } from "react";
import { MicRecorder } from "./mic-recorder";
import { ScoreBadge } from "./score-badge";
import { Send, ArrowRight, RotateCcw, Check, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [evaluated, setEvaluated] = useState(false);
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

  return (
    <div className="flex flex-col gap-4">
      {/* If evaluated, show turn feedback with option to proceed */}
      {evaluated && evaluationData ? (
        <div className="rounded-2xl bg-slate-900/95 border border-indigo-500/30 p-6 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Turn Evaluation</h3>
                <p className="text-xs text-slate-400">Assessed by CAIRA Gemini Evaluator</p>
              </div>
            </div>

            <ScoreBadge score={evaluationData.score} maxScore={10} size="md" />
          </div>

          <div className="space-y-4 text-sm mb-6">
            {/* Feedback note */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
              <span className="font-semibold text-indigo-300 mr-2">Feedback:</span>
              {evaluationData.feedback}
            </div>

            {/* Strengths & Gaps side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Strengths Observed</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {evaluationData.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Growth Areas / Gaps</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {evaluationData.gaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>{isLastQuestion ? "Complete Interview & View Report" : "Next Question"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl backdrop-blur-md flex flex-col gap-3">
          {/* Speech to text controller */}
          <MicRecorder
            currentTranscript={answerText}
            onTranscriptChange={(newText) => setAnswerText(newText)}
            isEvaluating={isSubmitting}
          />

          {/* Textarea answer editor */}
          <div className="relative">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Speak using the microphone above, or type your answer directly here... Include specific examples, architecture choices, or STAR metrics for best scoring."
              rows={5}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
            />

            {/* Character & Word count */}
            <div className="absolute bottom-2.5 right-3 flex items-center gap-3 text-[11px] text-slate-500 pointer-events-none">
              <span>{wordCount} words</span>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setAnswerText("")}
              disabled={!answerText || isSubmitting}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40 disabled:pointer-events-none px-2 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!answerText.trim() || isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white font-medium text-sm shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
