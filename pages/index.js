import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>PDF-Word 转换器 | 免费在线文件转换</title>
      </Head>

      <div style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '20px' }}>
        <h1 className="page-title" style={{ fontSize: '36px', marginBottom: '12px' }}>
          PDF-Word 在线转换器
        </h1>
        <p className="page-desc" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto 16px' }}>
          免费、快速、安全的文件格式转换工具
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          支持PDF转Word、Word转PDF，保留原始格式和布局
        </p>
      </div>

      <div className="features-grid">
        <Link href="/pdf-to-word" className="feature-card">
          <div className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h3>PDF 转 Word</h3>
          <p>将PDF文档快速转换为可编辑的Word文件，保留文本、图片和格式</p>
        </Link>

        <Link href="/word-to-pdf" className="feature-card">
          <div className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          </div>
          <h3>Word 转 PDF</h3>
          <p>将Word文档转换为PDF格式，方便分享和打印，保持排版一致</p>
        </Link>

        <Link href="/history" className="feature-card">
          <div className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>转换记录</h3>
          <p>查看您的文件转换历史记录，方便追踪和管理已转换的文件</p>
        </Link>
      </div>

      <div className="card" style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>为什么选择我们？</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>🔒 安全可靠</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>文件在服务器端处理完成后立即删除，保护您的隐私</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>⚡ 快速转换</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>采用高效的转换引擎，几秒钟即可完成文件转换</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>💰 完全免费</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>所有功能完全免费使用，无需注册账号</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>📱 多端适配</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>支持手机、平板、电脑等多种设备使用</p>
          </div>
        </div>
      </div>
    </>
  );
}
