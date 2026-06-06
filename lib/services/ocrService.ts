/**
 * OCR Service using Tesseract.js
 * Automatically detects and performs OCR on scanned PDFs/images.
 * For PDF files, renders each page to canvas first, then sends to Tesseract.
 */
import type { ProgressStage } from "../../types";

let Tesseract: any = null;
let tesseractInitialized = false;

let pdfjsLib: any = null;
let pdfjsInitialized = false;

const LANG_PATH =
  "https://cdn.jsdelivr.net/npm/@tesseract.js-data/chi_sim/4.0.0_best_int";

async function ensureTesseract() {
  if (tesseractInitialized) return;
  Tesseract = await import("tesseract.js");
  tesseractInitialized = true;
}

async function ensurePdfJs() {
  if (pdfjsInitialized) return;
  pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  pdfjsInitialized = true;
}

/**
 * Render a PDF page to a canvas, return a blob URL for use with Tesseract.
 */
async function renderPdfPageToImage(
  pdfDoc: any,
  pageNum: number,
  scale: number = 2
): Promise<string> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
}

/**
 * OCR an image file (JPEG/PNG) directly with Tesseract.
 */
async function ocrImage(
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

/**
 * OCR a PDF file: render each page to image, then OCR with Tesseract.
 */
async function ocrPdf(
  file: File,
  onProgress?: (progress: number) => void,
  onLangDownload?: (progress: number) => void
): Promise<string> {
  await ensurePdfJs();
  await ensureTesseract();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let fullText = "";

  for (let i = 1; i <= numPages; i++) {
    const dataUrl = await renderPdfPageToImage(pdf, i);
    // Convert data URL to a Blob for Tesseract
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const pageResult = await Tesseract.recognize(blob, "chi_sim+eng", {
      langPath: LANG_PATH,
      logger: (info: any) => {
        if (info.status === "recognizing text") {
          const pct = Math.round(
            ((i - 1 + info.progress) / numPages) * 100
          );
          onProgress?.(pct);
        }
        if (info.status === "loading language traineddata") {
          onLangDownload?.(Math.round(info.progress * 100));
        }
      },
    });
    fullText += pageResult.data.text.trim() + "\n\n";
    onProgress?.(Math.round((i / numPages) * 100));
  }

  return fullText.trim();
}

export async function performOcr(
  file: File,
  onProgress?: (progress: number) => void,
  onLangDownload?: (progress: number) => void
): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
  if (isPdf) {
    return ocrPdf(file, onProgress, onLangDownload);
  }
  return ocrImage(file, onProgress, onLangDownload);
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
