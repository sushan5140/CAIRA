"use client";

import { Award, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";

interface ScoreBadgeProps {
  score: number;
  maxScore?: 10 | 100;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreBadge({
  score,
  maxScore = 10,
  size = "md",
  showLabel = true,
}: ScoreBadgeProps) {
  const normalized = maxScore === 10 ? score * 10 : score;

  const tier = normalized >= 85
    ? { label: "Exceptional", color: "border-emerald-100 bg-emerald-50 text-emerald-700", icon: Award }
    : normalized >= 70
    ? { label: "Proficient", color: "border-indigo-100 bg-indigo-50 text-indigo-700", icon: CheckCircle2 }
    : normalized >= 50
    ? { label: "Developing", color: "border-amber-100 bg-amber-50 text-amber-700", icon: TrendingUp }
    : { label: "Needs depth", color: "border-rose-100 bg-rose-50 text-rose-700", icon: AlertCircle };

  const Icon = tier.icon;
  const sizeClasses = {
    sm: "px-2.5 py-1 text-[10px]",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm",
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${tier.color} ${sizeClasses}`}>
      <Icon className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      <span className="tracking-tight">
        {score}
        <span className="ml-0.5 text-[9px] opacity-55">/{maxScore}</span>
      </span>
      {showLabel ? (
        <>
          <span className="opacity-25">•</span>
          <span>{tier.label}</span>
        </>
      ) : null}
    </div>
  );
}
