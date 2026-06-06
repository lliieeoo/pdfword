import type { NextApiRequest, NextApiResponse } from "next";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

interface PdfToWordBody {
  text: string;
  fileName: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, fileName } = req.body as PdfToWordBody;

    if (!text || !fileName) {
      return res.status(400).json({ error: "Missing required fields: text, fileName" });
    }

    const lines = text.split("\n").filter((l) => l.trim());

    const children: (Paragraph | any)[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.length < 50 && !trimmed.endsWith("。") && !trimmed.endsWith(".")) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: trimmed, bold: true, size: 28 })],
          })
        );
      } else {
        children.push(
          new Paragraph({
            spacing: { after: 120, line: 360 },
            children: [new TextRun({ text: trimmed, size: 22 })],
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const docxBytes = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", docxBytes.length);
    res.status(200).send(docxBytes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("PDF to Word error:", err);
    res.status(500).json({ error: message });
  }
}
