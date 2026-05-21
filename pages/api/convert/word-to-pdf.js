import mammoth from 'mammoth';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

async function loadChineseFont(pdfDoc) {
  try {
    const fontUrl = 'https://cdn.jsdelivr.net/npm/chinese-font@latest/dist/NotoSansSC-Regular.ttf';
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) {
      throw new Error('Failed to fetch font');
    }
    const fontBytes = await fontResponse.arrayBuffer();
    pdfDoc.registerFontkit(fontkit);
    return await pdfDoc.embedFont(fontBytes);
  } catch (error) {
    console.warn('Failed to load Chinese font, using fallback:', error);
    const fontUrl2 = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf';
    try {
      const fontResponse2 = await fetch(fontUrl2);
      if (!fontResponse2.ok) throw new Error('Fallback font failed');
      const fontBytes2 = await fontResponse2.arrayBuffer();
      pdfDoc.registerFontkit(fontkit);
      return await pdfDoc.embedFont(fontBytes2);
    } catch (error2) {
      const cdnFonts = [
        'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.woff2',
        'https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.ttf'
      ];
      for (const url of cdnFonts) {
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const bytes = await resp.arrayBuffer();
            pdfDoc.registerFontkit(fontkit);
            return await pdfDoc.embedFont(bytes);
          }
        } catch (e) {
          continue;
        }
      }
      throw new Error('Unable to load any Chinese font');
    }
  }
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

// Strip HTML tags and convert entities
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

    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ buffer: filePart.data });
    const html = result.value;

    if (!html || !html.trim()) {
      return res.status(400).json({ error: 'Word文件内容为空或无法解析' });
    }

    // Strip HTML to plain text
    const plainText = stripHtml(html);

    if (!plainText.trim()) {
      return res.status(400).json({ error: 'Word文件内容为空，无法提取文字进行转换' });
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await loadChineseFont(pdfDoc);
    const fontSize = 12;
    const margin = 50;
    const pageWidth = 595.28; // A4
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

      // Check if we need a new page
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      // Word wrap
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

      // Draw remaining text
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
