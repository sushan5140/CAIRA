"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { markDemoMode } from "@/lib/demo/client-store";
import {
  ArrowRight,
  Check,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const enterGuestMode = () => {
    markDemoMode(true);
    router.push("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Cloud auth is not configured here — opening device-only guest mode.");
      markDemoMode(true);
      router.push("/dashboard");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        markDemoMode(false);
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-76px)] max-w-[1200px] items-stretch lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="hidden border-r border-stone-200 bg-[#202941] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" /> Candidate workspace
          </div>
          <h1 className="mt-7 max-w-md text-5xl font-extrabold leading-[1.02] tracking-[-0.06em]">Come back to the conversation you were practicing.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">A cloud account keeps reports and sessions across devices. Guest mode stays fast and local when you just want to practice.</p>
        </div>

        <div className="space-y-3">
          {["Resume unfinished sessions", "Keep reports in one place", "Guest mode remains available"].map((item) => (
            <div key={item} className="flex items-center gap-3 text-xs font-semibold text-slate-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-emerald-300"><Check className="h-3.5 w-3.5" /></span>
              {item}
            </div>
          ))}
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md caira-motion-in">
          <div className="mb-7">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-indigo-600">Welcome back</div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-[#1c2437]">Sign in to CAIRA</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Or skip the account completely and continue with practice stored on this device.</p>
          </div>

          {message ? (
            <div className={`mb-4 rounded-2xl border px-4 py-3 text-xs font-semibold ${isError ? "border-rose-100 bg-rose-50 text-rose-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>{message}</div>
          ) : null}

          <div className="caira-surface p-5 sm:p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-xs font-bold text-slate-500">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="caira-input !pl-11" />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-xs font-bold text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="login-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="caira-input !pl-11" />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="caira-primary-button w-full disabled:pointer-events-none disabled:opacity-50">
                {isLoading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300"><span className="h-px flex-1 bg-stone-200" /> or <span className="h-px flex-1 bg-stone-200" /></div>

            <button type="button" onClick={enterGuestMode} className="caira-secondary-button w-full !py-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Continue as Guest
            </button>
            <p className="mt-3 text-center text-[10px] font-medium leading-4 text-slate-400">Guest interview history stays in this browser and is not synced across devices.</p>
          </div>

          <p className="mt-5 text-center text-xs font-semibold text-slate-500">New here? <Link href="/signup" className="text-indigo-700 hover:underline">Create an account</Link></p>
        </div>
      </main>
    </div>
  );
}
