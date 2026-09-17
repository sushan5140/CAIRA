"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ReportSummary } from "@/components/report-summary";
import { getLocalInterview, saveLocalInterview } from "@/lib/demo/client-store";
import { AlertCircle, Sparkles } from "lucide-react";
import type { Interview } from "@/types/interview";

export default function InterviewReportPage() {
  const params = useParams<{ id: string }>();
  const interviewId = params.id;
  const isGuestInterview = interviewId.startsWith("caira-");
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        let intv: Interview | null = isGuestInterview ? getLocalInterview(interviewId) : null;

        if (!intv) {
          const res = await fetch(`/api/interviews/${interviewId}`, { cache: "no-store" });
          if (!res.ok) throw new Error("Could not find interview");
          const data = await res.json();
          intv = data.interview as Interview;
        }

        if (!intv.report) {
          const reportRes = await fetch(`/api/interviews/${interviewId}/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ localInterview: isGuestInterview ? intv : undefined }),
          });
          const reportData = await reportRes.json();
          if (!reportRes.ok) throw new Error(reportData.error || "Report is not ready yet");

          intv = {
            ...intv,
            status: "completed",
            overall_score: reportData.overall_score,
            report: reportData.report,
            completed_at: intv.completed_at || new Date().toISOString(),
          };
        }

        if (isGuestInterview) saveLocalInterview(intv);
        setInterview(intv);
      } catch (err: unknown) {
        console.error("Error loading report:", err);
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [interviewId, isGuestInterview]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-indigo-50 text-indigo-600 shadow-sm">
          <Sparkles className="h-6 w-6 animate-spin" />
        </div>
        <div>
          <div className="text-xl font-extrabold tracking-[-0.035em] text-[#1c2437]">Opening your readiness map</div>
          <p className="mt-1 text-sm text-slate-500">Restoring the report, skills, and turn-level feedback.</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="mx-auto my-16 max-w-md px-4">
        <div className="caira-surface p-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-rose-50 text-rose-600"><AlertCircle className="h-5 w-5" /></div>
          <h2 className="mt-4 text-lg font-extrabold text-[#1c2437]">Report unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{error || "Interview session not found."}</p>
        </div>
      </div>
    );
  }

  return <div className="px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><ReportSummary interview={interview} /></div>;
}
