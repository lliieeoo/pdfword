import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">DocFlow</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              免费的在线文档转换工具。支持 PDF 转 Word、Word 转 PDF、PDF 转 Excel 以及 OCR 文字识别。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">工具</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pdf-to-word" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  PDF 转 Word
                </Link>
              </li>
              <li>
                <Link href="/word-to-pdf" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  Word 转 PDF
                </Link>
              </li>
              <li>
                <Link href="/pdf-to-excel" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  PDF 转 Excel
                </Link>
              </li>
              <li>
                <Link href="/ocr" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  OCR 文字识别
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">关于</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-gray-500">
                  文件仅在浏览器内存中处理，转换完成后自动清除，不会上传到服务器。
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-400">
          &copy; {currentYear} DocFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
