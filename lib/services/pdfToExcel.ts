/**
 * PDF to Excel conversion service.
 * Client-side: parses PDF text, identifies table-like content, sends to API.
 */
import { parsePdf, hasExtractableText } from "./pdfParser";
import { performOcrWithDetection } from "./ocrService";

function extractTables(text: string): string[][] {
  const lines = text.split("\n").filter((l) => l.trim());
  const tables: string[][] = [];
  let currentTable: string[] = [];

  for (const line of lines) {
    const hasTabs = line.includes("\t");
    const hasMultipleSpaces = /\s{2,}/.test(line);
    if (hasTabs || hasMultipleSpaces) {
      currentTable.push(line);
    } else {
      if (currentTable.length > 2) {
        tables.push([...currentTable]);
      }
      currentTable = [];
    }
  }

  if (currentTable.length > 2) {
    tables.push(currentTable);
  }

  return tables;
}

export async function convertPdfToExcel(
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

  const tables = extractTables(text);

  onProgress?.("converting", 80);

  const res = await fetch("/api/convert/pdf-to-excel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      tables,
      fileName: file.name.replace(/\.pdf$/i, ".xlsx"),
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Conversion failed");
  }

  onProgress?.("downloading", 95);
  return res.blob();
}
