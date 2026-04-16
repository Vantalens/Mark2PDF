# Mark2PDF

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-35.7.5-blue?logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=nodedotjs)](https://nodejs.org/)

一个高质量的 **Markdown → PDF 转换工具**，专注于完美渲染中文文档、复杂公式和代码块。支持网页版和跨平台桌面应用。

## English Version

Mark2PDF is a high-quality **Markdown to PDF converter** focused on stable rendering for Chinese documents, complex math formulas, and code blocks.

It supports both:
- Web version (Node.js + browser)
- Cross-platform desktop app (Electron)

Core highlights:
- Reliable Markdown rendering with KaTeX math support
- Syntax highlighting for 130+ languages
- Drag-and-drop upload and one-click PDF export
- Optimized layout for Chinese/English mixed content

## 核心特性

### 完美的文档渲染
- **中英文混排**：原生支持中文排版和 CJK 字体
- **复杂公式**：基于 KaTeX 的 LaTeX 数学公式，支持行内和块级
- **代码高亮**：130+ 编程语言，自动识别
- **特殊符号**：完整的 Unicode 符号支持（数学、货币、各国文字）
- **表格排版**：自动列宽分配，支持长内容换行

### 实时交互
- **拖拽上传**：直接拖拽 Markdown 文件到窗口
- **实时预览**：自动或手动刷新的 Markdown 渲染
- **预览编辑**：直接在预览中编辑内容，自动同步到源码
- **一键 PDF**：点击生成或 `Ctrl+S` 快捷键
- **自动加载**：生成后自动显示 PDF 预览

### 跨平台支持
- Windows 10/11 可执行文件（无需安装）
- Web 版本（Node.js 服务）
- macOS/Linux（通过源码构建）

## 安装与使用

### 方式一：Windows 可执行文件（推荐）
1. 下载 `Mark2PDF-x.x.x.exe` from [Releases](https://github.com/YOUR_USERNAME/Mark2PDF/releases)
2. 双击运行，无需安装
3. 拖拽 `.md` 文件或通过按钮上传

### 方式二：Web 版本
```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/Mark2PDF.git
cd Mark2PDF

# 安装依赖
npm install
npx playwright install chromium

# 启动服务
npm start

# 打开浏览器
# http://localhost:3000
```

### 方式三：桌面应用
```bash
npm install
npm run desktop  # 或 npm run dev 开发模式
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` / `Cmd+S` | 快速生成 PDF |
| `拖拽文件` | 上传 Markdown 文件 |

## 技术架构

### 前端
- **框架**：Vanilla JavaScript（无框架依赖）
- **渲染引擎**：Markdown-it + KaTeX
- **样式**：原生 CSS Grid（三列布局）

### 后端
- **服务器**：Express.js
- **PDF 生成**：Playwright Chromium（优先）+ Electron printToPDF（备用）
- **图像处理**：基于文件路径的相对资源解析

### 桌面应用
- **框架**：Electron 35.7.5
- **构建**：electron-builder（portable exe 模式）
- **GPU 加速**：启用硬件加速提升渲染性能

## 后期目标

### 1. 增加转换功能（多向转换）
不仅仅是 `Markdown → PDF`，后续将支持更多格式之间的双向/多向转换，例如：
- Markdown ↔ HTML
- Markdown ↔ DOCX
- Markdown ↔ TXT / RTF
- HTML ↔ PDF

### 2. 做成完整系列：Trans2Former
Mark2PDF 只是起点，后续将扩展为完整的文档转换工具系列 **Trans2Former**，覆盖更多内容处理与格式转换场景。


## 项目结构

```
Mark2PDF/
├── public/               # Web 前端
│   ├── index.html       # 主页面
│   ├── app.js           # 应用逻辑
│   └── styles.css       # UI 样式
├── src/                 # 后端代码
│   ├── web-server.js    # Express 服务器
│   ├── renderer.js      # Markdown/PDF 渲染引擎
│   ├── electron-main.js # Electron 主进程
│   └── template.css     # PDF 文档样式
├── dist/                # 构建输出
└── package.json
```

## 开发与构建

### 开发模式
```bash
npm run dev          # 启动 Electron 开发版本
npm start            # 启动 Web 服务
```

### 生产构建
```bash
npm run dist         # 构建 Windows portable exe
npm run build        # 打包应用（不签名）
```

## 已知限制

1. **PDF 宽度**：A4 纸张固定宽度 (210mm)，超长公式会换行显示
2. **图片引用**：仅支持本地相对路径，不支持远程 URL
3. **Electron PDF**：某些 CSS 特性可能与 printToPDF 兼容性有差异

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 贡献

欢迎提交 Issues 和 Pull Requests！

## 联系与反馈

- **GitHub Issues**：[Report a Bug](https://github.com/YOUR_USERNAME/Mark2PDF/issues)
- **功能建议**：欢迎在 Issues 中提交

---

**最后更新**：2026 年 4 月 16 日  
**版本**：1.0.0  
**维护状态**：活跃

```bash
npm run convert -- ./example.md
```

或者指定输出文件：

```bash
npm run convert -- ./example.md ./output.pdf
```

指定纸张格式（A4 / Letter）：

```bash
npm run convert -- ./example.md ./output.pdf --format A4
```

## 页面操作

1. 打开网页后，直接把 `.md` 文件拖到上传区域，或点击浏览文件。
2. 左侧可以继续编辑 Markdown，右侧会实时更新预览。
3. 点击“生成 PDF”后，页面下方会出现 PDF 预览。
4. 点击“下载 PDF”即可保存文件。

## 打包 Windows exe

```bash
npm install
npm run dist
```

打包完成后，`dist` 目录下会生成可执行文件。当前配置使用 portable 模式，适合直接双击运行。

## 示例 Markdown

在项目根目录创建 `example.md`：

```markdown
# Mark2PDF 演示

这是中文、English、符号混排：∞ ≠ ≤ ≥ ± © ® ™ Ω → ← ✓ ✗。

行内公式：$e^{i\pi}+1=0$。

块级公式：

$$
\int_{0}^{\infty} e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$

- [x] 任务 1
- [ ] 任务 2

```js
function add(a, b) {
  return a + b;
}
```
```

## 字体说明

程序使用以下字体回退链，尽可能提高跨平台表现：

- 正文：`Noto Serif SC`, `Source Han Serif SC`, `Noto Serif`, `Times New Roman`
- 代码：`Cascadia Code`, `Fira Code`, `JetBrains Mono`, `Consolas`
- 符号：`Noto Sans Symbols 2`, `Segoe UI Symbol`, `Arial Unicode MS`

若你的系统缺少某些字体，建议安装 Noto / Source Han 系列以获得更稳定的排版效果。
