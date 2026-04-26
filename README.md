# Trans2Former

Trans2Former 是一个面向浏览器端构建的多格式文档转换与动态编辑工具。当前项目不再依赖 Electron，应用形态统一为浏览器 Web 应用；核心底线是用户数据默认本地处理、默认不上传、不遥测、不留存文档内容。

## 当前状态

- 项目名：Trans2Former
- 包名：`trans2former`
- 当前可用输入：Markdown、HTML、TXT、JSON、CSV、XML、PNG
- 当前可用输出：Markdown、HTML、TXT、JSON、CSV、XML、PDF-print
- Electron：已移除
- Playwright：已从运行依赖移除
- CLI：已从当前运行形态移除，项目收敛为浏览器 Web 应用
- PDF：当前通过浏览器打印/另存为 PDF 完成
- 数据安全：核心转换默认 `local-only`
- 测试：`npm test` 覆盖核心转换、快照、浏览器自检和本地安全检查

## 目标方向

Trans2Former 不走“依赖本地安装办公软件”的路线，不要求用户安装 Microsoft Office、LibreOffice、Pandoc、Electron 或 Playwright。转换能力优先通过浏览器端 JavaScript、Web Worker、WASM、Canvas、ZIP/XML 解析和文件 API 实现，必要时只使用可在浏览器运行的轻量前端依赖。

产品壁垒：

- 网页端动态编辑：不仅转换，还要能编辑标准化后的文档结构。
- 实时预览：输入、结构、输出格式和 warnings 变化后尽量实时反馈。
- 行业顶尖质量：每个格式必须有样例、快照、降级说明和质量基准。
- 超广格式覆盖：长期覆盖 Office、PDF、EPUB、图片、压缩包、数据格式和可选 OCR/转写能力。
- 数据绝对安全：默认不上传用户文件；远程增强必须显式 opt-in。

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

详细分阶段任务见 [DEVELOPMENT_TASKS.md](DEVELOPMENT_TASKS.md)。转换降级策略见 [docs/CONVERSION_POLICY.md](docs/CONVERSION_POLICY.md)，DocumentModel schema 见 [docs/DOCUMENT_MODEL_SCHEMA.md](docs/DOCUMENT_MODEL_SCHEMA.md)，安全策略见 [docs/SECURITY_POLICY.md](docs/SECURITY_POLICY.md)。MarkItDown 调研见 [docs/MARKITDOWN_RESEARCH.md](docs/MARKITDOWN_RESEARCH.md)，市场调研见 [docs/MARKET_RESEARCH_2026-04-26.md](docs/MARKET_RESEARCH_2026-04-26.md)，格式覆盖目标见 [docs/MARKITDOWN_FORMAT_COVERAGE.md](docs/MARKITDOWN_FORMAT_COVERAGE.md)。

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

浏览器端自检页：

```text
http://localhost:3000/smoke-test.html
```

## 项目结构

```text
public/              浏览器界面
public/app.js        浏览器端界面逻辑
public/browser-transformer.js 浏览器端转换门面
public/core/         DocumentModel 与 ConverterRegistry
public/formats/      Markdown / HTML / TXT / JSON / CSV / XML / PNG / PDF-print 适配器
public/workers/      浏览器端转换 Worker
samples/             当前格式样例集
tests/snapshots/     转换快照
src/web-server.js    Express 静态资源容器
```

## 验证

```bash
npm test
```

当前 smoke test 会验证浏览器端 `DocumentModel -> ConverterRegistry -> 格式适配器` 基础链路。

`npm test` 当前包含：

- 核心转换 smoke test
- 固定转换快照测试
- 浏览器自检静态服务检查
- 本地安全 smoke test

## 数据安全

- 默认 `local-only`，核心转换在用户设备上执行。
- 默认不上传文档、图片、音频、转换结果、错误详情或编辑内容。
- 默认不接入第三方转换 API、OCR API、转写 API、分析 SDK 或遥测 SDK。
- 错误详情面板复制诊断时只复制脱敏字段，不默认复制用户文档正文、title 或 stack。
- 远程增强能力必须显式 opt-in，且默认关闭。

## 已知限制

1. PDF 当前使用浏览器打印/另存为 PDF，不是程序化生成 `.pdf` 二进制文件。
2. EPUB、DOCX、PPTX、PNG 输出尚未实现。
3. 任意格式互转仍需要继续建立统一中间文档模型，否则复杂格式之间会出现信息丢失。

## 许可证

MIT License - 详见 [LICENSE](LICENSE)。
