"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Keyboard, Volume2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

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

  // References to avoid stale closures in callbacks
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const baseTranscriptRef = useRef(currentTranscript);
  const accumulatedFinalRef = useRef("");
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const currentTranscriptRef = useRef(currentTranscript);

  // Audio analyser for real-time mic visual feedback
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Keep refs synchronized with latest props
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    currentTranscriptRef.current = currentTranscript;
  }, [currentTranscript]);

  // Check Web Speech API availability on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  // Setup Audio Analyser for visual speech feedback
  const startAudioFeedback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
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
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };

        animFrameRef.current = requestAnimationFrame(updateMeter);
      }
    } catch (err) {
      console.warn("Could not start audio meter:", err);
    }
  };

  const stopAudioFeedback = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  // Start Speech Recognition
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
      // 1. Request microphone permission explicitly
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permErr: any) {
          if (permErr.name === "NotAllowedError" || permErr.name === "PermissionDeniedError") {
            setErrorMessage("Microphone access denied. Please allow microphone permissions in your browser address bar.");
            return;
          }
        }
      }

      // 2. Abort any previous running instance cleanly
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
        recognitionRef.current = null;
      }

      // 3. Capture baseline transcript before this voice session
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
          const res = event.results[i];
          const text = res[0]?.transcript || "";
          if (res.isFinal) {
            newFinalChunk += text + " ";
          } else {
            currentInterim += text;
          }
        }

        if (newFinalChunk) {
          accumulatedFinalRef.current += newFinalChunk;
          const base = baseTranscriptRef.current ? baseTranscriptRef.current.trim() : "";
          const full = (base ? base + " " : "") + accumulatedFinalRef.current.trim();
          onTranscriptChangeRef.current(full);
        }

        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          // Standard browser silence event - keep listening
          return;
        }
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setErrorMessage("Microphone access denied. Please click the lock or camera/mic icon in your browser URL bar to allow microphone access.");
          isListeningRef.current = false;
          setIsListening(false);
          stopAudioFeedback();
          return;
        }
        if (event.error === "aborted") {
          return;
        }
      };

      recognition.onend = () => {
        // If user didn't explicitly stop, auto-restart to maintain continuous listening
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (_) {}
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
      recognition.start();

      setIsListening(true);
      isListeningRef.current = true;

      // Start audio feedback meter
      startAudioFeedback();
    } catch (err: any) {
      console.error("Could not start speech recognition:", err);
      setErrorMessage(err?.message || "Failed to initialize microphone.");
      setIsListening(false);
      isListeningRef.current = false;
      stopAudioFeedback();
    }
  };

  // Stop Speech Recognition
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText("");
    stopAudioFeedback();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      stopAudioFeedback();
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isSupported ? (
            <button
              type="button"
              onClick={toggleListening}
              disabled={isEvaluating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 ${
                isListening
                  ? "bg-rose-500/25 border border-rose-500/50 text-rose-300 hover:bg-rose-500/35 ring-2 ring-rose-500/30 animate-pulse"
                  : "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-600/35 hover:text-white"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-rose-400" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-indigo-400" />
                  <span>Answer with Voice (Start Recording)</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/40">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Voice recognition unavailable in this browser. Please type your answer directly below.</span>
            </div>
          )}

          {/* Active Listening indicator & Mic volume meter */}
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Listening & transcribing...</span>

              {/* Dynamic waveform levels */}
              <div className="flex items-center gap-0.5 ml-1 h-3.5">
                <span
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(3, (audioLevel / 100) * 14)}px` }}
                />
                <span
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(5, (audioLevel / 100) * 18)}px` }}
                />
                <span
                  className="w-1 bg-emerald-300 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(3, (audioLevel / 100) * 12)}px` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Speak naturally — voice transcribes in real time below</span>
        </div>
      </div>

      {/* Error message / permission guidance */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={startListening}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-[11px] font-medium transition-colors shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Real-time live speech feedback pill */}
      {isListening && interimText && (
        <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2 backdrop-blur-sm animate-in fade-in duration-150">
          <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="font-semibold text-indigo-300 mr-1.5">Hearing you:</span>
            <span className="italic text-slate-100">&ldquo;{interimText}&rdquo;</span>
          </div>
        </div>
      )}
    </div>
  );
}
