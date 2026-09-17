"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CameraPreview } from "@/components/camera-preview";
import { QuestionCard } from "@/components/question-card";
import { AnswerInput } from "@/components/answer-input";
import { getLocalInterview, saveLocalInterview } from "@/lib/demo/client-store";
import {
  AlertCircle,
  Brain,
  Check,
  Circle,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
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
      const qList = [...(intv.questions || [])].sort((a, b) => a.question_number - b.question_number);
      setInterview({ ...intv, questions: qList });
      setQuestions(qList);

      const unansweredIdx = qList.findIndex((q) => !q.answer_text);
      if (unansweredIdx !== -1) setCurrentQuestionIndex(unansweredIdx);
      else if (qList.length > 0) setCurrentQuestionIndex(qList.length - 1);

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

  const answeredQuestions = useMemo(() => questions.filter((question) => Boolean(question.answer_text)), [questions]);
  const scoredQuestions = useMemo(
    () => answeredQuestions.filter((question) => typeof question.score === "number"),
    [answeredQuestions]
  );
  const runningScore = scoredQuestions.length
    ? Math.round((scoredQuestions.reduce((sum, question) => sum + (question.score || 0), 0) / scoredQuestions.length) * 10) / 10
    : null;

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
          ? { ...question, answer_text: answer, score: evaluation.score, evaluation }
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
        body: JSON.stringify({ localInterview: isGuestInterview ? localInterview : undefined }),
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
        body: JSON.stringify({ localInterview: isGuestInterview ? currentClientInterview() : undefined }),
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
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-indigo-50 text-indigo-600 shadow-sm">
          <Sparkles className="h-6 w-6 animate-spin" />
        </div>
        <div>
          <div className="text-lg font-extrabold tracking-[-0.03em] text-[#1c2437]">Opening your interview room</div>
          <p className="mt-1 text-sm text-slate-500">Restoring progress and preparing the current question.</p>
        </div>
      </div>
    );
  }

  if (isGeneratingReport) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-indigo-50 text-indigo-600 shadow-sm">
          <Brain className="h-7 w-7 animate-pulse" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-[#1c2437]">Turning the conversation into a readiness map</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">CAIRA is combining the turn scores, evidence, strengths, and gaps into your final report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="grid min-h-[calc(100dvh-116px)] overflow-hidden rounded-[30px] border border-stone-200 bg-white/75 shadow-[0_30px_80px_-52px_rgba(31,41,64,0.42)] xl:grid-cols-[230px_minmax(560px,1fr)_320px]">
        <aside className="hidden border-r border-stone-200 bg-[#202941] p-5 text-white xl:block">
          <div className="sticky top-[96px]">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400">
              <span className="caira-live-dot h-2 w-2 rounded-full bg-emerald-400" /> Interview rail
            </div>
            <div className="mt-3 text-sm font-extrabold leading-5 text-white">{interview?.job_role}</div>
            <div className="mt-1 text-[10px] font-medium text-slate-500">{isGuestInterview ? "Guest session · this device" : "Cloud session"}</div>

            <div className="mt-6 space-y-1.5">
              {Array.from({ length: targetTotal }, (_, index) => {
                const number = index + 1;
                const question = questions.find((item) => item.question_number === number);
                const current = currentQuestion?.question_number === number;
                const done = Boolean(question?.answer_text);
                return (
                  <div key={number} className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 ${current ? "bg-white/10" : ""}`}>
                    {index < targetTotal - 1 ? <span className="absolute left-[26px] top-9 h-5 w-px bg-white/10" /> : null}
                    <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-extrabold ${
                      done ? "border-emerald-300 bg-emerald-300 text-[#202941]" : current ? "border-white bg-white text-[#202941]" : "border-white/10 bg-white/5 text-slate-500"
                    }`}>
                      {done ? <Check className="h-3 w-3" /> : number}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-[11px] font-bold ${current ? "text-white" : done ? "text-slate-300" : "text-slate-500"}`}>Question {number}</div>
                      <div className="mt-0.5 truncate text-[9px] text-slate-500">{question?.targets_skill || (current ? "Current turn" : "Adaptive")}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 overflow-hidden rounded-[22px] border border-white/10 bg-white/5 p-2">
              <CameraPreview className="w-full" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:border-r xl:border-stone-200">
          <div className="mx-auto max-w-[840px]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-600">Live interview</div>
                <h1 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#1c2437] sm:text-2xl">Stay in the conversation.</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="caira-chip !bg-white">{answeredQuestions.length} answered</span>
                <span className="caira-chip !bg-white">{targetTotal} total</span>
              </div>
            </div>

            <div className="space-y-4">
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
                <div className="caira-surface p-12 text-center">
                  <Sparkles className="mx-auto h-6 w-6 animate-spin text-indigo-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-500">Preparing the next question...</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden bg-[#fbfaf7] p-6 xl:block">
          <div className="sticky top-[96px]">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
              <Brain className="h-3.5 w-3.5 text-indigo-600" /> Adaptive coach
            </div>
            <h2 className="mt-3 text-xl font-extrabold tracking-[-0.035em] text-[#1c2437]">Reading the interview as it changes.</h2>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <MetricCard label="Progress" value={`${answeredQuestions.length}/${targetTotal}`} icon={TrendingUp} />
              <MetricCard label="Running score" value={runningScore !== null ? `${runningScore}/10` : "—"} icon={Target} />
            </div>

            <div className="mt-5 rounded-[22px] border border-indigo-100 bg-indigo-50/70 p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-700">Current target</div>
              <p className="mt-2 text-sm font-extrabold leading-5 text-indigo-950">{currentQuestion?.targets_skill || "Role-specific reasoning"}</p>
              <p className="mt-2 text-[11px] leading-5 text-indigo-900/70">The next follow-up is generated from what you say here, not from a preloaded question list.</p>
            </div>

            {currentQuestion?.evaluation ? (
              <div className="mt-4 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4 caira-motion-in">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Turn signal
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-emerald-950">{currentQuestion.evaluation.feedback}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] border border-stone-200 bg-white p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Before you answer</div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Anchor your response in one concrete example. Explain the decision, the trade-off, and the result.</p>
              </div>
            )}

            {interview?.extracted_skills?.required_skills?.length ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  <Layers className="h-3.5 w-3.5" /> Competency map
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {interview.extracted_skills.required_skills.map((skill) => {
                    const active = currentQuestion?.targets_skill?.toLowerCase() === skill.toLowerCase();
                    return (
                      <span key={skill} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${active ? "border-indigo-200 bg-indigo-100 text-indigo-700" : "border-stone-200 bg-white text-slate-500"}`}>
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex items-center gap-2 text-[10px] font-semibold leading-4 text-slate-400">
              <Circle className="h-3 w-3 fill-emerald-400 text-emerald-400" />
              Progress is saved after every evaluated turn.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3.5">
      <Icon className="h-3.5 w-3.5 text-indigo-600" />
      <div className="mt-3 text-lg font-extrabold tracking-[-0.04em] text-[#1c2437]">{value}</div>
      <div className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{label}</div>
    </div>
  );
}
