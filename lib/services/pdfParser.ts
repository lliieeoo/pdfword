/**
 * Browser-side PDF parser using pdfjs-dist.
 * Parses PDF files page by page to extract text content.
 * Automatically detects if the PDF is scanned (no extractable text).
 */
import type { PdfParseResult, PdfTextItem } from "../types";

let pdfjsLib: any = null;
let initialized = false;

async function ensurePdfJs() {
  if (initialized) return;
  pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  initialized = true;
}

export async function parsePdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<PdfParseResult> {
  await ensurePdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const allItems: PdfTextItem[] = [];
  let totalText = "";

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    let pageText = "";
    for (const item of content.items) {
      const str = (item as any).str || "";
      if (str.trim()) {
        allItems.push({
          text: str,
          fontSize: (item as any).fontSize,
          fontName: (item as any).fontName,
          pageNum: i,
        });
        pageText += str + " ";
      }
    }

    totalText += pageText.trim() + "\n\n";
    onProgress?.(Math.round((i / numPages) * 100));
  }

  return {
    text: totalText.trim().replace(/\n{3,}/g, "\n\n"),
    items: allItems,
    numPages,
  };
}

export function hasExtractableText(result: PdfParseResult): boolean {
  return result.items.length > 10;
}