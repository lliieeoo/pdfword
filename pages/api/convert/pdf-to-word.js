import pdf from 'pdf-parse';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

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

    let text;
    try {
      const pdfData = await pdf(filePart.data);
      text = pdfData.text || '';
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      return res.status(400).json({ 
        error: '无法解析PDF文件内容。可能是扫描版PDF或加密PDF，请确保PDF包含可提取的文字内容。' 
      });
    }

    if (!text.trim()) {
      return res.status(400).json({ 
        error: 'PDF文件内容为空。这可能是扫描版PDF（图片转PDF），请使用包含文字内容的PDF文件。' 
      });
    }

    const lines = text.split('\n').filter(l => l.trim());
    const children = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isHeading = trimmed.length < 50 && !trimmed.endsWith('。') && !trimmed.endsWith('.') && !trimmed.includes('，');

      if (isHeading && children.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 28,
                font: 'Microsoft YaHei',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed,
                size: 22,
                font: 'Microsoft YaHei',
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    }

    children.unshift(
      new Paragraph({
        children: [
          new TextRun({
            text: filePart.filename ? filePart.filename.replace(/\.pdf$/i, '') : 'PDF Document',
            bold: true,
            size: 36,
            font: 'Microsoft YaHei',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    const docxBuf = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.docx"');
    res.send(docxBuf);
  } catch (err) {
    console.error('PDF to Word conversion error:', err);
    res.status(500).json({ error: '转换失败: ' + (err.message || '未知错误') });
  }
}
