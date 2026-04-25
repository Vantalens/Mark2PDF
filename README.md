# Trans2Former

Trans2Former 是一个面向浏览器端构建的多格式文档转换工具。当前项目不再依赖 Electron，应用形态统一为浏览器 Web 应用；下一阶段目标是扩展到 EPUB、Word、PPT、HTML、TXT、PNG 等主流格式之间的任意转换。

## 当前状态

- 项目名：Trans2Former
- 包名：`trans2former`
- 当前可用输入：Markdown、HTML、TXT、JSON、CSV、XML、PNG
- 当前可用输出：Markdown、HTML、TXT、JSON、CSV、XML、PDF-print
- Electron：已移除
- Playwright：已从运行依赖移除
- CLI：已从当前运行形态移除，项目收敛为浏览器 Web 应用
- PDF：当前通过浏览器打印/另存为 PDF 完成

## 目标方向

Trans2Former 不走“依赖本地安装办公软件”的路线，不要求用户安装 Microsoft Office、LibreOffice、Pandoc、Electron 或 Playwright。转换能力优先通过浏览器端 JavaScript、Web Worker、WASM、Canvas、ZIP/XML 解析和文件 API 实现，必要时只使用可在浏览器运行的轻量前端依赖。

目标格式矩阵：

- Markdown
- HTML
- TXT
- JSON
- PDF
- EPUB
- Word DOCX
- PowerPoint PPTX
- PNG
- CSV
- XML
- ZIP
- Excel XLSX
- Audio metadata / transcription（可选能力）
- YouTube URL extraction（可选能力）

详细分阶段任务见 [DEVELOPMENT_TASKS.md](DEVELOPMENT_TASKS.md)。转换降级策略见 [docs/CONVERSION_POLICY.md](docs/CONVERSION_POLICY.md)，DocumentModel schema 见 [docs/DOCUMENT_MODEL_SCHEMA.md](docs/DOCUMENT_MODEL_SCHEMA.md)。MarkItDown 调研见 [docs/MARKITDOWN_RESEARCH.md](docs/MARKITDOWN_RESEARCH.md)，格式覆盖目标见 [docs/MARKITDOWN_FORMAT_COVERAGE.md](docs/MARKITDOWN_FORMAT_COVERAGE.md)。

## 仓库地址

https://github.com/Vantalens/Trans2Former

## 本地运行当前版本

```bash
npm install
npm start
```

打开：

```text
http://localhost:3000
```

当前版本使用 Node.js + Express 承载静态前端页面，文档转换在浏览器端执行。后续目标是进一步收敛为可静态部署的 Web 应用。

## 项目结构

```text
public/              浏览器界面
public/app.js        浏览器端界面逻辑
public/browser-transformer.js 浏览器端转换门面
public/core/         DocumentModel 与 ConverterRegistry
public/formats/      Markdown / HTML / TXT / JSON / PDF-print 适配器
src/web-server.js    Express 静态资源容器
```

## 验证

```bash
npm test
```

当前 smoke test 会验证浏览器端 `DocumentModel -> ConverterRegistry -> 格式适配器` 基础链路。

## 已知限制

1. PDF 当前使用浏览器打印/另存为 PDF，不是程序化生成 `.pdf` 二进制文件。
2. EPUB、DOCX、PPTX、PNG 尚未实现。
3. 任意格式互转仍需要继续建立统一中间文档模型，否则复杂格式之间会出现信息丢失。

## 许可证

MIT License - 详见 [LICENSE](LICENSE)。
