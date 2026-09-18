"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Keyboard, Mic, MicOff, Sparkles, Volume2 } from "lucide-react";

interface MicRecorderProps {
  onTranscriptChange: (transcript: string) => void;
  currentTranscript: string;
  isEvaluating?: boolean;
}

export function MicRecorder({
  onTranscriptChange,
  currentTranscript,
  isEvaluating = false,
}: MicRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const baseTranscriptRef = useRef(currentTranscript);
  const accumulatedFinalRef = useRef("");
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const currentTranscriptRef = useRef(currentTranscript);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    currentTranscriptRef.current = currentTranscript;
  }, [currentTranscript]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) setIsSupported(false);
    }
  }, []);

  const stopAudioFeedback = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startAudioFeedback = async () => {
    stopAudioFeedback();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!isListeningRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      animFrameRef.current = requestAnimationFrame(updateMeter);
    } catch (error) {
      console.warn("Could not start audio meter:", error);
    }
  };

  const startListening = async () => {
    setErrorMessage(null);

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          permissionStream.getTracks().forEach((track) => track.stop());
        } catch (permissionError: any) {
          if (
            permissionError?.name === "NotAllowedError" ||
            permissionError?.name === "PermissionDeniedError"
          ) {
            setErrorMessage(
              "Microphone access is blocked. Allow it from your browser's site controls, then retry."
            );
            return;
          }
          throw permissionError;
        }
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      baseTranscriptRef.current = currentTranscriptRef.current;
      accumulatedFinalRef.current = "";
      setInterimText("");

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let newFinalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const text = result[0]?.transcript || "";
          if (result.isFinal) newFinalChunk += `${text} `;
          else currentInterim += text;
        }

        if (newFinalChunk) {
          accumulatedFinalRef.current += newFinalChunk;
          const base = baseTranscriptRef.current.trim();
          const full = `${base ? `${base} ` : ""}${accumulatedFinalRef.current.trim()}`;
          onTranscriptChangeRef.current(full);
        }

        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);

        if (event.error === "no-speech" || event.error === "aborted") return;

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setErrorMessage(
            "Microphone access is blocked. Allow it from your browser's site controls, then retry."
          );
          isListeningRef.current = false;
          setIsListening(false);
          stopAudioFeedback();
          return;
        }

        setErrorMessage("Voice recognition stopped unexpectedly. You can retry or keep typing.");
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            window.setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch {}
              }
            }, 250);
          }
        } else {
          setIsListening(false);
          setInterimText("");
          stopAudioFeedback();
        }
      };

      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
      recognition.start();
      await startAudioFeedback();
    } catch (error: unknown) {
      console.error("Could not start speech recognition:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to initialize microphone.");
      setIsListening(false);
      isListeningRef.current = false;
      stopAudioFeedback();
    }
  };

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText("");
    stopAudioFeedback();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, [stopAudioFeedback]);

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      stopAudioFeedback();
    };
  }, [stopAudioFeedback]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {isSupported ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              disabled={isEvaluating}
              aria-pressed={isListening}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 ${
                isListening
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" aria-hidden="true" />
                  Stop voice
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  Answer with voice
                </>
              )}
            </button>

            {isListening ? (
              <div
                className="flex min-h-11 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-800"
                aria-live="polite"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Listening
                <div className="ml-1 flex h-5 items-end gap-1" aria-hidden="true">
                  {[10, 16, 12].map((maxHeight, index) => (
                    <span
                      key={index}
                      className="w-1 rounded-full bg-emerald-500 transition-[height] duration-75"
                      style={{ height: `${Math.max(4, (audioLevel / 100) * maxHeight)}px` }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 text-xs font-semibold text-amber-800">
            <Keyboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            Voice input is unavailable here. Type your answer below.
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] font-semibold leading-4 text-slate-400">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden="true" />
          Transcript stays editable
        </div>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-xs font-semibold leading-5 text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={startListening}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 transition-colors duration-150 hover:bg-rose-100"
          >
            Try again
          </button>
        </div>
      ) : null}

      {isListening && interimText ? (
        <div
          className="flex items-start gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs leading-5 text-indigo-950"
          aria-live="polite"
        >
          <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
          <div>
            <span className="font-extrabold text-indigo-700">Hearing you: </span>
            <span className="font-medium">&ldquo;{interimText}&rdquo;</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
