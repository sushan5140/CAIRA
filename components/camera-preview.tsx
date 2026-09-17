"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, AlertCircle } from "lucide-react";

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
  const [audioLevel, setAudioLevel] = useState<number>(0);

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

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Set up audio analyser for visual feedback
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
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              const normalized = Math.min(100, Math.round((average / 128) * 100));
              setAudioLevel(normalized);
              onAudioLevelChange?.(normalized);
              animFrameRef.current = requestAnimationFrame(checkAudio);
            };

            animFrameRef.current = requestAnimationFrame(checkAudio);
          }
        } catch (e) {
          console.warn("Web Audio API not initialized:", e);
        }
      } catch (err: any) {
        console.warn("Could not access camera/mic:", err.name, err.message);
        setError("Camera preview unavailable (browser permission or device busy). Using virtual mock view.");
      }
    }

    initMedia();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onAudioLevelChange]);

  const toggleCamera = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = !cameraActive));
      setCameraActive(!cameraActive);
    } else {
      setCameraActive(!cameraActive);
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = !micActive));
      setMicActive(!micActive);
    } else {
      setMicActive(!micActive);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between ${className}`}>
      {/* Video element */}
      <div className="relative w-full h-full min-h-[220px] sm:min-h-[260px] bg-slate-950 flex items-center justify-center">
        {cameraActive && !error ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1] rounded-2xl"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700">
              <CameraOff className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-xs font-medium text-slate-400">
              {error ? "Virtual Mode Active" : "Camera Paused"}
            </p>
            {error && (
              <p className="text-[11px] text-slate-500 max-w-[200px] leading-tight">
                Microphone / typed speech still functional.
              </p>
            )}
          </div>
        )}

        {/* Top bar overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                cameraActive && !error ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>{cameraActive && !error ? "Candidate Cam" : "Paused"}</span>
          </div>

          {/* Real-time audio waveform feedback */}
          {micActive && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10">
              <div
                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(4, (audioLevel / 100) * 16)}px` }}
              />
              <div
                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(6, (audioLevel / 100) * 22)}px` }}
              />
              <div
                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(4, (audioLevel / 100) * 14)}px` }}
              />
            </div>
          )}
        </div>

        {/* Bottom controls overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCamera}
              className={`p-2 rounded-xl backdrop-blur-md text-xs font-medium transition-all ${
                cameraActive
                  ? "bg-slate-950/70 text-slate-200 hover:bg-slate-800 border border-white/10"
                  : "bg-rose-500/80 text-white hover:bg-rose-600"
              }`}
              title={cameraActive ? "Turn camera off" : "Turn camera on"}
            >
              {cameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleMic}
              className={`p-2 rounded-xl backdrop-blur-md text-xs font-medium transition-all ${
                micActive
                  ? "bg-slate-950/70 text-slate-200 hover:bg-slate-800 border border-white/10"
                  : "bg-rose-500/80 text-white hover:bg-rose-600"
              }`}
              title={micActive ? "Mute microphone" : "Unmute microphone"}
            >
              {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
            Local preview only
          </div>
        </div>
      </div>
    </div>
  );
}
