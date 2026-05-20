import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();

  const links = [
    { href: '/', label: '首页' },
    { href: '/pdf-to-word', label: 'PDF转Word' },
    { href: '/word-to-pdf', label: 'Word转PDF' },
    { href: '/history', label: '转换记录' },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          PDF-Word 转换器
        </Link>
        <nav className="nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={router.pathname === link.href ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
