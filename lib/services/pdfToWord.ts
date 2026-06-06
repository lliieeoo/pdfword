/**
 * PDF to Word conversion service.
 * Client-side: parses PDF, sends extracted text to API, returns download blob.
 */
import { parsePdf, hasExtractableText } from "./pdfParser";
import { performOcrWithDetection } from "./ocrService";

export async function convertPdfToWord(
  file: File,
  onProgress?: (stage: string, progress: number) => void
): Promise<Blob> {
  onProgress?.("parsing", 10);

  const parseResult = await parsePdf(file, (p) => {
    onProgress?.("parsing", 10 + Math.round(p * 0.4));
  });

  let text = parseResult.text;

  if (!hasExtractableText(parseResult)) {
    onProgress?.("ocr", 50);
    const ocrResult = await performOcrWithDetection(
      file,
      text,
      (p) => onProgress?.("ocr", 50 + Math.round(p * 0.3)),
      (p) => onProgress?.("ocr", 50 + Math.round(p * 0.2))
    );
    text = ocrResult.text;
  }

  onProgress?.("converting", 85);

  const res = await fetch("/api/convert/pdf-to-word", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      fileName: file.name.replace(/\.pdf$/i, ".docx"),
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Conversion failed");
  }

  onProgress?.("downloading", 95);
  return res.blob();
}
