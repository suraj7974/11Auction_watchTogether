"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

export const MAX_VOICE_SECONDS = 60;

/** Records mic audio with MediaRecorder. `finish()` resolves with the clip blob. */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const stopStream = () => streamRef.current?.getTracks().forEach((t) => t.stop());
  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  async function start(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = chunksRef.current.length
          ? new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })
          : null;
        stopStream();
        resolveRef.current?.(blob);
        resolveRef.current = null;
      };
      recorderRef.current = mr;
      mr.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return true;
    } catch {
      toast.error("Microphone access denied", {
        description: "Allow microphone access to record a voice note.",
      });
      stopStream();
      return false;
    }
  }

  /** Stop and resolve with the recorded blob (null if nothing usable). */
  function finish(): Promise<Blob | null> {
    return new Promise((resolve) => {
      clearTimer();
      setRecording(false);
      const mr = recorderRef.current;
      if (!mr || mr.state === "inactive") {
        stopStream();
        resolve(null);
        return;
      }
      resolveRef.current = resolve;
      mr.stop();
    });
  }

  /** Discard the recording. */
  function cancel() {
    clearTimer();
    setRecording(false);
    resolveRef.current = null;
    const mr = recorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.onstop = () => stopStream();
      mr.stop();
    } else {
      stopStream();
    }
  }

  return { recording, seconds, start, finish, cancel };
}
