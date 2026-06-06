/**
 * Word to PDF conversion service.
 * Client-side: extracts HTML from DOCX using mammoth, sends to API.
 */
let mammoth: any = null;

async function ensureMammoth() {
  if (mammoth) return;
  mammoth = await import("mammoth");
}

export async function convertWordToPdf(
  file: File,
  onProgress?: (stage: string, progress: number) => void
): Promise<Blob> {
  onProgress?.("parsing", 10);
  await ensureMammoth();

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  onProgress?.("converting", 50);

  const res = await fetch("/api/convert/word-to-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      html,
      fileName: file.name.replace(/\.docx?$/i, ".pdf"),
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Conversion failed");
  }

  onProgress?.("downloading", 90);
  return res.blob();
}
