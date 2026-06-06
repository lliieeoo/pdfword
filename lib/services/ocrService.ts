/**
 * OCR Service using Tesseract.js
 * Automatically detects and performs OCR on scanned PDFs/images.
 */
import type { ProgressStage } from "../../types";

let Tesseract: any = null;
let initialized = false;

const LANG_PATH =
  "https://cdn.jsdelivr.net/npm/@tesseract.js-data/chi_sim/4.0.0_best_int";

async function ensureTesseract() {
  if (initialized) return;
  Tesseract = await import("tesseract.js");
  initialized = true;
}

export async function performOcr(
  file: File,
  onProgress?: (progress: number) => void,
  onLangDownload?: (progress: number) => void
): Promise<string> {
  await ensureTesseract();

  const imageData = await file.arrayBuffer();

  const result = await Tesseract.recognize(imageData, "chi_sim+eng", {
    langPath: LANG_PATH,
    logger: (info: any) => {
      if (info.status === "recognizing text") {
        onProgress?.(Math.round(info.progress * 100));
      }
      if (info.status === "loading language traineddata") {
        onLangDownload?.(Math.round(info.progress * 100));
      }
    },
  });

  return result.data.text;
}

export function needsOcr(textContent: string): boolean {
  if (!textContent || textContent.trim().length === 0) return true;
  const ratio =
    textContent.replace(/\s/g, "").length / textContent.length;
  return ratio < 0.1;
}

export async function performOcrWithDetection(
  file: File,
  extractedText: string,
  onProgress?: (progress: number) => void,
  onLangDownload?: (progress: number) => void
): Promise<{ text: string; usedOcr: boolean }> {
  if (!needsOcr(extractedText)) {
    return { text: extractedText, usedOcr: false };
  }
  const ocrText = await performOcr(file, onProgress, onLangDownload);
  return { text: ocrText, usedOcr: true };
}
