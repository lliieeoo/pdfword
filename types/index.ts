export type ConversionType = "pdf-to-word" | "word-to-pdf" | "pdf-to-excel" | "ocr";

export type ProgressStage =
  | "idle"
  | "uploading"
  | "parsing"
  | "ocr"
  | "converting"
  | "downloading"
  | "complete"
  | "error";

export interface ProgressState {
  stage: ProgressStage;
  progress: number;
  message: string;
}

export interface ConversionResult {
  fileName: string;
  blob: Blob;
  type: ConversionType;
}

export interface ApiResponse {
  error?: string;
}

export interface FileValidation {
  valid: boolean;
  error?: string;
}
