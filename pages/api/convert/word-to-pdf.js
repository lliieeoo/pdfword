import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

async function loadChineseFont(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);
  
  const fontPaths = [
    path.join(process.cwd(), 'fonts/NotoSansSC-Regular.otf'),
    path.join(process.cwd(), 'fonts/WenQuanYiMicroHei.ttf'),
    path.join(process.cwd(), 'fonts/NotoSansSC-Regular.ttf'),
    path.join(process.cwd(), 'fonts/SourceHanSans-Regular.otf'),
  ];
  
  for (const fontPath of fontPaths) {
    if (fs.existsSync(fontPath)) {
      try {
        const fontBytes = fs.readFileSync(fontPath);
        const fontBuffer = Buffer.from(fontBytes);
        
        if (fontBuffer.length < 10000) {
          continue;
        }
        
        const signature = fontBuffer.slice(0, 4).toString('hex');
        const validSignatures = {
          '00010000': 'TTF',
          '74727565': 'TrueType',
          '4f54544f': 'OTF/CFF',
          '77474758': 'WOFF',
          '774f4632': 'WOFF2',
          '74746366': 'TTC'
        };
        
        const fontType = validSignatures[signature];
        if (!fontType) {
          console.error(`Unknown font signature in ${fontPath}: ${signature}`);
          continue;
        }
        
        if (fontType === 'TTC') {
          console.log(`Skipping TTC font (not supported): ${fontPath}`);
          continue;
        }
        
        console.log(`Attempting to load font from ${fontPath} (${fontType}, ${(fontBuffer.length/1024/1024).toFixed(2)}MB)`);
        
        const font = await pdfDoc.embedFont(fontBuffer, { subset: true });
        
        console.log(`✓ Successfully loaded font from ${fontPath}`);
        return font;
      } catch (embedError) {
        console.error(`Failed to embed font from ${fontPath}:`, embedError.message);
        continue;
      }
    }
  }
  
  console.warn('⚠ No Chinese font available, using Helvetica');
  const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  return standardFont;
}

function parseMultipart(buf, boundary) {
  const parts = [];
  const boundaryStr = '--' + boundary;
  const str = buf.toString('latin1');
  let start = str.indexOf(boundaryStr);

  while (start !== -1) {
    const headerEnd = str.indexOf('\r\n\r\n', start);
    if (headerEnd === -1) break;
    const bodyStart = headerEnd + 4;
    const nextBoundary = str.indexOf(boundaryStr, bodyStart);
    if (nextBoundary === -1) break;
    const bodyEnd = nextBoundary - 2;

    const headerBlock = str.substring(start + boundaryStr.length + 2, headerEnd);
    const nameMatch = headerBlock.match(/name="([^"]+)"/);
    const filenameMatch = headerBlock.match(/filename="([^"]+)"/);

    if (nameMatch) {
      const name = nameMatch[1];
      const filename = filenameMatch ? filenameMatch[1] : null;
      const body = buf.slice(bodyStart, bodyEnd);
      parts.push({ name, filename, data: body });
    }

    start = nextBoundary;
  }

  return parts;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '请使用POST方法' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buf = Buffer.concat(chunks);

    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return res.status(400).json({ error: '无效的请求格式' });
    }

    const parts = parseMultipart(buf, boundaryMatch[1]);
    const filePart = parts.find(p => p.name === 'file');

    if (!filePart || !filePart.data) {
      return res.status(400).json({ error: '未找到上传的文件' });
    }

    const result = await mammoth.convertToHtml({ buffer: filePart.data });
    const html = result.value;

    if (!html || !html.trim()) {
      return res.status(400).json({ error: 'Word文件内容为空或无法解析' });
    }

    const plainText = stripHtml(html);

    if (!plainText.trim()) {
      return res.status(400).json({ error: 'Word文件内容为空，无法提取文字进行转换' });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await loadChineseFont(pdfDoc);
    const fontSize = 12;
    const margin = 50;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = fontSize * 1.5;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const lines = plainText.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        y -= lineHeight;
        continue;
      }

      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      const words = line.split('');
      let currentLine = '';

      for (const char of words) {
        const testLine = currentLine + char;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          y -= lineHeight;
          currentLine = char;

          if (y < margin + lineHeight) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= lineHeight;
      }
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Word to PDF conversion error:', err);
    res.status(500).json({ error: '转换失败: ' + (err.message || '未知错误') });
  }
}
