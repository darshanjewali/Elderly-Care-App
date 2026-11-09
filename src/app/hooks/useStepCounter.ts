import { useState, useEffect, useRef, useCallback } from "react";

type StepCounterState = "idle" | "active" | "paused" | "no-sensor" | "permission-denied";

interface UseStepCounterReturn {
  steps: number;
  state: StepCounterState;
  start: () => Promise<void>;
  pause: () => void;
  reset: () => void;
  setSteps: (n: number) => void;
  isSupported: boolean;
}

const MAGNITUDE_THRESHOLD = 11.5; // m/s² – crossing this threshold = step candidate
const MIN_STEP_INTERVAL_MS = 280;  // minimum milliseconds between steps

export function useStepCounter(initialSteps = 0): UseStepCounterReturn {
  const [steps, setStepsState] = useState(initialSteps);
  const [state, setState] = useState<StepCounterState>("idle");

  const stepsRef = useRef(initialSteps);
  const lastStepTime = useRef(0);
  const prevMagnitude = useRef(0);
  const smoothMag = useRef(9.8); // start near gravity
  const isListening = useRef(false);

  const isSupported =
    typeof window !== "undefined" && "DeviceMotionEvent" in window;

  const setSteps = useCallback((n: number) => {
    stepsRef.current = n;
    setStepsState(n);
  }, []);

  // Sync initialSteps when it changes from parent (loaded from DB)
  useEffect(() => {
    if (initialSteps > 0 && stepsRef.current === 0) {
      setSteps(initialSteps);
    }
  }, [initialSteps, setSteps]);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isListening.current) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const x = acc.x ?? 0;
    const y = acc.y ?? 0;
    const z = acc.z ?? 0;
    const rawMag = Math.sqrt(x * x + y * y + z * z);

    // Low-pass filter (alpha = 0.8) to reduce noise
    const alpha = 0.8;
    smoothMag.current = alpha * rawMag + (1 - alpha) * smoothMag.current;

    const now = Date.now();
    const timeSinceLast = now - lastStepTime.current;

    // Detect upward crossing of threshold (rising edge)
    if (
      smoothMag.current > MAGNITUDE_THRESHOLD &&
      prevMagnitude.current <= MAGNITUDE_THRESHOLD &&
      timeSinceLast > MIN_STEP_INTERVAL_MS
    ) {
      lastStepTime.current = now;
      stepsRef.current += 1;
      setStepsState(stepsRef.current);
    }

    prevMagnitude.current = smoothMag.current;
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      setState("no-sensor");
      return;
    }

    // iOS 13+ requires explicit permission
    try {
      if (
        typeof (DeviceMotionEvent as any).requestPermission === "function"
      ) {
        const perm = await (DeviceMotionEvent as any).requestPermission();
        if (perm !== "granted") {
          setState("permission-denied");
          return;
        }
      }
    } catch {
      setState("permission-denied");
      return;
    }

    isListening.current = true;
    window.addEventListener("devicemotion", handleMotion);
    setState("active");
  }, [isSupported, handleMotion]);

  const pause = useCallback(() => {
    isListening.current = false;
    window.removeEventListener("devicemotion", handleMotion);
    setState("paused");
  }, [handleMotion]);

  const reset = useCallback(() => {
    stepsRef.current = 0;
    setStepsState(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListening.current = false;
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [handleMotion]);

  return { steps, state, start, pause, reset, setSteps, isSupported };
}
