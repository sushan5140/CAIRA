"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CameraPreview } from "@/components/camera-preview";
import { QuestionCard } from "@/components/question-card";
import { AnswerInput } from "@/components/answer-input";
import { getLocalInterview, saveLocalInterview } from "@/lib/demo/client-store";
import { Sparkles, Layers, AlertCircle, Brain } from "lucide-react";
import type { Interview, InterviewQuestion, AnswerEvaluationResult } from "@/types/interview";

export default function InterviewRoomPage() {
  const params = useParams<{ id: string }>();
  const interviewId = params.id;
  const router = useRouter();
  const isGuestInterview = interviewId.startsWith("caira-");

  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyInterview = useCallback(
    (intv: Interview) => {
      const qList = [...(intv.questions || [])].sort(
        (a, b) => a.question_number - b.question_number
      );
      setInterview({ ...intv, questions: qList });
      setQuestions(qList);

      const unansweredIdx = qList.findIndex((q) => !q.answer_text);
      if (unansweredIdx !== -1) {
        setCurrentQuestionIndex(unansweredIdx);
      } else if (qList.length > 0) {
        setCurrentQuestionIndex(qList.length - 1);
      }

      if (isGuestInterview) saveLocalInterview({ ...intv, questions: qList });
    },
    [isGuestInterview]
  );

  const loadInterview = useCallback(async () => {
    try {
      if (isGuestInterview) {
        const local = getLocalInterview(interviewId);
        if (local) {
          if (local.status === "completed") {
            router.replace(`/interview/${interviewId}/report`);
            return;
          }
          applyInterview(local);
          return;
        }
      }

      const res = await fetch(`/api/interviews/${interviewId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Interview not found");

      const data = await res.json();
      const intv: Interview = data.interview;
      if (intv.status === "completed") {
        if (isGuestInterview) saveLocalInterview(intv);
        router.replace(`/interview/${interviewId}/report`);
        return;
      }
      applyInterview(intv);
    } catch (err: unknown) {
      console.error("Failed to load interview room:", err);
      setError(err instanceof Error ? err.message : "Could not load interview session");
    } finally {
      setIsLoading(false);
    }
  }, [applyInterview, interviewId, isGuestInterview, router]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  const currentQuestion = questions[currentQuestionIndex];
  const targetTotal = interview?.target_questions || 5;
  const isLastQuestion = (currentQuestion?.question_number || 1) >= targetTotal;

  const currentClientInterview = useCallback((): Interview | null => {
    if (!interview) return null;
    return { ...interview, questions };
  }, [interview, questions]);

  const handleSubmitAnswer = async (answer: string): Promise<AnswerEvaluationResult | null> => {
    if (!currentQuestion || !interview) return null;

    setIsEvaluating(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${interviewId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answerText: answer,
          localInterview: isGuestInterview ? currentClientInterview() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate answer");

      const evaluation: AnswerEvaluationResult = data.evaluation;
      const updatedQuestions = questions.map((question) =>
        question.id === currentQuestion.id
          ? {
              ...question,
              answer_text: answer,
              score: evaluation.score,
              evaluation,
            }
          : question
      );

      const nextInterview: Interview = { ...interview, questions: updatedQuestions };
      setQuestions(updatedQuestions);
      setInterview(nextInterview);
      if (isGuestInterview) saveLocalInterview(nextInterview);

      return evaluation;
    } catch (err: unknown) {
      console.error("Answer submission error:", err);
      setError(err instanceof Error ? err.message : "Evaluation failed. Please try again.");
      return null;
    } finally {
      setIsEvaluating(false);
    }
  };

  const finalizeReport = useCallback(async () => {
    if (!interview) return;

    setIsGeneratingReport(true);
    setError(null);

    try {
      const localInterview = { ...interview, questions };
      const res = await fetch(`/api/interviews/${interviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localInterview: isGuestInterview ? localInterview : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to compile final report");

      const completedInterview: Interview = {
        ...localInterview,
        status: "completed",
        report: data.report,
        overall_score: data.overall_score,
        completed_at: new Date().toISOString(),
      };

      if (isGuestInterview) saveLocalInterview(completedInterview);
      setInterview(completedInterview);
      router.push(`/interview/${interviewId}/report`);
    } catch (err: unknown) {
      console.error("Report generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to finalize the report. Please try again.");
      setIsGeneratingReport(false);
    }
  }, [interview, interviewId, isGuestInterview, questions, router]);

  const handleNextQuestion = async () => {
    if (!interview) return;
    if (isLastQuestion) {
      await finalizeReport();
      return;
    }

    setIsLoadingNext(true);
    setError(null);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localInterview: isGuestInterview ? currentClientInterview() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate follow-up question");

      if (data.question) {
        const alreadyExists = questions.some((question) => question.id === data.question.id);
        const newQuestions = alreadyExists
          ? questions
          : [...questions, data.question].sort((a, b) => a.question_number - b.question_number);
        const nextIndex = newQuestions.findIndex((question) => question.id === data.question.id);
        const nextInterview = { ...interview, questions: newQuestions };

        setQuestions(newQuestions);
        setInterview(nextInterview);
        setCurrentQuestionIndex(nextIndex >= 0 ? nextIndex : newQuestions.length - 1);
        if (isGuestInterview) saveLocalInterview(nextInterview);
      } else if (data.completed) {
        await finalizeReport();
      }
    } catch (err: unknown) {
      console.error("Failed to fetch next question:", err);
      setError(err instanceof Error ? err.message : "Failed to generate follow-up question.");
    } finally {
      setIsLoadingNext(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-300 font-medium">Entering CAIRA Interview Room...</p>
      </div>
    );
  }

  if (isGeneratingReport) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
          <Brain className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Synthesizing Interview Performance</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            CAIRA is analyzing your answers, communication, and role-specific depth to build your final readiness report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-sm font-semibold text-slate-200">
            Mock Interview: <span className="text-indigo-300">{interview?.job_role}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
            Question {currentQuestion?.question_number || 1} of {targetTotal}
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-400">
            {isGuestInterview ? "Guest Practice • saved on this device" : "Adaptive Dialogue Mode"}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-4">
          <CameraPreview className="w-full" />

          {interview?.extracted_skills && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Targeted Competencies
                </span>
                <span className="text-[10px] text-slate-500 uppercase">
                  {interview.extracted_skills.seniority_level} Level
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {interview.extracted_skills.required_skills?.map((skill, idx) => {
                  const isCurrent = currentQuestion?.targets_skill?.toLowerCase() === skill.toLowerCase();
                  return (
                    <span
                      key={idx}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        isCurrent
                          ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-200 font-medium"
                          : "bg-slate-950/60 border-slate-800/80 text-slate-400"
                      }`}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>

              {interview.extracted_skills.key_focus_areas && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                    Assessment Focus
                  </span>
                  <p className="leading-snug">
                    {interview.extracted_skills.key_focus_areas.join(" • ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-5">
          {currentQuestion ? (
            <>
              <QuestionCard
                questionNumber={currentQuestion.question_number}
                totalQuestions={targetTotal}
                questionText={currentQuestion.question_text}
                questionType={currentQuestion.question_type}
                targetsSkill={currentQuestion.targets_skill}
                isLoadingNext={isLoadingNext}
                jobRole={interview?.job_role}
              />

              <AnswerInput
                key={currentQuestion.id}
                onSubmitAnswer={handleSubmitAnswer}
                onNextQuestion={handleNextQuestion}
                isSubmitting={isEvaluating}
                lastEvaluation={currentQuestion.evaluation}
                isLastQuestion={isLastQuestion}
              />
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 rounded-2xl bg-slate-900 border border-slate-800">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto animate-spin mb-2" />
              <p className="text-sm">Preparing question...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
