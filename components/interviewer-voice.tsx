"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, RotateCcw, Sparkles, Play, Square, UserCheck } from "lucide-react";

interface InterviewerVoiceProps {
  jobRole?: string;
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
}

export function InterviewerVoice({
  jobRole = "Software Engineer",
  questionNumber,
  totalQuestions,
  questionText,
}: InterviewerVoiceProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPhase, setSpeechPhase] = useState<"intro" | "question" | "idle">("idle");
  const [isSupported, setIsSupported] = useState(true);
  const [autoPlayBlocked, setAutoPlayBlocked] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(1); // 1 = unmuted, 0 = muted
  const [femaleVoices, setFemaleVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  const hasIntroducedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const selectedVoiceNameRef = useRef("");

  // Sync selected voice name ref
  useEffect(() => {
    selectedVoiceNameRef.current = selectedVoiceName;
  }, [selectedVoiceName]);

  // Discover and filter all available female English voices
  const discoverFemaleVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const allVoices = window.speechSynthesis.getVoices();
    if (!allVoices || allVoices.length === 0) return;

    const englishVoices = allVoices.filter((v) => v.lang.startsWith("en"));

    const femaleKeywords = [
      "google uk english female",
      "zira",
      "jenny",
      "aria",
      "samantha",
      "victoria",
      "karen",
      "hazel",
      "susan",
      "catherine",
      "female",
      "woman",
      "girl",
    ];

    const maleKeywords = [
      "david",
      "mark",
      "male",
      "george",
      "guy",
      "daniel",
      "richard",
      "james",
      "ravi",
      "sean",
      "stefan",
    ];

    // Find all voices that are female and not male
    let matched = englishVoices.filter((v) => {
      const name = v.name.toLowerCase();
      const hasFemale = femaleKeywords.some((k) => name.includes(k));
      const hasMale = maleKeywords.some((m) => name.includes(m));
      return hasFemale && !hasMale;
    });

    // Fallback: exclude any known male names
    if (matched.length === 0) {
      matched = englishVoices.filter(
        (v) => !maleKeywords.some((m) => v.name.toLowerCase().includes(m))
      );
    }

    if (matched.length > 0) {
      setFemaleVoices(matched);

      // Default to Google UK English Female or Microsoft Zira if available
      const topPick =
        matched.find((v) => v.name.toLowerCase().includes("google uk english female")) ||
        matched.find((v) => v.name.toLowerCase().includes("zira")) ||
        matched.find((v) => v.name.toLowerCase().includes("female")) ||
        matched[0];

      if (!selectedVoiceNameRef.current || !matched.some((v) => v.name === selectedVoiceNameRef.current)) {
        setSelectedVoiceName(topPick.name);
        selectedVoiceNameRef.current = topPick.name;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    discoverFemaleVoices();
    window.speechSynthesis.onvoiceschanged = discoverFemaleVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [discoverFemaleVoices]);

  // Helper to get selected female voice object
  const getSelectedFemaleVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const allVoices = window.speechSynthesis.getVoices();
    if (!allVoices || allVoices.length === 0) return null;

    if (selectedVoiceNameRef.current) {
      const found = allVoices.find((v) => v.name === selectedVoiceNameRef.current);
      if (found) return found;
    }

    // Fallback directly to any female voice
    const femaleVoice =
      allVoices.find((v) => v.name.toLowerCase().includes("google uk english female")) ||
      allVoices.find((v) => v.name.toLowerCase().includes("zira")) ||
      allVoices.find((v) => v.name.toLowerCase().includes("female") && !v.name.toLowerCase().includes("male"));

    return femaleVoice || allVoices[0] || null;
  }, []);

  // Split text into natural spoken sentences to prevent browser TTS cutoff
  const splitSentences = (text: string): string[] => {
    const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
    return matches ? matches.map((s) => s.trim()).filter(Boolean) : [text];
  };

  // Speaks an array of sentences sequentially with female voice tuning
  const speakSentences = useCallback(
    (
      sentences: string[],
      onPhaseChange?: (phase: "intro" | "question" | "idle") => void,
      phaseName?: "intro" | "question",
      onComplete?: () => void
    ) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setIsSupported(false);
        return;
      }

      window.speechSynthesis.cancel();

      if (sentences.length === 0) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        setSpeechPhase("idle");
        onComplete?.();
        return;
      }

      setIsSpeaking(true);
      isSpeakingRef.current = true;
      if (phaseName) {
        setSpeechPhase(phaseName);
        onPhaseChange?.(phaseName);
      }

      let index = 0;
      const voice = getSelectedFemaleVoice();

      const speakNext = () => {
        if (!isSpeakingRef.current || index >= sentences.length) {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          setSpeechPhase("idle");
          onComplete?.();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(sentences[index]);
        if (voice) utterance.voice = voice;
        utterance.rate = 0.98; // Natural, clear interviewer pacing
        utterance.pitch = 1.06; // Refined natural female pitch
        utterance.volume = voiceVolume;

        utterance.onend = () => {
          index++;
          speakNext();
        };

        utterance.onerror = (e) => {
          console.warn("TTS utterance error:", e);
          if (e.error === "not-allowed") {
            setAutoPlayBlocked(true);
          }
          index++;
          speakNext();
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn("Speech synthesis play failed:", err);
          setAutoPlayBlocked(true);
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        }
      };

      speakNext();
    },
    [getSelectedFemaleVoice, voiceVolume]
  );

  // Stop current speech
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setSpeechPhase("idle");
  }, []);

  // Main coordinator: introduce first, then read question
  const startFullSequence = useCallback(() => {
    setAutoPlayBlocked(false);

    if (questionNumber === 1 && !hasIntroducedRef.current) {
      hasIntroducedRef.current = true;
      const introSentences = [
        "Hello! I am CAIRA, your AI interviewer today.",
        `Welcome to your mock interview for the ${jobRole} position.`,
        "Let's get started with your first question:",
      ];
      const questionSentences = splitSentences(questionText);

      speakSentences(introSentences, setSpeechPhase, "intro", () => {
        // After introduction completes, read question
        setTimeout(() => {
          speakSentences(questionSentences, setSpeechPhase, "question", () => {
            setSpeechPhase("idle");
          });
        }, 400);
      });
    } else {
      // Subsequent questions: announce question number and read
      const prefix = [`Question ${questionNumber}.`];
      const questionSentences = splitSentences(questionText);
      speakSentences([...prefix, ...questionSentences], setSpeechPhase, "question", () => {
        setSpeechPhase("idle");
      });
    }
  }, [jobRole, questionNumber, questionText, speakSentences]);

  // Replay only the question
  const replayQuestion = useCallback(() => {
    setAutoPlayBlocked(false);
    const questionSentences = splitSentences(questionText);
    speakSentences(questionSentences, setSpeechPhase, "question", () => {
      setSpeechPhase("idle");
    });
  }, [questionText, speakSentences]);

  // Handle auto-start on question change
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const timer = setTimeout(() => {
      startFullSequence();
    }, 600);

    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [questionNumber, startFullSequence, stopSpeaking]);

  if (!isSupported) {
    return null;
  }

  // Friendly short voice label for UI
  const formatVoiceLabel = (name: string) => {
    if (name.includes("Google UK English Female")) return "Google UK Female";
    if (name.includes("Zira")) return "Microsoft Zira (Female)";
    if (name.includes("Jenny")) return "Microsoft Jenny (Female)";
    if (name.includes("Aria")) return "Microsoft Aria (Female)";
    if (name.includes("Samantha")) return "Apple Samantha (Female)";
    return name.replace(" - English (United States)", "").replace(" - English (Great Britain)", "");
  };

  return (
    <div className="w-full rounded-xl bg-slate-950/70 border border-indigo-500/20 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md mb-4 shadow-sm">
      {/* Left: AI Interviewer Status & Soundwave */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isSpeaking
                ? "bg-gradient-to-br from-pink-500 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-pink-500/30 ring-2 ring-pink-400/50"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isSpeaking ? "animate-spin" : ""}`} />
          </div>

          {isSpeaking && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
            </span>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">CAIRA AI Interviewer</span>

            {/* Female Voice Indicator Badge */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/30 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-pink-400" />
              <span>Female Voice</span>
            </span>

            {/* Speech Phase Status */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                speechPhase === "intro"
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                  : speechPhase === "question"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {speechPhase === "intro"
                ? "Introducing Interview..."
                : speechPhase === "question"
                ? `Reading Question ${questionNumber}`
                : "Ready for Response"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-slate-400">
              {speechPhase === "intro" && "Introducing role context and establishing interview rubric."}
              {speechPhase === "question" && `Speaking aloud Question ${questionNumber} of ${totalQuestions}.`}
              {speechPhase === "idle" && "Finished speaking. Answer aloud via mic or type your response below."}
            </p>

            {/* Female Voice Switcher if multiple female voices available */}
            {femaleVoices.length > 1 && (
              <select
                value={selectedVoiceName}
                onChange={(e) => {
                  setSelectedVoiceName(e.target.value);
                  selectedVoiceNameRef.current = e.target.value;
                  stopSpeaking();
                }}
                className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                title="Choose female voice model"
              >
                {femaleVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {formatVoiceLabel(v.name)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Right: Audio Controls & Animated Wave */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        {/* Animated wave bars when speaking */}
        {isSpeaking && (
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pink-950/40 border border-pink-500/30 mr-1">
            <span className="w-1 h-3.5 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-5 bg-pink-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-4 bg-indigo-300 rounded-full animate-bounce" />
            <span className="w-1 h-2.5 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
          </div>
        )}

        {/* Browser autoplay fallback alert / button */}
        {autoPlayBlocked && (
          <button
            type="button"
            onClick={startFullSequence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-pink-500/20 transition-all animate-pulse"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Click to Play Female Voice Intro</span>
          </button>
        )}

        {isSpeaking ? (
          <button
            type="button"
            onClick={stopSpeaking}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            title="Stop AI voice"
          >
            <Square className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">Pause Voice</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={questionNumber === 1 ? startFullSequence : replayQuestion}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            title="Replay female speech"
          >
            <RotateCcw className="w-3 h-3 text-pink-400" />
            <span className="hidden sm:inline">
              {questionNumber === 1 ? "Replay Intro & Question" : "Replay Question"}
            </span>
          </button>
        )}

        {/* Mute/Unmute */}
        <button
          type="button"
          onClick={() => {
            if (voiceVolume > 0) {
              setVoiceVolume(0);
              stopSpeaking();
            } else {
              setVoiceVolume(1);
              if (questionNumber === 1) startFullSequence();
              else replayQuestion();
            }
          }}
          className={`p-1.5 rounded-lg border text-xs transition-colors ${
            voiceVolume === 0
              ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
              : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
          }`}
          title={voiceVolume === 0 ? "Unmute AI Interviewer" : "Mute AI Interviewer"}
        >
          {voiceVolume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
