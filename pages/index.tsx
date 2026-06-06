import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

const tools = [
  {
    title: "PDF 转 Word",
    description: "将 PDF 文件转换为可编辑的 Word 文档，保留文本结构和段落层级。",
    href: "/pdf-to-word",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Word 转 PDF",
    description: "将 Word 文档转换为 PDF 格式，支持中文内容和字体嵌入。",
    href: "/word-to-pdf",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "PDF 转 Excel",
    description: "从 PDF 文件中提取表格数据并转换为 Excel 电子表格。",
    href: "/pdf-to-excel",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "OCR 文字识别",
    description: "识别扫描 PDF 和图片中的文字，支持中文和英文识别。",
    href: "/ocr",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: "文件上传到服务器吗？",
    a: "不会。所有文件处理均在您的浏览器内完成，文件不会被上传到我们的服务器。转换完成后，文件会自动从内存中清除。",
  },
  {
    q: "支持多大的文件？",
    a: "最大支持 50MB 的文件。对于较大的 PDF 文件，我们会按页解析，避免浏览器卡死。",
  },
  {
    q: "转换质量如何？",
    a: "我们尽可能保留原文的标题层级、段落结构和文本顺序。但受限于纯文本提取方式，复杂的排版和图像内容可能无法完全还原。",
  },
  {
    q: "OCR 识别准确吗？",
    a: "OCR 使用 Tesseract.js 引擎，对清晰的印刷体文档识别率较高。首次使用时需要下载语言包（约 15MB），请耐心等待。",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Head>
        <title>DocFlow - Free Online PDF to Word & Excel Converter</title>
      </Head>

      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            免费的在线文档转换工具
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            PDF 转 Word · Word 转 PDF · PDF 转 Excel · OCR 文字识别
            <br />
            无需上传，在浏览器内完成所有处理
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all"
              >
                {tool.icon}
                {tool.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">所有工具</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex flex-col p-6 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="text-blue-600 mb-3">{tool.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">常见问题</h2>
          <p className="text-center text-gray-500 mb-10">关于 DocFlow 的常见疑问</p>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left font-medium text-gray-900 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
