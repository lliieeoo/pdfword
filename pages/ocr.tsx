import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import { useFileUpload } from "../hooks/useFileUpload";
import { useConversionProgress } from "../hooks/useConversionProgress";

type OcrFn = (
  file: File,
  onProgress?: (progress: number) => void,
  onLangDownload?: (progress: number) => void
) => Promise<string>;

async function getOcrFn(): Promise<OcrFn> {
  return (await import("../lib/services/ocrService")).performOcr;
}

export default function OcrPage() {
  const { file, error, isDragging, setFile, setDragging, reset } =
    useFileUpload({ accept: "pdf" });
  const progress = useConversionProgress();
  const [resultText, setResultText] = useState<string | null>(null);
  const [langDownload, setLangDownload] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) setFile(f);
    },
    [setFile, setDragging]
  );

  const copyToClipboard = useCallback(async () => {
    if (resultText) {
      await navigator.clipboard.writeText(resultText);
    }
  }, [resultText]);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setResultText(null);
    setShowResult(false);
    setLangDownload(null);
    progress.reset();

    try {
      progress.setStage("ocr", 0);

      const fn = await getOcrFn();
      const text = await fn(file, (pct: number) => {
        progress.updateProgress(pct, `正在识别文字... ${pct}%`);
      }, (pct: number) => {
        setLangDownload(pct);
        progress.updateProgress(Math.round(pct * 0.3), `正在下载语言包... ${pct}%`);
      });

      setResultText(text);
      setShowResult(true);
      progress.setStage("complete", 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OCR 识别失败，请重试";
      progress.setError(msg);
    }
  }, [file, progress]);

  const handleNewFile = useCallback(() => {
    setResultText(null);
    setShowResult(false);
    setLangDownload(null);
    reset();
  }, [reset]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <>
      <Head>
        <title>OCR 文字识别 - DocFlow 在线工具</title>
        <meta name="description" content="免费在线 OCR 文字识别，支持扫描 PDF 和图片中的中文与英文文字提取。" />
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OCR 文字识别</h1>
          <p className="text-gray-500">识别扫描 PDF 和图片中的文字，支持中文和英文</p>
        </div>

        {!file && !showResult && (
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".pdf,.png,.jpg,.jpeg";
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files?.[0]) setFile(target.files[0]);
              };
              input.click();
            }}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <div className="text-blue-500 mb-3 flex justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-1">点击或拖拽文件到此处</p>
            <p className="text-gray-400 text-sm">支持 PDF、PNG、JPG 格式，最大 50MB</p>
          </div>
        )}

        {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

        {file && progress.stage === "idle" && (
          <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                  <p className="text-gray-400 text-xs">{formatSize(file.size)}</p>
                </div>
              </div>
              <button onClick={reset} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Remove file">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700 leading-relaxed">
              <strong>提示：</strong>首次识别时需下载约 15MB 的中文语言包。下载完成后自动开始识别，请耐心等待。
            </div>
            <button onClick={handleConvert} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
              开始识别
            </button>
          </div>
        )}

        {progress.stage !== "idle" && progress.stage !== "complete" && progress.stage !== "error" && (
          <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-700">{progress.message}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress.progress}%` }} />
            </div>
            <span className="text-xs text-gray-400 mt-1 block text-right">{progress.progress}%</span>
            {langDownload !== null && langDownload < 100 && (
              <p className="text-xs text-blue-500 mt-2">语言包下载中: {langDownload}%</p>
            )}
          </div>
        )}

        {progress.stage === "error" && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm mb-3">{progress.message}</p>
            <button onClick={reset} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">重试</button>
          </div>
        )}

        {showResult && resultText && (
          <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900 text-sm">识别结果</h3>
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                  复制文本
                </button>
                <button onClick={() => {
                  const blob = new Blob([resultText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = (file?.name || "ocr") + ".txt";
                  a.click();
                }} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  下载文本
                </button>
              </div>
            </div>
            <div className="p-5">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-sans">
                {resultText}
              </pre>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
              <button onClick={handleNewFile} className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
                识别另一个文件
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
