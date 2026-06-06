import { useState, useCallback, useRef } from "react";
import type { ProgressStage, ProgressState } from "../types";

const STAGE_MESSAGES: Record<ProgressStage, string> = {
  idle: "等待操作",
  uploading: "正在上传文件...",
  parsing: "正在解析文件...",
  ocr: "正在进行 OCR 识别...",
  converting: "正在转换格式...",
  downloading: "正在准备下载...",
  complete: "转换完成",
  error: "转换失败",
};

export function useConversionProgress() {
  const [state, setState] = useState<ProgressState>({
    stage: "idle",
    progress: 0,
    message: STAGE_MESSAGES.idle,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const setStage = useCallback((stage: ProgressStage, progress?: number) => {
    setState({
      stage,
      progress: progress ?? 0,
      message: STAGE_MESSAGES[stage],
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState((prev) => ({
      ...prev,
      progress,
      message: message ?? prev.message,
    }));
  }, []);

  const animateProgress = useCallback((from: number, to: number, durationMs: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const steps = 30;
    const increment = (to - from) / steps;
    const stepMs = durationMs / steps;
    let current = from;
    intervalRef.current = setInterval(() => {
      current += increment;
      if (current >= to) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        current = to;
      }
      setState((prev) => ({ ...prev, progress: Math.round(current) }));
    }, stepMs);
  }, []);

  const setError = useCallback((message: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState({ stage: "error", progress: 0, message });
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState({ stage: "idle", progress: 0, message: STAGE_MESSAGES.idle });
  }, []);

  return {
    ...state,
    setStage,
    updateProgress,
    animateProgress,
    setError,
    reset,
  };
}
