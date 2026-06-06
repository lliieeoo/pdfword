import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="zh-CN">
        <Head>
          <meta charSet="utf-8" />
          <meta name="description" content="Free online PDF to Word, Word to PDF and PDF to Excel converter with OCR support." />
          <meta name="keywords" content="PDF to Word, Word to PDF, PDF to Excel, OCR, free online converter, document converter" />
          <meta name="robots" content="index, follow" />
          <meta property="og:title" content="DocFlow - PDF to Word & Excel Converter" />
          <meta property="og:description" content="Free online PDF to Word, Word to PDF and PDF to Excel converter with OCR support." />
          <meta property="og:type" content="website" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
