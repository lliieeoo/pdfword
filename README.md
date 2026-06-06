# DocFlow — Free Online Document Converter

DocFlow 是一个免费的在线文档转换工具，支持 PDF 转 Word、Word 转 PDF、PDF 转 Excel 以及 OCR 文字识别。所有文件处理均在浏览器内完成，无需上传到服务器。

## 功能特性

- **PDF 转 Word** — 将 PDF 文件转换为可编辑的 Word 文档
- **Word 转 PDF** — 将 Word 文档转换为 PDF 格式（支持中文）
- **PDF 转 Excel** — 从 PDF 中提取表格数据并转换为 Excel
- **OCR 文字识别** — 识别扫描 PDF 和图片中的文字（支持中文简体 + 英文）

## 技术栈

| 技术 | 版本 |
|------|------|
| Next.js (Pages Router) | 14.2.3 |
| TypeScript | 5.x (strict mode) |
| Tailwind CSS | 3.4.x |
| React | 18.3.x |

## 本地运行

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装和运行

```bash
# 1. 克隆仓库
git clone https://github.com/lliieeoo/pdfword.git
cd pdfword

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm run dev

# 4. 打开浏览器访问
# http://localhost:3000
```

### 构建

```bash
npm run build
npm start
```

### 主要页面

| 路由 | 说明 |
|------|------|
| `/` | 首页（Hero + 工具列表 + FAQ） |
| `/pdf-to-word` | PDF 转 Word |
| `/word-to-pdf` | Word 转 PDF |
| `/pdf-to-excel` | PDF 转 Excel |
| `/ocr` | OCR 文字识别 |

### API 路由

| 路由 | 方法 | 请求体 | 说明 |
|------|------|--------|------|
| `/api/convert/pdf-to-word` | POST | `{ text, fileName }` | 生成 DOCX |
| `/api/convert/word-to-pdf` | POST | `{ html, fileName }` | 生成 PDF |
| `/api/convert/pdf-to-excel` | POST | `{ text, tables, fileName }` | 生成 XLSX |

## GitHub 使用说明

### 推送代码

```bash
# 查看所有分支
git branch -a

# 当前开发在 feature/docflow-rebuild 分支
git checkout feature/docflow-rebuild

# 推送分支到 GitHub
git push origin feature/docflow-rebuild

# 在 GitHub 上创建 Pull Request → main
```

### 分支策略

- `main` — 生产分支（已部署）
- `feature/docflow-rebuild` — 当前重构分支

### 提交规范

本次重构按 Phase 分阶段提交：

```text
Phase 1: TypeScript Migration      ← 添加 TypeScript，转换 .js → .tsx/.ts
Phase 2: TailwindCSS Migration     ← 添加 TailwindCSS 配置
Phase 3: UI Rewrite                ← 重写 Header/Footer
Phase 4: Feature Implementation    ← 所有功能模块 + 页面 + API
Phase 5: Cleanup                   ← 删除无用文件和依赖
Phase 6: Build Verification        ← 构建验证 + Bug 修复
```

可以按 Phase 回滚：`git revert <phase-commit-hash>`

## Vercel 部署步骤

> ⚠️ **注意**：此项目已绑定 Vercel 项目。
> 下方步骤仅用于首次部署或重建部署。

### 方式一：自动部署（推荐）

1. 推送代码到 GitHub 的 `main` 分支
2. Vercel 自动检测变更并部署
3. 部署完成后自动绑定自定义域名

### 方式二：手动部署（首次）

1. 打开 [Vercel Dashboard](https://vercel.com)
2. 点击 **Add New → Project**
3. Import GitHub Repository: `lliieeoo/pdfword`
4. Framework Preset: **Next.js**
5. Root Directory: `./`（默认）
6. Build Command: `next build`（默认）
7. Output Directory: `.next`（默认）
8. 点击 **Deploy**

### Vercel 配置

- **Serverless Body Limit**: 约 4.5MB（Vercel Free Plan 限制）
- **文件处理策略**: 大文件解析在浏览器端完成，服务端只负责生成二进制文件

### 环境变量

本项目的环境变量配置（如需添加）：

```bash
# 在 Vercel Project Settings → Environment Variables 中配置
```

## Cloudflare 域名接入步骤

> ⚠️ **注意**：域名已配置完成。
> 下方步骤仅用于首次接入参考。

### 前提

- Vercel 项目已部署成功，获得 `.vercel.app` 域名
- 拥有自定义域名（如 `docflow.app`）

### 步骤

1. **登录 Cloudflare Dashboard**
   - 添加你的域名到 Cloudflare
2. **添加 DNS 记录**
   - 类型: `CNAME`
   - 名称: `@`（或 `www`）
   - 目标: `cname.vercel-dns.com`
   - Proxy status: **Proxied**（橙色云朵）
3. **在 Vercel 中配置域名**
   - 打开 Vercel Dashboard → Project → Settings → Domains
   - 添加你的自定义域名
   - Vercel 会自动验证并配置 SSL 证书
4. **等待生效**
   - DNS 传播通常需要 5-30 分钟
   - SSL 证书由 Vercel 自动管理（Let's Encrypt）

### Cloudflare SSL/TLS 设置

- SSL 模式: **Full (strict)**
- Always Use HTTPS: **开启**

## 项目结构

```
├── components/
│   ├── Header.tsx          # 导航栏（响应式，含移动端菜单）
│   └── Footer.tsx          # 页脚（三列布局）
├── hooks/
│   ├── useFileUpload.ts    # 文件上传钩子（拖拽 + 校验）
│   └── useConversionProgress.ts  # 进度追踪钩子
├── lib/
│   ├── services/
│   │   ├── pdfParser.ts    # 浏览器端 PDF 解析（pdfjs-dist）
│   │   ├── pdfToWord.ts    # PDF → Word 编排（自动 OCR 降级）
│   │   ├── pdfToExcel.ts   # PDF → Excel（表格检测）
│   │   ├── wordToPdf.ts    # Word → PDF（mammoth 客户端）
│   │   └── ocrService.ts   # Tesseract.js OCR 封装
│   └── types.ts
├── pages/
│   ├── index.tsx           # 首页
│   ├── pdf-to-word.tsx     # PDF 转 Word 页面
│   ├── word-to-pdf.tsx     # Word 转 PDF 页面
│   ├── pdf-to-excel.tsx    # PDF 转 Excel 页面
│   ├── ocr.tsx             # OCR 页面
│   ├── _app.tsx            # App 入口
│   ├── _document.tsx       # Document（SEO meta）
│   └── api/convert/
│       ├── pdf-to-word.ts  # DOCX 生成 API
│       ├── word-to-pdf.ts  # PDF 生成 API
│       └── pdf-to-excel.ts # XLSX 生成 API
├── types/
│   └── index.ts            # 共享类型定义
├── public/
│   ├── sitemap.xml
│   └── robots.txt
├── fonts/
│   └── NotoSansSC-Regular.ttf  # 中文字体（保留）
├── styles/
│   └── globals.css         # Tailwind 入口
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── vercel.json
```

## 性能优化

- **动态导入**: Tesseract.js、pdfjs-dist、ExcelJS 均使用动态 `import()` 懒加载
- **Serverless 友好**: 大文件在浏览器端解析，服务端只做轻量文档生成
- **按页解析**: 使用 `getPage()` 方法逐页加载 PDF，避免浏览器卡死
- **文件安全**: 文件仅保存在浏览器内存，转换完成后自动清除

## 错误处理

- 损坏 PDF / OCR 失败 / 文件过大（>50MB）/ 格式错误 → 友好的中文提示
- Tesseract 语言包加载失败 → 清晰的错误信息和重试按钮
- API 错误 → 统一 `{ error: string }` 响应格式

## License

MIT
