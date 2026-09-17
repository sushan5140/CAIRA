"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isDemoMode, markDemoMode } from "@/lib/demo/client-store";
import {
  Sparkles,
  Home,
  PlayCircle,
  History,
  User,
  LogOut,
  ArrowUpRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/interview/new", label: "Practice", icon: PlayCircle },
  { href: "/dashboard", label: "Reports", icon: History },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const isInterviewSession =
    pathname.startsWith("/interview/") &&
    pathname !== "/interview/new" &&
    !pathname.endsWith("/report");

  useEffect(() => {
    setDemoMode(isDemoMode());
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || null);
      if (data.user) {
        markDemoMode(false);
        setDemoMode(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
      if (session?.user) {
        markDemoMode(false);
        setDemoMode(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    markDemoMode(false);
    setUserEmail(null);
    setDemoMode(false);
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/interview/new") return pathname.startsWith("/interview");
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 h-[76px] border-b border-stone-200/80 bg-[#fbf8f2]/90 backdrop-blur-xl no-print">
        <div className="mx-auto grid h-full max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start">
            <Link href="/" className="group inline-flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-[15px] border border-indigo-200 bg-white shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
                <div className="absolute inset-1 rounded-[11px] bg-gradient-to-br from-indigo-100 via-white to-emerald-50" />
                <Sparkles className="relative h-4.5 w-4.5 text-indigo-600" />
              </div>
              <div className="leading-none">
                <div className="text-lg font-extrabold tracking-[-0.04em] text-[#1c2437]">CAIRA</div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Interview practice
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center rounded-full border border-stone-200 bg-white/80 p-1 shadow-sm md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-[#1f2940] text-white shadow-sm"
                      : "text-slate-500 hover:bg-stone-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2">
            {isInterviewSession && (
              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 lg:flex">
                <span className="caira-live-dot h-2 w-2 rounded-full bg-emerald-500" />
                Live practice
              </div>
            )}

            {userEmail || demoMode ? (
              <div className="hidden items-center gap-2 sm:flex">
                <div
                  className="max-w-44 truncate rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500"
                  title={userEmail || "Guest practice saved on this device"}
                >
                  {userEmail || "Guest mode"}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                  aria-label={userEmail ? "Sign out" : "Exit guest mode"}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-500 transition-colors hover:text-indigo-600 sm:flex"
                aria-label="Account"
              >
                <User className="h-4 w-4" />
              </Link>
            )}

            <Link href="/interview/new" className="caira-primary-button !rounded-full !px-4 !py-2.5">
              <span className="hidden sm:inline">Start practice</span>
              <span className="sm:hidden">Start</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-[22px] border border-stone-200 bg-white/95 p-1.5 shadow-[0_16px_40px_-18px_rgba(31,41,64,0.45)] backdrop-blur-xl md:hidden no-print">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[17px] text-[10px] font-bold transition-all ${
                active ? "bg-[#1f2940] text-white" : "text-slate-500"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
