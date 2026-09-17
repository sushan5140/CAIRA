"use client";

import { useEffect, useState } from "react";
import { ReportSummary } from "@/components/report-summary";
import { Sparkles, AlertCircle } from "lucide-react";
import type { Interview } from "@/types/interview";

export default function InterviewReportPage({ params }: { params: { id: string } }) {
  const interviewId = params.id;
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/interviews/${interviewId}`);
        if (!res.ok) throw new Error("Could not find interview");

        const data = await res.json();
        let intv: Interview = data.interview;

        // If report is not yet generated, call report API to compile it
        if (!intv.report) {
          const reportRes = await fetch(`/api/interviews/${interviewId}/report`, {
            method: "POST",
          });
          if (reportRes.ok) {
            const reportData = await reportRes.json();
            intv = {
              ...intv,
              status: "completed",
              overall_score: reportData.overall_score,
              report: reportData.report,
            };
          }
        }

        setInterview(intv);
      } catch (err: any) {
        console.error("Error loading report:", err);
        setError(err?.message || "Failed to load report");
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [interviewId]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-300 font-medium">Generating Comprehensive Readiness Report...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-base font-semibold text-white">Report Unavailable</h2>
        <p className="text-xs text-slate-400">{error || "Interview session not found."}</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <ReportSummary interview={interview} />
    </div>
  );
}
