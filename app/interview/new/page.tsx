"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  Settings,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function NewInterviewPage() {
  const router = useRouter();

  const [jobRole, setJobRole] = useState("Senior Full-Stack Engineer");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePdfBase64, setResumePdfBase64] = useState<string | null>(null);
  const [targetQuestions, setTargetQuestions] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const popularRoles = [
    "Senior Full-Stack Engineer",
    "Frontend React Engineer",
    "Backend & Distributed Systems Engineer",
    "Product Manager",
    "Machine Learning Engineer",
    "Engineering Manager",
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf") && !file.type.startsWith("text/")) {
      setError("Please upload a PDF or plain text resume.");
      return;
    }

    setResumeFile(file);
    setError(null);

    const reader = new FileReader();
    if (file.type === "application/pdf") {
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:application/pdf;base64, prefix
        const base64 = result.split(",")[1];
        setResumePdfBase64(base64);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        setResumeText(reader.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobRole.trim()) {
      setError("Please enter or select a job role.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setLoadingMessage("Extracting skills & must-haves via Gemini AI...");

    try {
      const res = await fetch("/api/interviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole: jobRole.trim(),
          jdText: jdText.trim() || undefined,
          resumeText: resumeText.trim() || undefined,
          resumePdfBase64: resumePdfBase64 || undefined,
          targetQuestions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to initialize interview");
      }

      setLoadingMessage("Preparing interview room & opening question...");
      const data = await res.json();

      router.push(`/interview/${data.interview.id}`);
    } catch (err: any) {
      console.error("Interview setup failed:", err);
      setError(err?.message || "Something went wrong while setting up the interview.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Interview Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Set Up Your Mock Interview
        </h1>
        <p className="text-sm text-slate-400">
          Provide your target role, paste the job description, or upload your resume. CAIRA will synthesize key skills and generate personalized questions.
        </p>
      </div>

      <form onSubmit={handleStartInterview} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-sm flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Job Role Input & Quick Presets */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <label htmlFor="jobRole">1. Target Job Role / Title *</label>
          </div>

          <input
            id="jobRole"
            type="text"
            required
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g. Senior Full-Stack Engineer, Staff Product Manager"
            className="w-full rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />

          {/* Role Presets */}
          <div className="pt-1">
            <span className="text-xs text-slate-500 block mb-2">Or select a quick role:</span>
            <div className="flex flex-wrap gap-2">
              {popularRoles.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setJobRole(role)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    jobRole === role
                      ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-200"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Resume Upload (PDF) or Text */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>2. Candidate Resume (Optional)</span>
            </div>
            <span className="text-xs text-slate-500">PDF sent directly to Gemini</span>
          </div>

          {/* Upload Dropzone */}
          <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-5 text-center transition-colors bg-slate-950/40">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <Upload className="w-5 h-5" />
              </div>
              {resumeFile ? (
                <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                  <FileCheck className="w-4 h-4" />
                  <span>{resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-slate-300">
                    Click to upload Resume PDF or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-500">PDF or TXT up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Or Paste Resume Text */}
          {!resumeFile && (
            <div>
              <span className="text-xs text-slate-500 block mb-1">Or paste resume summary/bullets:</span>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste key experience highlights, current tech stack, or achievements..."
                rows={3}
                className="w-full rounded-xl bg-slate-950/90 border border-slate-800 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>
          )}
        </div>

        {/* 3. Job Description (JD) Input */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>3. Job Description / Requirements (Optional)</span>
            </div>
            <span className="text-xs text-slate-500">Improves question precision</span>
          </div>

          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste target job description, required qualifications, or key responsibilities..."
            rows={4}
            className="w-full rounded-xl bg-slate-950/90 border border-slate-800 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
          />
        </div>

        {/* 4. Total Question Count Slider (5 to 10) */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>4. Total Questions</span>
            </div>
            <p className="text-xs text-slate-400">
              Select interview length between 5 and 10 questions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {[5, 6, 7, 8, 10].map((count) => (
              <button
                type="button"
                key={count}
                onClick={() => setTargetQuestions(count)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
                  targetQuestions === count
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Submit & Start CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold text-base shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>{loadingMessage || "Setting up interview..."}</span>
              </>
            ) : (
              <>
                <span>Enter Interview Room</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
