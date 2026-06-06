import type { NextApiRequest, NextApiResponse } from "next";
import ExcelJS from "exceljs";

interface PdfToExcelBody {
  text: string;
  tables: string[][];
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
    const { text, tables, fileName } = req.body as PdfToExcelBody;

    if (!text || !fileName) {
      return res.status(400).json({ error: "Missing required fields: text, fileName" });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "DocFlow";
    workbook.created = new Date();

    if (tables && tables.length > 0) {
      tables.forEach((tableData, index) => {
        const sheet = workbook.addWorksheet(`Table${index + 1}`);

        const rows = tableData.map((line) => {
          const cells = line.split(/\t|\s{2,}/).map((c) => c.trim());
          return cells;
        });

        if (rows.length > 0) {
          const headerRow = sheet.addRow(rows[0]);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };

          for (let i = 1; i < rows.length; i++) {
            sheet.addRow(rows[i]);
          }

          sheet.columns.forEach((column) => {
            if (column) {
              let maxLength = 0;
              (column.values || []).forEach((val) => {
                const str = String(val || "");
                if (str.length > maxLength) maxLength = str.length;
              });
              column.width = Math.min(Math.max(maxLength + 2, 10), 50);
            }
          });
        }
      });
    } else {
      const sheet = workbook.addWorksheet("Table1");
      const textLines = text
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 500);

      textLines.forEach((line, index) => {
        sheet.getCell(`A${index + 1}`).value = line;
      });
      sheet.getColumn("A").width = 80;
    }

    const xlsxBuffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", xlsxBuffer.byteLength);
    res.status(200).send(Buffer.from(xlsxBuffer));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("PDF to Excel error:", err);
    res.status(500).json({ error: message });
  }
}
