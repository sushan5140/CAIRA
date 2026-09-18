"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveLocalInterview } from "@/lib/demo/client-store";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  FileCheck,
  FileText,
  Layers,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const steps = [
  { label: "Role", note: "Choose the interview target", icon: Briefcase },
  { label: "Evidence", note: "Add your resume or background", icon: FileText },
  { label: "Job brief", note: "Give CAIRA the role context", icon: Layers },
  { label: "Session", note: "Set the practice length", icon: WandSparkles },
];

const popularRoles = [
  "Senior Full-Stack Engineer",
  "Frontend React Engineer",
  "Backend & Distributed Systems Engineer",
  "Product Manager",
  "Machine Learning Engineer",
  "Engineering Manager",
];

export default function NewInterviewPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [jobRole, setJobRole] = useState("Senior Full-Stack Engineer");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targetQuestions, setTargetQuestions] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const completion = useMemo(
    () => [
      Boolean(jobRole.trim()),
      Boolean(resumeFile || resumeText.trim()),
      Boolean(jdText.trim()),
      Boolean(targetQuestions),
    ],
    [jobRole, resumeFile, resumeText, jdText, targetQuestions]
  );

  const progress = Math.round(((activeStep + 1) / steps.length) * 100);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isText = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");

    if (!isPdf && !isText) {
      setError("Please upload a PDF or plain text resume.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError("Resume must be 10MB or smaller.");
      e.target.value = "";
      return;
    }

    setResumeFile(file);
    setResumeText("");
    setError(null);
  };

  const handleStartInterview = async () => {
    if (!jobRole.trim()) {
      setError("Choose or enter a target role before starting.");
      setActiveStep(0);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let uploadedResumePath: string | undefined;
      let uploadedResumeText = resumeText.trim() || undefined;
      let uploadedResumePdfBase64: string | undefined;

      if (resumeFile) {
        setLoadingMessage("Uploading your resume securely...");
        const formData = new FormData();
        formData.append("file", resumeFile);

        const uploadRes = await fetch("/api/upload/resume", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload resume");

        uploadedResumePath = uploadData.storagePath || undefined;
        uploadedResumeText = uploadData.text || undefined;
        uploadedResumePdfBase64 = uploadData.base64 || undefined;
      }

      setLoadingMessage("Mapping role skills and interview focus...");
      const res = await fetch("/api/interviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole: jobRole.trim(),
          jdText: jdText.trim() || undefined,
          resumeText: uploadedResumeText,
          resumePdfBase64: uploadedResumePdfBase64,
          resumePath: uploadedResumePath,
          targetQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize interview");

      setLoadingMessage("Opening your interview room...");
      saveLocalInterview(data.interview);
      router.push(`/interview/${data.interview.id}`);
    } catch (err: unknown) {
      console.error("Interview setup failed:", err);
      setError(err instanceof Error ? err.message : "Something went wrong while setting up the interview.");
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (activeStep === 0 && !jobRole.trim()) {
      setError("Choose or enter a target role first.");
      return;
    }
    setError(null);
    setActiveStep((step) => Math.min(steps.length - 1, step + 1));
  };

  const renderCanvas = () => {
    if (activeStep === 0) {
      return (
        <div className="caira-motion-in" key="role-step">
          <div className="mb-2 text-sm font-bold text-indigo-600">Step 1 · Target</div>
          <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#1c2437] sm:text-4xl">Who are you interviewing as?</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">The title shapes the seniority, skills, technical depth, and follow-up style CAIRA uses.</p>

          <div className="mt-8">
            <label htmlFor="jobRole" className="mb-2 block text-xs font-bold text-slate-500">Target role</label>
            <input
              id="jobRole"
              value={jobRole}
              maxLength={160}
              onChange={(e) => setJobRole(e.target.value)}
              className="caira-input !py-4 !text-base !font-semibold"
              placeholder="e.g. Frontend Engineer"
              autoFocus
            />
          </div>

          <div className="mt-6">
            <div className="mb-3 text-xs font-bold text-slate-400">Quick roles</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {popularRoles.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setJobRole(role)}
                  className={`rounded-2xl border p-3 text-left text-sm font-semibold transition-all ${
                    jobRole === role
                      ? "border-indigo-200 bg-indigo-50 text-indigo-800 shadow-sm"
                      : "border-stone-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-indigo-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{role}</span>
                    {jobRole === role ? <Check className="h-4 w-4 text-indigo-600" /> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeStep === 1) {
      return (
        <div className="caira-motion-in" key="evidence-step">
          <div className="mb-2 text-sm font-bold text-indigo-600">Step 2 · Evidence</div>
          <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#1c2437] sm:text-4xl">Give the interviewer something real to work with.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Optional, but useful: your resume lets CAIRA ask questions around the work you actually claim and the technologies you actually use.</p>

          <div className="relative mt-8 overflow-hidden rounded-[24px] border-2 border-dashed border-stone-200 bg-[#fbfaf7] p-7 text-center transition-all hover:border-indigo-200 hover:bg-indigo-50/30">
            <input
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={handleFileUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Upload resume"
            />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
              {resumeFile ? <FileCheck className="h-5 w-5 text-emerald-600" /> : <Upload className="h-5 w-5" />}
            </div>
            {resumeFile ? (
              <div className="mt-3">
                <div className="text-sm font-extrabold text-emerald-800">{resumeFile.name}</div>
                <div className="mt-1 text-xs font-medium text-slate-400">{(resumeFile.size / 1024).toFixed(1)} KB · ready</div>
              </div>
            ) : (
              <div className="mt-3">
                <div className="text-sm font-extrabold text-[#1c2437]">Drop or choose a resume</div>
                <div className="mt-1 text-xs text-slate-400">PDF or TXT · up to 10MB</div>
              </div>
            )}
          </div>

          {!resumeFile ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-3 text-xs font-bold text-slate-400">
                <span className="h-px flex-1 bg-stone-200" /> or paste the useful bits <span className="h-px flex-1 bg-stone-200" />
              </div>
              <textarea
                value={resumeText}
                maxLength={40000}
                onChange={(e) => setResumeText(e.target.value)}
                rows={7}
                className="caira-input resize-none !leading-6"
                placeholder="Experience, projects, technical stack, achievements, leadership examples..."
              />
            </div>
          ) : null}
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div className="caira-motion-in" key="brief-step">
          <div className="mb-2 text-sm font-bold text-indigo-600">Step 3 · Context</div>
          <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#1c2437] sm:text-4xl">What does this company actually want?</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Paste the job description, key requirements, or just the parts you care about. CAIRA will use it to tune the competency map.</p>

          <div className="mt-8 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
            <textarea
              value={jdText}
              maxLength={40000}
              onChange={(e) => setJdText(e.target.value)}
              rows={14}
              className="w-full resize-none border-0 bg-transparent p-2 text-sm leading-7 text-[#1c2437] outline-none placeholder:text-slate-400"
              placeholder="Paste responsibilities, requirements, team context, or the full job description..."
            />
            <div className="flex items-center justify-between border-t border-stone-100 px-2 pt-3 text-[11px] font-semibold text-slate-400">
              <span>Optional context</span>
              <span>{jdText.length.toLocaleString()} / 40,000</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="caira-motion-in" key="session-step">
        <div className="mb-2 text-sm font-bold text-indigo-600">Step 4 · Session</div>
        <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#1c2437] sm:text-4xl">How deep should CAIRA go?</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">A shorter run is useful for focused practice. A longer run gives the adaptive interviewer more room to probe different competencies.</p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[5, 6, 7, 8, 10].map((count) => (
            <button
              type="button"
              key={count}
              onClick={() => setTargetQuestions(count)}
              className={`group rounded-[24px] border p-5 text-center transition-all ${
                targetQuestions === count
                  ? "border-indigo-200 bg-indigo-50 text-indigo-800 shadow-sm"
                  : "border-stone-200 bg-white text-slate-600 hover:-translate-y-1 hover:border-indigo-100"
              }`}
            >
              <div className="text-3xl font-extrabold tracking-[-0.05em]">{count}</div>
              <div className="mt-1 text-[11px] font-bold text-slate-400">Questions</div>
            </button>
          ))}
        </div>

        <div className="mt-7 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-5">
          <div className="text-xs font-bold text-emerald-700">Ready room</div>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">CAIRA will open with one substantive question, then change direction based on your answers instead of revealing a fixed list.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {isSubmitting ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f8f5ef]/90 px-4 backdrop-blur-md">
          <div className="caira-surface w-full max-w-md p-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-indigo-50 text-indigo-600">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div className="mt-5 text-xl font-extrabold tracking-[-0.035em] text-[#1c2437]">Building your interview room</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{loadingMessage || "Preparing the session..."}</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-5 flex items-center justify-between gap-4 lg:hidden">
        <div>
          <div className="text-xs font-bold text-indigo-600">Interview builder</div>
          <div className="mt-1 text-sm font-bold text-[#1c2437]">{steps[activeStep].label}</div>
        </div>
        <div className="text-xs font-bold text-slate-400">{activeStep + 1} / 4</div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>
      ) : null}

      <div className="grid min-h-[calc(100dvh-130px)] overflow-hidden rounded-[30px] border border-stone-200/90 bg-white/70 shadow-[0_30px_80px_-52px_rgba(31,41,64,0.45)] lg:grid-cols-[230px_minmax(520px,1fr)_320px]">
        <aside className="hidden border-r border-stone-200 bg-[#202941] p-5 text-white lg:block">
          <div className="text-xs font-bold text-slate-400">Interview builder</div>
          <div className="mt-5 space-y-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const current = index === activeStep;
              const done = completion[index] && index < activeStep;
              return (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`relative flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-all ${current ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  {index < steps.length - 1 ? <span className="absolute left-[26px] top-10 h-8 w-px bg-white/10" /> : null}
                  <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-extrabold ${
                    done ? "border-emerald-300 bg-emerald-300 text-[#202941]" : current ? "border-white bg-white text-[#202941]" : "border-white/15 bg-white/5 text-slate-400"
                  }`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className="pt-0.5">
                    <span className={`block text-xs font-extrabold ${current ? "text-white" : "text-slate-300"}`}>{step.label}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-slate-500">{step.note}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] font-bold text-indigo-200">Why this flow?</div>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">One decision at a time keeps setup focused while the coach builds context beside you.</p>
          </div>
        </aside>

        <main className="min-w-0 border-stone-200 px-5 py-7 sm:px-8 sm:py-9 lg:border-r lg:px-10 lg:py-10">
          <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-stone-100 lg:hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="mx-auto max-w-[720px]">{renderCanvas()}</div>

          <div className="mx-auto mt-9 flex max-w-[720px] items-center justify-between border-t border-stone-100 pt-5">
            <button
              type="button"
              onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
              disabled={activeStep === 0}
              className="caira-secondary-button disabled:pointer-events-none disabled:opacity-35"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {activeStep < steps.length - 1 ? (
              <button type="button" onClick={goNext} className="caira-primary-button">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleStartInterview} className="caira-primary-button">
                Enter interview room <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </main>

        <aside className="hidden bg-[#fbfaf7] p-6 lg:block">
          <div className="sticky top-[100px]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> CAIRA coach
            </div>
            <h2 className="mt-3 text-xl font-extrabold tracking-[-0.035em] text-[#1c2437]">Your interview is taking shape.</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">This panel updates as you build the session, so you always know what CAIRA has enough context to use.</p>

            <div className="mt-6 space-y-3">
              <SummaryRow label="Role" value={jobRole.trim() || "Not chosen"} ready={Boolean(jobRole.trim())} />
              <SummaryRow label="Resume" value={resumeFile?.name || (resumeText.trim() ? "Background pasted" : "Optional")} ready={Boolean(resumeFile || resumeText.trim())} optional />
              <SummaryRow label="Job context" value={jdText.trim() ? "Added" : "Optional"} ready={Boolean(jdText.trim())} optional />
              <SummaryRow label="Length" value={`${targetQuestions} questions`} ready />
            </div>

            <div className="mt-6 rounded-[22px] border border-indigo-100 bg-indigo-50/70 p-4">
              <div className="text-[11px] font-bold text-indigo-700">Current focus</div>
              <p className="mt-2 text-xs font-semibold leading-5 text-indigo-950">{steps[activeStep].note}. You can move between steps without losing anything.</p>
            </div>

            <button
              type="button"
              onClick={handleStartInterview}
              disabled={!jobRole.trim() || isSubmitting}
              className="caira-primary-button mt-6 w-full disabled:pointer-events-none disabled:opacity-45"
            >
              Start with this setup <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  ready,
  optional = false,
}: {
  label: string;
  value: string;
  ready: boolean;
  optional?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-slate-400">{label}</div>
          <div className="mt-1 truncate text-xs font-bold text-[#1c2437]">{value}</div>
        </div>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ready ? "bg-emerald-100 text-emerald-700" : optional ? "bg-stone-100 text-stone-400" : "bg-amber-100 text-amber-700"}`}>
          {ready ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        </span>
      </div>
    </div>
  );
}
