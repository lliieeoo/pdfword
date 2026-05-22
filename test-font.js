import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

async function testFontLoading() {
  console.log('Testing font loading...');
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  const fontPath = path.join(process.cwd(), 'fonts/NotoSansSC-Regular.ttf');
  
  if (!fs.existsSync(fontPath)) {
    console.error('❌ Font file not found at', fontPath);
    return false;
  }
  
  const fontBytes = fs.readFileSync(fontPath);
  const fontBuffer = Buffer.from(fontBytes);
  
  console.log(`✓ Font file size: ${(fontBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  
  if (fontBuffer.length < 10000) {
    console.error('❌ Font file too small, likely corrupted');
    return false;
  }
  
  const signature = fontBuffer.slice(0, 4).toString('hex');
  console.log(`✓ Font signature: ${signature}`);
  
  const isValidFont = 
    signature === '00010000' || 
    signature === '4f54544f' || 
    signature === '77474758' ||
    signature === '74727565' ||
    signature === '74746366';
  
  if (!isValidFont) {
    console.error('❌ Invalid font signature:', signature);
    return false;
  }
  
  try {
    const isTTC = signature === '74746366';
    const font = isTTC 
      ? await pdfDoc.embedFont(fontBuffer)
      : await pdfDoc.embedFont(fontBuffer, { subset: true });
    console.log('✓ Font embedded successfully');
    
    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawText('测试中文 Test English', {
      x: 50,
      y: 700,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    
    const pdfBytes = await pdfDoc.save();
    console.log(`✓ PDF generated: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
    
    fs.writeFileSync('test-output.pdf', pdfBytes);
    console.log('✓ Test PDF saved as test-output.pdf');
    
    return true;
  } catch (error) {
    console.error('❌ Error embedding font:', error.message);
    return false;
  }
}

testFontLoading()
  .then(success => {
    if (success) {
      console.log('\n✅ Font test PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ Font test FAILED');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
