# Changelog

所有值得注意的项目变更将在此文件中记录。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-04-16

### ✨ 新增

#### 核心功能
- **Markdown 到 PDF 转换**：高质量的文档渲染
- **三列布局界面**：编辑 + 预览 + PDF 输出并行显示
- **文件上传**：拖拽或浏览方式上传 Markdown 文件
- **实时预览**：自动或手动刷新渲染预览
- **预览编辑模式**：直接在预览中编辑内容并自动同步源码
- **快捷键**：`Ctrl+S` / `Cmd+S` 快速生成 PDF
- **字数统计**：实时显示文档字数和行数
- **自动 PDF 加载**：生成后自动在预览区显示 PDF

#### 格式支持
- 标题、段落、列表（有序/无序）
- 代码块与 130+ 编程语言高亮
- Markdown 风格的表格（自动换行）
- 任务列表（复选框）
- 脚注与注釈
- 行内 (`$...$`) 和块级 (`$$...$$`) LaTeX 公式
- 超链接与图片（相对路径）
- 引用块与分隔线

#### 中文排版
- 原生支持中英文混排
- 完整的 CJK 字体处理
- 特殊符号支持（数学、货币、各国文字）
- 自动换行与排版优化

#### 技术特性
- 跨平台支持（Windows / macOS / Linux）
- Electron 桌面应用（Windows portable exe）
- Web 版本（Node.js + Express）
- 无框架前端（原生 JavaScript + CSS Grid）
- GPU 硬件加速
- Playwright Chromium + Electron printToPDF 双路由渲染

### 技术栈

**前端**
- Vanilla JavaScript
- CSS Grid 三列响应式布局
- markdown-it 核心解析
- KaTeX 公式渲染
- highlight.js 代码高亮

**后端**
- Node.js + Express
- Playwright 1.54.2 (PDF 生成主路由)
- Electron 35.7.5 printToPDF (备用方案)
- 完整的资源路径解析

**构建**
- electron-builder (portable Windows exe)
- npm scripts 工作流

### 版本信息

- **Node.js**：18+
- **npm**：9+
- **Electron**：35.7.5
- **Playwright**：1.54.2
- **操作系统**：Windows 10/11, macOS 11+, Linux (通过源码构建)

### 🚀 性能优化

- ✅ 布局优化：消除 UI 滑动条，所有内容正确换行
- ✅ CSS 优化：移除重型动画和模糊效果
- ✅ 渲染优化：启用 GPU 硬件加速
- ✅ 内存管理：及时清理 PDF blob URL
- ✅ 预览防抖：大型文档自动切换为手动预览

### ✨ UI/UX 改进

- 🎨 清洁简洁的现代界面设计
- 📐 完美的空间利用（三列等宽布局）
- 🎯 直观的控件放置和流程
- 📱 响应式设计支持小屏幕
- 🌈 深色/浅色主题色彩系统

### 📝 文档

- ✅ 详细的 README (安装、使用、特性、架构)
- ✅ MIT LICENSE
- ✅ CHANGELOG (此文件)
- ✅ 代码注释与函数文档

---

## 未来计划 (Roadmap)

### v1.1.0 (计划中)
- [ ] 深色主题支持
- [ ] 自定义 CSS 主题
- [ ] Markdown 文件历史记录
- [ ] 批量转换功能
- [ ] 导出为 HTML/DOCX

### v1.2.0 (规划中)
- [ ] 云存储集成 (OneDrive/Google Drive)
- [ ] 实时协作编辑
- [ ] PDF 注释与批注
- [ ] Markdown 模板库

### 长期目标
- [ ] 浏览器扩展版本
- [ ] VS Code 扩展
- [ ] 移动应用 (React Native)
- [ ] 命令行工具改进

---

## 已知问题与限制

### 📋 当前限制

1. **PDF 宽度**：A4 纸张固定为 210mm，超长内容会自动换行
2. **图片支持**：仅本地相对路径，不支持远程 URL
3. **CSS 兼容性**：某些高级 CSS 在 Electron printToPDF 中可能不完全支持

### 🔍 已解决的问题

- ✅ [v1.0.0] 公式导致的水平滑动条
- ✅ [v1.0.0] HTTP 头部特殊字符编码错误
- ✅ [v1.0.0] 页面布局溢出问题
- ✅ [v1.0.0] 缺失的预览编辑功能

---

## 致谢

感谢以下开源项目的支持：

- [markdown-it](https://github.com/markdown-it/markdown-it) - Markdown 解析
- [KaTeX](https://github.com/KaTeX/KaTeX) - LaTeX 公式渲染
- [highlight.js](https://github.com/highlightjs/highlight.js) - 代码高亮
- [Playwright](https://github.com/microsoft/playwright) - 浏览器自动化
- [Electron](https://github.com/electron/electron) - 跨平台桌面应用
- [Express](https://github.com/expressjs/express) - Web 框架

---

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

**最后更新**：2026-04-16