"use client";

import { Award, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";

interface ScoreBadgeProps {
  score: number; // 0-10 or 0-100
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

  const getTier = () => {
    if (normalized >= 85) {
      return {
        label: "Exceptional",
        color: "text-emerald-400 bg-emerald-950/60 border-emerald-700/50",
        icon: Award,
      };
    }
    if (normalized >= 70) {
      return {
        label: "Proficient",
        color: "text-indigo-400 bg-indigo-950/60 border-indigo-700/50",
        icon: CheckCircle2,
      };
    }
    if (normalized >= 50) {
      return {
        label: "Developing",
        color: "text-amber-400 bg-amber-950/60 border-amber-700/50",
        icon: TrendingUp,
      };
    }
    return {
      label: "Needs Depth",
      color: "text-rose-400 bg-rose-950/60 border-rose-700/50",
      icon: AlertCircle,
    };
  };

  const tier = getTier();
  const Icon = tier.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-4 py-2 text-sm",
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${tier.color} ${sizeClasses}`}
    >
      <Icon className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
      <span className="font-semibold tracking-tight">
        {score}
        <span className="opacity-60 text-[10px] ml-0.5">/{maxScore}</span>
      </span>
      {showLabel && (
        <>
          <span className="opacity-40">•</span>
          <span>{tier.label}</span>
        </>
      )}
    </div>
  );
}
