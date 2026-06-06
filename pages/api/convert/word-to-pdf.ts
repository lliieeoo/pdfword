import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

interface WordToPdfBody {
  html: string;
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
    const { html, fileName } = req.body as WordToPdfBody;

    if (!html || !fileName) {
      return res.status(400).json({ error: "Missing required fields: html, fileName" });
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.join(process.cwd(), "fonts", "NotoSansSC-Regular.ttf");
    const fontBytes = fs.readFileSync(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes, { subset: true });

    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const MARGIN = 56;
    const FONT_SIZE = 12;
    const LINE_HEIGHT = FONT_SIZE * 1.5;
    const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2;

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    const plainText = html
      .replace(/<h[1-6][^>]*>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

    const lines = plainText.split("\n").filter((l) => l.trim());
    const paragraphs: string[] = [];
    let currentPara = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "") {
        if (currentPara) {
          paragraphs.push(currentPara);
          currentPara = "";
        }
        paragraphs.push("");
      } else {
        currentPara += (currentPara ? " " : "") + trimmed;
      }
    }
    if (currentPara) paragraphs.push(currentPara);

    for (const para of paragraphs) {
      if (para === "") {
        y -= LINE_HEIGHT;
        continue;
      }

      const words = para.split("");
      let textLine = "";

      for (let i = 0; i < words.length; i++) {
        const testLine = textLine + words[i];
        const width = customFont.widthOfTextAtSize(testLine, FONT_SIZE);

        if (width > MAX_WIDTH && textLine) {
          page.drawText(textLine, {
            x: MARGIN,
            y,
            size: FONT_SIZE,
            font: customFont,
          });
          y -= LINE_HEIGHT;
          textLine = words[i];

          if (y < MARGIN) {
            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - MARGIN;
          }
        } else {
          textLine = testLine;
        }
      }

      if (textLine) {
        page.drawText(textLine, {
          x: MARGIN,
          y,
          size: FONT_SIZE,
          font: customFont,
        });
        y -= LINE_HEIGHT;
        if (y < MARGIN) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - MARGIN;
        }
      }
    }

    const pdfBytes = await pdfDoc.save();

    const encodedName = encodeURIComponent(fileName);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedName}`);
    res.setHeader("Content-Length", pdfBytes.length);
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Word to PDF error:", err);
    res.status(500).json({ error: message });
  }
}
