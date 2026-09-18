import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="no-print border-t border-stone-200/80 bg-[#f3eee6]/70">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-stone-200 bg-white text-indigo-600 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-[-0.03em] text-[#1c2437]">CAIRA</div>
            <p className="text-[11px] text-slate-500">Practice the conversation, not a question bank.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
          <Link href="/interview/new" className="transition-colors hover:text-indigo-600">Practice</Link>
          <Link href="/dashboard" className="transition-colors hover:text-indigo-600">Reports</Link>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Guest sessions stay on this device
          </span>
        </div>
      </div>
    </footer>
  );
}
