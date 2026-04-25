# Trans2Former Development Tasks

最后更新：2026-04-25  
维护规则：每次开发结束后必须更新本文件，标记已完成项并补充新发现任务。

## 目标原则

- 浏览器端优先：不依赖 Microsoft Office、LibreOffice、Pandoc、Electron、Playwright 或其他本地转换软件。
- 任意格式互转：所有输入先进入 `DocumentModel`，再输出到目标格式。
- 大文件不阻塞界面：解析、转换、压缩和图片处理默认放入 Web Worker 或空闲调度。
- 格式能力透明：UI 必须展示输入/输出限制、降级策略和预计损失。
- 可验证交付：每个阶段都要有样例、自动化测试和浏览器端 smoke test。

## 当前基线

- [x] 项目标识统一为 Trans2Former。
- [x] 仓库地址迁移到 `https://github.com/Vantalens/Trans2Former`。
- [x] 移除 Electron、Playwright、CLI 和服务端转换 API。
- [x] Express 仅保留静态资源托管和 `/api/health`。
- [x] 转换链路改为 `input -> DocumentModel -> output`。
- [x] `DocumentModel`、`AssetStore`、`ConverterRegistry` 已建立。
- [x] 转换任务已移入 Web Worker，支持基础进度、用户可读错误和取消按钮。
- [x] `npm test` smoke test 已建立。
- [x] `.gitignore` 已覆盖依赖、构建产物、导出文件、日志缓存、本地环境和测试截图。

## P0：近期优先任务

- [ ] 建立样例集：每种当前支持格式至少 3 个样例，覆盖中文、图片、表格、列表、代码。
- [ ] 扩展转换快照测试，覆盖 HTML/TXT/JSON/PNG/CSV/XML 的 round-trip 和降级结果。
- [ ] 将预览渲染迁移到 Worker 或 idle callback，避免大文档输入卡顿。
- [ ] 添加错误详情面板，展示 schema 校验错误、解析错误、降级说明。
- [ ] 添加可视化进度条，接入 Worker progress event。
- [ ] 完善 Markdown 脚注、链接、图片和高级内联语法支持。
- [ ] 为 PNG 输出设计 Canvas 渲染入口和分页策略。

## P1：核心架构增强

- [ ] 支持转换链路编排，例如 `docx -> DocumentModel -> html -> png`。
- [ ] 添加更细的错误分类：parse / validate / convert / render / download。
- [ ] 设计可选格式适配器加载策略，避免核心包膨胀。
- [ ] 扩展 format adapter 安全边界说明，尤其是 HTML、DOCX、PPTX、EPUB 输入。
- [ ] 将 JSON schema 增加机器可读版本，例如 `docs/document-model.schema.json`。
- [ ] 添加浏览器端 E2E：上传、转换、下载、预览。
- [ ] 添加性能基准：1MB、10MB、50MB 文档转换时间和内存。

## P2：UI 与产品能力

- [ ] 支持批量转换和 ZIP 下载。
- [ ] 添加转换历史。
- [ ] 针对移动端和小屏幕优化文件区、格式选择区、预览区。
- [ ] 发布包名称和图标资产彻底迁移到 Trans2Former。
- [ ] 发布为静态 Web 应用，可部署到 GitHub Pages、Cloudflare Pages 或任意静态服务器。

## 格式覆盖矩阵

| 格式 | 输入 | 输出 | 当前状态 | 下一步 |
| --- | --- | --- | --- | --- |
| Markdown | [x] | [x] | 支持标题、段落、列表、引用、代码、图片、表格 | 补脚注、高级内联、更多 round-trip 测试 |
| HTML | [x] | [x] | DOMParser 安全抽取，输出自包含 HTML | 扩展复杂表格/链接/图片降级测试 |
| TXT | [x] | [x] | 支持段落、空行、简单标题推断 | 增加大文本性能测试 |
| JSON | [x] | [x] | 输出 Trans2Former DocumentModel JSON；schema 校验已接入 | 生成机器可读 JSON schema |
| CSV | [x] | [x] | 第一行表头映射为 table block | 增加引号、换行、逗号边界样例 |
| XML | [x] | [x] | raw XML + 可读文本结构；标准 XML 输出 | 完善命名空间、属性、嵌套结构映射 |
| PNG | [x] | [ ] | 输入进入 AssetStore，可转 HTML/MD/JSON/TXT/PDF-print | Canvas PNG 输出、多页/长图策略 |
| PDF | [ ] | [~] | 当前输出为浏览器打印/另存 PDF | 评估 pdf-lib/jsPDF/pdf.js，先做输出再评估输入 |
| ZIP | [ ] | [ ] | 未做 | 浏览器 ZIP 解包/打包，支撑批量转换和 EPUB/DOCX/PPTX/XLSX |
| EPUB | [ ] | [ ] | 未做 | ZIP + OPF + XHTML 解析/生成 |
| DOCX | [ ] | [ ] | 未做 | OOXML ZIP 解析/生成，保留正文结构与媒体资源 |
| PPTX | [ ] | [ ] | 未做 | 设计 `PresentationModel`，借鉴 PPTskills schema 思路 |
| XLSX | [ ] | [ ] | 未做 | OOXML ZIP 表格解析，映射 table block / workbook metadata |
| JPEG/WebP/SVG | [ ] | [ ] | 未做 | 扩展 AssetStore 图片输入与输出策略 |
| Audio | [ ] | [ ] | 未做 | 先做 metadata；转写作为可选能力评估 |
| YouTube URL | [ ] | [ ] | 未做 | 浏览器环境限制较大，作为可选远程提取能力评估 |

说明：`[~]` 表示已有过渡方案，但不是最终程序化输出能力。

## 已完成归档

### 项目迁移

- [x] README、INSTALL、CONTRIBUTING、CHANGELOG、COMMIT_CHECKLIST 已同步浏览器优先路线。
- [x] 旧桌面壳文档和服务端转换路线已清理。
- [x] Git remote 已更新为 `Vantalens/Trans2Former`。

### 模型与策略

- [x] `docs/CONVERSION_POLICY.md` 已定义不可逆信息和降级策略。
- [x] `docs/DOCUMENT_MODEL_SCHEMA.md` 已文档化 DocumentModel。
- [x] `public/core/document-schema.js` 已提供基础 schema 校验。
- [x] `docs/MARKITDOWN_RESEARCH.md` 已记录 MarkItDown 借鉴结论。
- [x] `docs/MARKITDOWN_FORMAT_COVERAGE.md` 已建立 MarkItDown 格式覆盖目标。

### 已支持格式

- [x] Markdown 输入/输出。
- [x] HTML 输入/输出。
- [x] TXT 输入/输出。
- [x] JSON 输入/输出。
- [x] CSV 输入/输出。
- [x] XML 输入/输出基础版。
- [x] PNG 输入。
- [x] PDF-print 过渡输出。

### UI 与测试

- [x] UI 动态读取格式能力表。
- [x] UI 显示格式限制、输出限制和预计损失。
- [x] 转换取消按钮已接入。
- [x] 基础转换快照测试已加入 `npm test`。
- [x] `git check-ignore -v` 已验证生成物会被忽略，源码和文档不会被误忽略。