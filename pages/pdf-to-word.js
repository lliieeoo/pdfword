import { useState, useRef, useCallback } from 'react';
import Head from 'next/head';

export default function PdfToWord() {
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const [dragover, setDragover] = useState(false);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('请选择PDF文件');
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragover(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, [handleFile]);

  const handleConvert = async () => {
    if (!file) return;
    setConverting(true);
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);

      const res = await fetch('/api/convert/pdf-to-word', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '转换失败，请重试');
      }

      setProgress(90);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const fileName = file.name.replace(/\.pdf$/i, '.docx');

      // Save to history
      const history = JSON.parse(localStorage.getItem('convertHistory') || '[]');
      history.unshift({
        id: Date.now(),
        type: 'PDF → Word',
        fileName: file.name,
        outputName: fileName,
        size: file.size,
        status: 'success',
        date: new Date().toLocaleString('zh-CN'),
      });
      localStorage.setItem('convertHistory', JSON.stringify(history.slice(0, 50)));

      setResult({ url, fileName });
      setProgress(100);
    } catch (err) {
      setError(err.message);

      // Save failed to history
      const history = JSON.parse(localStorage.getItem('convertHistory') || '[]');
      history.unshift({
        id: Date.now(),
        type: 'PDF → Word',
        fileName: file.name,
        size: file.size,
        status: 'error',
        date: new Date().toLocaleString('zh-CN'),
      });
      localStorage.setItem('convertHistory', JSON.stringify(history.slice(0, 50)));
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.fileName;
    a.click();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <Head>
        <title>PDF转Word - PDF-Word转换器</title>
      </Head>

      <h1 className="page-title">PDF 转 Word</h1>
      <p className="page-desc">上传PDF文件，快速转换为可编辑的Word文档</p>

      <div className="card">
        <div
          className={`upload-area ${dragover ? 'dragover' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={handleDrop}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <h3>点击或拖拽文件到此处</h3>
          <p>支持 .pdf 格式，最大 50MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {file && (
          <div className="file-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div>
              <div className="file-name">{file.name}</div>
              <div className="file-size">{formatSize(file.size)}</div>
            </div>
            <button className="file-remove" onClick={() => { setFile(null); setResult(null); setError(null); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {converting && (
          <>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              正在转换中... {progress}%
            </p>
          </>
        )}

        {result && (
          <div className="result-area success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div style={{ flex: 1 }}>
              <strong>转换成功！</strong>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{result.fileName}</div>
            </div>
            <button className="btn btn-success" onClick={handleDownload}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载文件
            </button>
          </div>
        )}

        {error && (
          <div className="result-area error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div>
              <strong>转换失败</strong>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{error}</div>
            </div>
          </div>
        )}

        <div className="convert-actions">
          <button
            className="btn btn-primary"
            disabled={!file || converting}
            onClick={handleConvert}
          >
            {converting ? (
              <>
                <span className="spinner" />
                转换中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                </svg>
                开始转换
              </>
            )}
          </button>
          {file && !converting && (
            <button className="btn btn-secondary" onClick={() => { setFile(null); setResult(null); setError(null); }}>
              重新选择
            </button>
          )}
        </div>
      </div>
    </>
  );
}
