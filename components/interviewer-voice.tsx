"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Sparkles, Square, Volume2, VolumeX } from "lucide-react";

interface InterviewerVoiceProps {
  jobRole?: string;
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
}

type SpeechPhase = "intro" | "question" | "idle";

export function InterviewerVoice({
  jobRole = "Software Engineer",
  questionNumber,
  totalQuestions,
  questionText,
}: InterviewerVoiceProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPhase, setSpeechPhase] = useState<SpeechPhase>("idle");
  const [isSupported, setIsSupported] = useState(true);
  const [autoPlayBlocked, setAutoPlayBlocked] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");

  const isSpeakingRef = useRef(false);
  const hasIntroducedRef = useRef(false);
  const selectedVoiceNameRef = useRef("");
  const voiceVolumeRef = useRef(1);

  useEffect(() => {
    selectedVoiceNameRef.current = selectedVoiceName;
  }, [selectedVoiceName]);

  useEffect(() => {
    voiceVolumeRef.current = voiceVolume;
  }, [voiceVolume]);

  const discoverVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const available = window.speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang.toLowerCase().startsWith("en"));

    if (!available.length) return;

    setVoices(available);

    const preferred =
      available.find((voice) =>
        /female|zira|jenny|aria|samantha|victoria|karen/i.test(voice.name)
      ) || available[0];

    if (
      !selectedVoiceNameRef.current ||
      !available.some((voice) => voice.name === selectedVoiceNameRef.current)
    ) {
      selectedVoiceNameRef.current = preferred.name;
      setSelectedVoiceName(preferred.name);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    discoverVoices();
    window.speechSynthesis.onvoiceschanged = discoverVoices;

    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, [discoverVoices]);

  const getSelectedVoice = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

    const available = window.speechSynthesis.getVoices();
    return (
      available.find((voice) => voice.name === selectedVoiceNameRef.current) ||
      available[0] ||
      null
    );
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setSpeechPhase("idle");
  }, []);

  const speak = useCallback(
    (text: string, phase: Exclude<SpeechPhase, "idle">, onComplete?: () => void) => {
      if (voiceVolumeRef.current === 0) return;

      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setIsSupported(false);
        return;
      }

      window.speechSynthesis.cancel();

      const chunks =
        text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) ||
        [text];

      let index = 0;
      const voice = getSelectedVoice();

      setAutoPlayBlocked(false);
      setSpeechPhase(phase);
      setIsSpeaking(true);
      isSpeakingRef.current = true;

      const next = () => {
        if (!isSpeakingRef.current || index >= chunks.length) {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          setSpeechPhase("idle");
          onComplete?.();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        if (voice) utterance.voice = voice;
        utterance.rate = 0.98;
        utterance.pitch = 1.04;
        utterance.volume = voiceVolumeRef.current;

        utterance.onend = () => {
          index += 1;
          next();
        };

        utterance.onerror = (event) => {
          console.warn("TTS utterance error:", event);
          if (event.error === "not-allowed") setAutoPlayBlocked(true);
          index += 1;
          next();
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.warn("Speech synthesis play failed:", error);
          setAutoPlayBlocked(true);
          stopSpeaking();
        }
      };

      next();
    },
    [getSelectedVoice, stopSpeaking]
  );

  const startFullSequence = useCallback(() => {
    if (voiceVolumeRef.current === 0) return;

    if (questionNumber === 1 && !hasIntroducedRef.current) {
      hasIntroducedRef.current = true;
      speak(
        `Hello. I am CAIRA, your interviewer today. Welcome to your mock interview for the ${jobRole} position. Let's begin.`,
        "intro",
        () => window.setTimeout(() => speak(questionText, "question"), 320)
      );
      return;
    }

    speak(`Question ${questionNumber}. ${questionText}`, "question");
  }, [jobRole, questionNumber, questionText, speak]);

  const replayQuestion = useCallback(() => {
    speak(questionText, "question");
  }, [questionText, speak]);

  useEffect(() => {
    if (!isSupported) return;

    const timer = window.setTimeout(startFullSequence, 650);

    return () => {
      window.clearTimeout(timer);
      stopSpeaking();
    };
  }, [isSupported, questionNumber, questionText, startFullSequence, stopSpeaking]);

  if (!isSupported) {
    return (
      <div className="mb-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500">
        Voice playback is unavailable in this browser. The interview remains fully usable.
      </div>
    );
  }

  const status =
    speechPhase === "intro"
      ? "Introducing the session"
      : speechPhase === "question"
      ? `Reading question ${questionNumber}`
      : "Ready for your response";

  return (
    <div className="mb-4 flex w-full flex-col gap-3 rounded-[20px] border border-stone-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border transition-[background-color,border-color,color,box-shadow] duration-150 ${
            isSpeaking
              ? "border-indigo-200 bg-indigo-600 text-white shadow-[0_8px_22px_-12px_rgba(91,87,217,0.8)]"
              : "border-indigo-100 bg-indigo-50 text-indigo-600"
          }`}
        >
          <Sparkles className={`h-4 w-4 ${isSpeaking ? "animate-pulse" : ""}`} aria-hidden="true" />
          {isSpeaking ? (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-[#1c2437]">CAIRA interviewer</span>
            <span
              aria-live="polite"
              className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] ${
                speechPhase === "question"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : speechPhase === "intro"
                  ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                  : "border-stone-200 bg-[#f7f3ec] text-slate-500"
              }`}
            >
              {status}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-medium leading-4 text-slate-400">
              {isSpeaking
                ? "Listen, then answer naturally by voice or text."
                : `Question ${questionNumber} of ${totalQuestions} is ready.`}
            </p>

            {voices.length > 1 ? (
              <select
                value={selectedVoiceName}
                onChange={(event) => {
                  selectedVoiceNameRef.current = event.target.value;
                  setSelectedVoiceName(event.target.value);
                  stopSpeaking();
                }}
                className="max-w-40 rounded-lg border border-stone-200 bg-[#fbfaf7] px-2 py-1 text-[10px] font-semibold text-slate-500 outline-none transition-colors duration-150 focus:border-indigo-300"
                aria-label="Interviewer voice"
              >
                {voices.map((voice) => (
                  <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                    {voice.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        {isSpeaking ? (
          <div
            className="mr-1 flex h-9 items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-3"
            aria-hidden="true"
          >
            <span className="caira-wave-1 h-4 w-1 rounded-full bg-indigo-500" />
            <span className="caira-wave-2 h-4 w-1 rounded-full bg-indigo-500" />
            <span className="caira-wave-3 h-4 w-1 rounded-full bg-indigo-500" />
            <span className="caira-wave-4 h-4 w-1 rounded-full bg-indigo-500" />
          </div>
        ) : null}

        {autoPlayBlocked ? (
          <button
            type="button"
            onClick={startFullSequence}
            className="caira-primary-button !min-h-10 !rounded-xl !px-3 !py-2 !text-xs"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Play question
          </button>
        ) : isSpeaking ? (
          <button
            type="button"
            onClick={stopSpeaking}
            className="caira-secondary-button !min-h-10 !rounded-xl !px-3 !py-2 !text-xs"
          >
            <Square className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={questionNumber === 1 ? startFullSequence : replayQuestion}
            className="caira-secondary-button !min-h-10 !rounded-xl !px-3 !py-2 !text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
            Replay
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (voiceVolume > 0) {
              setVoiceVolume(0);
              stopSpeaking();
            } else {
              setVoiceVolume(1);
            }
          }}
          className={`caira-icon-button !h-10 !w-10 !rounded-xl ${
            voiceVolume === 0 ? "!border-rose-100 !bg-rose-50 !text-rose-600" : ""
          }`}
          aria-label={voiceVolume === 0 ? "Unmute interviewer" : "Mute interviewer"}
          aria-pressed={voiceVolume === 0}
        >
          {voiceVolume === 0 ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
