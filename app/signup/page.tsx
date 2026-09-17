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
  User,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const enterGuestMode = () => {
    markDemoMode(true);
    router.push("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else if (data.session) {
        markDemoMode(false);
        router.push("/dashboard");
        router.refresh();
      } else {
        markDemoMode(false);
        setMessage("Account created. Check your email to confirm your address, then sign in.");
      }
    } catch (err: unknown) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-76px)] max-w-[1200px] items-stretch lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="hidden border-r border-stone-200 bg-[#202941] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" /> Build a practice history
          </div>
          <h1 className="mt-7 max-w-md text-5xl font-extrabold leading-[1.02] tracking-[-0.06em]">Keep the lessons from one interview alive in the next.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">Create an account when you want reports and unfinished sessions synced. Guest mode remains available whenever speed matters more than setup.</p>
        </div>

        <div className="space-y-3">
          {["Cross-device interview history", "Saved readiness reports", "Guest practice remains separate"].map((item) => (
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
            <div className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-emerald-700">Create your workspace</div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-[#1c2437]">Create a CAIRA account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use cloud history when you want it, or continue as a guest and keep everything on this device.</p>
          </div>

          {message ? (
            <div className={`mb-4 rounded-2xl border px-4 py-3 text-xs font-semibold ${isError ? "border-rose-100 bg-rose-50 text-rose-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>{message}</div>
          ) : null}

          <div className="caira-surface p-5 sm:p-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="mb-2 block text-xs font-bold text-slate-500">Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="signup-name" type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="caira-input !pl-11" />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-2 block text-xs font-bold text-slate-500">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="signup-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="caira-input !pl-11" />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="mb-2 block text-xs font-bold text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="signup-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="caira-input !pl-11" />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="caira-primary-button w-full disabled:pointer-events-none disabled:opacity-50">
                {isLoading ? "Creating account..." : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300"><span className="h-px flex-1 bg-stone-200" /> or <span className="h-px flex-1 bg-stone-200" /></div>

            <button type="button" onClick={enterGuestMode} className="caira-secondary-button w-full !py-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Continue as Guest
            </button>
            <p className="mt-3 text-center text-[10px] font-medium leading-4 text-slate-400">Guest sessions stay in this browser and are not synced across devices.</p>
          </div>

          <p className="mt-5 text-center text-xs font-semibold text-slate-500">Already have an account? <Link href="/login" className="text-indigo-700 hover:underline">Sign in</Link></p>
        </div>
      </main>
    </div>
  );
}
