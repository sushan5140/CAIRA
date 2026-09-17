"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { markDemoMode } from "@/lib/demo/client-store";
import { Sparkles, Lock, Mail, ArrowRight, User, ShieldCheck } from "lucide-react";

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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Candidate Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create Your CAIRA Account</h1>
          <p className="text-xs text-slate-400">
            Create an account for cloud-backed history, or start immediately as a guest on this device.
          </p>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              isError
                ? "bg-rose-950/40 border border-rose-800/50 text-rose-300"
                : "bg-emerald-950/40 border border-emerald-800/50 text-emerald-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md space-y-5">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="signup-name" className="text-xs font-semibold text-slate-300">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl bg-slate-950/90 border border-slate-800 pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-email" className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl bg-slate-950/90 border border-slate-800 pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-password" className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl bg-slate-950/90 border border-slate-800 pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-60"
            >
              {isLoading ? <span>Creating Account...</span> : <span>Create Account</span>}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={enterGuestMode}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Continue as Guest</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Guest sessions stay in this browser and are not synced across devices.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
