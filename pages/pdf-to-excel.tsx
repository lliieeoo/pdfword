import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import { useFileUpload } from "../hooks/useFileUpload";
import { useConversionProgress } from "../hooks/useConversionProgress";

type ConvertFn = (file: File, onProgress?: (stage: string, progress: number) => void) => Promise<Blob>;

async function getConverter(): Promise<ConvertFn> {
  return (await import("../lib/services/pdfToExcel")).convertPdfToExcel;
}

export default function PdfToExcelPage() {
  const { file, error, isDragging, setFile, setDragging, reset } =
    useFileUpload({ accept: "pdf" });
  const progress = useConversionProgress();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>("");
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

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setDownloadUrl(null);
    progress.reset();

    try {
      const fn = await getConverter();
      const blob = await fn(file, (stage, pct) => {
        progress.setStage(stage as any, pct);
        progress.updateProgress(pct);
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(file.name.replace(/\.pdf$/i, ".xlsx"));
      progress.setStage("complete", 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "转换失败，请重试";
      progress.setError(msg);
    }
  }, [file, progress]);

  const handleNewFile = useCallback(() => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    reset();
  }, [downloadUrl, reset]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <>
      <Head>
        <title>PDF 转 Excel - DocFlow 在线转换工具</title>
        <meta name="description" content="免费在线从 PDF 文件中提取表格数据并转换为 Excel 电子表格。" />
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF 转 Excel</h1>
          <p className="text-gray-500">从 PDF 文件中提取表格数据并转换为 Excel 电子表格</p>
        </div>

        {!file && !downloadUrl && (
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".pdf";
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-1">点击或拖拽 PDF 文件到此处</p>
            <p className="text-gray-400 text-sm">支持 PDF 格式，最大 50MB</p>
          </div>
        )}

        {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

        {file && progress.stage === "idle" && (
          <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
            <button onClick={handleConvert} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
              开始转换
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
          </div>
        )}

        {progress.stage === "error" && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm mb-3">{progress.message}</p>
            <button onClick={reset} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">重试</button>
          </div>
        )}

        {downloadUrl && progress.stage === "complete" && (
          <div className="mt-4 bg-white border border-green-200 rounded-xl p-5 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-1">转换完成</p>
            <p className="text-sm text-gray-500 mb-4">{downloadName}</p>
            <div className="flex justify-center gap-3">
              <a href={downloadUrl} download={downloadName} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors">下载文件</a>
              <button onClick={handleNewFile} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">继续转换</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
