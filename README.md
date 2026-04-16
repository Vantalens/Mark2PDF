# Mark2PDF

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-35.7.5-blue?logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=nodedotjs)](https://nodejs.org/)

一个高质量的 Markdown → PDF 转换工具，专注于中文排版、复杂公式和代码块渲染。支持网页版和 Windows 便携式桌面应用。

## 核心特性

### 完美的文档渲染
- 中英文混排
- 基于 KaTeX 的数学公式渲染
- 代码高亮
- 表格自动换行
- 脚注、任务列表、引用块

### 交互体验
- 拖拽上传 Markdown 文件
- 实时预览
- 一键生成 PDF
- 生成后自动加载 PDF 预览

### 发布形态
- Windows 10/11 便携包，无需安装
- Web 版本（Node.js 服务）
- 可通过源码在 macOS / Linux 构建运行

## 安装与使用

### 方式一：Windows Release 包（推荐）
1. 从 [Releases](https://github.com/Vantalens/Mark2PDF/releases) 下载 `Mark2PDF-v1.0.0.zip`
2. 解压后双击 `Mark2PDF.exe`
3. 直接拖拽 `.md` 文件或点击上传按钮开始使用

### 方式二：Web 版本
```bash
git clone https://github.com/Vantalens/Mark2PDF.git
cd Mark2PDF
npm install
npx playwright install chromium
npm start
```

### 方式三：桌面应用开发模式
```bash
npm install
npm run desktop
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+S / Cmd+S | 快速生成 PDF |
| 拖拽文件 | 上传 Markdown 文件 |

## 技术架构

### 前端
- Vanilla JavaScript
- CSS Grid 三列布局
- markdown-it + KaTeX

### 后端
- Node.js + Express
- Playwright Chromium PDF 路由
- Electron printToPDF 备用路由

### 桌面应用
- Electron 35.7.5
- electron-builder portable 模式
- 启用 GPU 硬件加速

## 后期目标

### 1. 增加转换功能（多向转换）
后续将支持更多格式之间的双向/多向转换，例如：
- Markdown ↔ HTML
- Markdown ↔ DOCX
- Markdown ↔ TXT / RTF
- HTML ↔ PDF

### 2. 做成完整系列：Trans2Former
Mark2PDF 只是起点，后续将扩展为完整的文档转换工具系列 Trans2Former，覆盖更多内容处理与格式转换场景。

## 已知限制

1. PDF 宽度固定为 A4，超长内容会自动换行。
2. 图片仅支持本地相对路径，不支持远程 URL。
3. 某些高级 CSS 在 Electron printToPDF 中可能存在兼容性差异。

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 贡献

欢迎提交 Issues 和 Pull Requests。

## 联系与反馈

- GitHub Issues: https://github.com/Vantalens/Mark2PDF/issues

---

**最后更新**：2026 年 4 月 16 日
**版本**：1.0.0
