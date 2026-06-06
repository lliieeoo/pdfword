import { useState, useCallback } from "react";
import type { FileValidation } from "../types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPT_MAP: Record<string, string> = {
  pdf: ".pdf",
  docx: ".doc,.docx",
  all: ".pdf,.doc,.docx",
};

interface UseFileUploadOptions {
  accept?: keyof typeof ACCEPT_MAP;
}

interface FileUploadState {
  file: File | null;
  error: string | null;
  isDragging: boolean;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { accept = "all" } = options;
  const acceptStr = ACCEPT_MAP[accept];

  const [state, setState] = useState<FileUploadState>({
    file: null,
    error: null,
    isDragging: false,
  });

  const validate = useCallback((file: File): FileValidation => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: "文件大小超过 50MB 限制" };
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const allowed = acceptStr.split(",");
    if (!allowed.includes(ext)) {
      return { valid: false, error: `不支持的文件格式，请上传 ${acceptStr} 文件` };
    }
    return { valid: true };
  }, [acceptStr]);

  const setFile = useCallback((file: File | null) => {
    if (!file) {
      setState({ file: null, error: null, isDragging: false });
      return;
    }
    const validation = validate(file);
    if (!validation.valid) {
      setState({ file: null, error: validation.error ?? "Invalid file", isDragging: false });
      return;
    }
    setState({ file, error: null, isDragging: false });
  }, [validate]);

  const setDragging = useCallback((isDragging: boolean) => {
    setState((prev) => ({ ...prev, isDragging }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({ file: null, error: null, isDragging: false });
  }, []);

  return {
    ...state,
    setFile,
    setDragging,
    clearError,
    reset,
    acceptStr,
  };
}
