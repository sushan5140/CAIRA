"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, ShieldCheck } from "lucide-react";

interface CameraPreviewProps {
  onAudioLevelChange?: (level: number) => void;
  className?: string;
}

export function CameraPreview({ onAudioLevelChange, className = "" }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function initMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: true,
        });

        currentStream = mediaStream;
        setStream(mediaStream);
        setError(null);

        if (videoRef.current) videoRef.current.srcObject = mediaStream;

        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            const source = ctx.createMediaStreamSource(mediaStream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkAudio = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);

              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];

              const average = sum / dataArray.length;
              const normalized = Math.min(100, Math.round((average / 128) * 100));
              setAudioLevel(normalized);
              onAudioLevelChange?.(normalized);
              animFrameRef.current = requestAnimationFrame(checkAudio);
            };

            animFrameRef.current = requestAnimationFrame(checkAudio);
          }
        } catch (audioError) {
          console.warn("Web Audio API not initialized:", audioError);
        }
      } catch (mediaError: any) {
        console.warn("Could not access camera/mic:", mediaError?.name, mediaError?.message);
        setError("Camera preview is unavailable. You can still complete the interview by voice or text.");
      }
    }

    initMedia();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (currentStream) currentStream.getTracks().forEach((track) => track.stop());
    };
  }, [onAudioLevelChange]);

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !cameraActive;
      });
    }
    setCameraActive((active) => !active);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !micActive;
      });
    }
    setMicActive((active) => !active);
  };

  return (
    <section className={`overflow-hidden rounded-[20px] border border-white/10 bg-white/5 p-2 ${
      className
    }`} aria-label="Local camera preview">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[15px] bg-[#151b2a]">
        {cameraActive && !error ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#f2eee7] p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-200 bg-white text-slate-500 shadow-sm">
              <CameraOff className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-extrabold text-[#1c2437]">
              {error ? "Camera unavailable" : "Camera paused"}
            </p>
            <p className="max-w-[180px] text-[10px] font-medium leading-4 text-slate-500">
              {error || "Your interview can continue normally."}
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#151b2a]/72 px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur-md">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                cameraActive && !error ? "bg-emerald-400" : "bg-amber-300"
              }`}
            />
            {cameraActive && !error ? "Camera on" : "Preview paused"}
          </div>

          {micActive ? (
            <div
              className="flex h-6 items-end gap-0.5 rounded-full border border-white/15 bg-[#151b2a]/72 px-2 py-1 backdrop-blur-md"
              aria-hidden="true"
            >
              {[8, 13, 9].map((maxHeight, index) => (
                <span
                  key={index}
                  className="w-0.5 rounded-full bg-emerald-300 transition-[height] duration-75"
                  style={{ height: `${Math.max(3, (audioLevel / 100) * maxHeight)}px` }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-1 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleCamera}
            aria-pressed={!cameraActive}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.94] ${
              cameraActive
                ? "border-white/10 bg-white/10 text-white hover:bg-white/15"
                : "border-rose-300/20 bg-rose-400/15 text-rose-200"
            }`}
            aria-label={cameraActive ? "Turn camera off" : "Turn camera on"}
          >
            {cameraActive ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleMic}
            aria-pressed={!micActive}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.94] ${
              micActive
                ? "border-white/10 bg-white/10 text-white hover:bg-white/15"
                : "border-rose-300/20 bg-rose-400/15 text-rose-200"
            }`}
            aria-label={micActive ? "Mute preview microphone" : "Unmute preview microphone"}
          >
            {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
          Local preview
        </div>
      </div>
    </section>
  );
}
