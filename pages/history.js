import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('convertHistory') || '[]';
    setHistory(JSON.parse(saved));
  }, []);

  const handleClear = () => {
    localStorage.removeItem('convertHistory');
    setHistory([]);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <Head>
        <title>转换记录 - PDF-Word转换器</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">转换记录</h1>
          <p className="page-desc">查看您的文件转换历史</p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-secondary" onClick={handleClear}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            清空记录
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>暂无转换记录</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>转换文件后，记录将显示在这里</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '16px', overflowX: 'auto' }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>转换类型</th>
                <th>文件名</th>
                <th>文件大小</th>
                <th>状态</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{item.type}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '14px' }}>{item.fileName}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {formatSize(item.size)}
                  </td>
                  <td>
                    <span className={`badge ${item.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                      {item.status === 'success' ? '成功' : '失败'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {item.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
