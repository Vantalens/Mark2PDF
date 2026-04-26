# Trans2Former Development Tasks

最后更新：2026-04-26  

维护规则：

- 每次开发结束后必须更新本文件，标记已完成项并补充新发现任务。
- 必须做到任务细化、可执行、可验证，且与项目目标和原则保持一致。
- 可以按阶段（P0/P1/P2）和优先级（A/B/C）分类，但不要求严格执行顺序，重要的是保持整体路线清晰和可追踪。
- 可以添加新的任务分类，例如“技术债务”、“研究探索”、“社区贡献”等，但核心开发任务必须明确标记为 P0/P1/P2。
- 可以在每个任务后面添加状态标签，例如 `[ ]`（未开始）、`[x]`（已完成）、`[~]`（进行中）等，方便快速识别当前进展。
- 可以添加尚未进入开发计划但需要记录的未来任务或想法，但必须清晰标记为“未来任务”或“待评估”，避免混淆当前开发路线。
- 可以添加尚未解决的问题或风险，并标记为“问题”或“风险”，以便后续跟踪和管理。
- 定期（例如每月）回顾和更新本文件，确保它始终反映当前的开发状态和未来计划。

## 目标原则

- 用户数据绝对安全：默认本地处理，默认不上传、不遥测、不留存文档内容；任何远程能力都必须显式 opt-in、可关闭、可解释。
- 浏览器端优先：不依赖 Microsoft Office、LibreOffice、Pandoc、Electron、Playwright 或其他本地转换软件。
- 本地化处理优先：优先使用浏览器 File API、Web Worker、WASM、Canvas、IndexedDB、ZIP/XML 解析完成转换；后期 GUI 也必须保留本地优先路线。
- 任意格式互转：所有输入先进入 `DocumentModel`，再输出到目标格式。
- 市场路径优先：优先服务 `Office/PDF/HTML/Data -> Markdown/HTML/JSON`，其次再扩展高保真反向生成。
- 产品壁垒优先：网页端动态编辑、实时预览、行业顶尖转换质量、超广格式覆盖必须作为核心路线，而不是附属功能。
- 大文件不阻塞界面：解析、转换、压缩和图片处理默认放入 Web Worker 或空闲调度。
- 上传文件大小无限制目标：产品不设置人为固定上限；通过分片读取、流式解析、Worker、渐进预览和磁盘/IndexedDB 缓存适配超大文件，实际上限只受用户设备和浏览器能力约束。
- 动态分块转换优先但不破坏转换效果：单个超大文件可按语义边界拆成子模块并行/分步转换，再结构化合并；合并结果必须与直接转换在语义和输出质量上等价。
- 代码水平拆分可作为工程手段：格式适配器、Worker、渲染、UI、测试可独立拆分，但不得绕过 `DocumentModel` 或牺牲转换效果。
- 格式能力透明：UI 必须展示输入/输出限制、降级策略和预计损失。
- 可验证交付：每个阶段都要有样例、自动化测试和浏览器端 smoke test。

## 市场调研结论

调研记录见 [docs/MARKET_RESEARCH_2026-04-26.md](docs/MARKET_RESEARCH_2026-04-26.md)。

- AI/RAG 需求正在推动“多格式转干净 Markdown”：MarkItDown、GetMarkdown、RawMark、Markitdown Online 都以 Office/PDF/HTML/Data 转 Markdown 为核心卖点。
- PDF/Office 互转是成熟市场高频需求，但高保真 PDF to DOCX/PPTX/XLSX 难度高；浏览器优先路线应先做结构提取、可解释降级和 Markdown/HTML 输出。
- 隐私、本地转换、多文件批量、ZIP 下载是浏览器端产品的差异化方向，应进入中期优先级。

## 产品差异化定位

市场需求只决定切入顺序，Trans2Former 自身壁垒必须来自以下四点：

- **用户数据绝对安全**：所有核心转换默认在用户设备上执行，文档内容不离开本机；远程 OCR、转写、AI 增强只能作为明确可选能力。
- **网页端动态编辑**：用户不是只上传、转换、下载，而是能在浏览器中编辑标准化后的文档结构、块内容、表格、图片引用和输出参数。
- **实时预览**：输入编辑、格式选择、转换 warnings、输出预览应尽量实时反馈；大文档通过 Worker、idle callback、增量渲染避免卡顿。
- **上传文件大小无限制**：不做固定 MB/GB 上限，用分片、流式、渐进处理支撑超大文件；遇到设备资源瓶颈时给出可解释提示，而不是提前拒绝。
- **行业顶尖质量**：每个格式适配器必须有样例集、快照、降级说明、性能基准和人工可读质量准则；不能只做到“能跑”。
- **超广格式覆盖**：长期目标继续保持超多格式支持，包括 Office、PDF、EPUB、图片、压缩包、数据格式、音频/视频元数据和可选 OCR/转写能力。
- **后期 GUI 产品化**：Web 端先打磨核心体验，后期提供 GUI/桌面外壳或 PWA 形态，但 GUI 不得牺牲本地优先和数据安全底线。

## 数据安全底线

- 默认不上传文档、图片、音频、转换结果、错误详情或用户编辑内容。
- 默认不接入第三方转换 API、OCR API、转写 API、分析 SDK 或遥测 SDK。
- 错误详情面板必须区分“可复制诊断信息”和“可能包含用户内容的原始片段”，默认不自动复制用户内容。
- IndexedDB/localStorage 只能保存用户明确允许的历史、偏好和临时缓存，并提供清除入口。
- 远程增强能力必须满足：显式开关、用途说明、发送内容预览、可取消、可审计、默认关闭。
- 安全测试必须覆盖：无网络转换路径、敏感内容不进入日志、导出文件不泄漏额外 metadata、取消后释放 Blob URL 和 Worker。

## 动态分块与合并原则

设计记录见 [docs/DYNAMIC_CHUNKING_MERGE_DESIGN.md](docs/DYNAMIC_CHUNKING_MERGE_DESIGN.md)。

- 单个超大文件优先按语义边界动态拆分，例如章节、段落、表格、页、幻灯片、工作表、XML/HTML 节点、ZIP entry。
- 每个 chunk 独立转换为 partial `DocumentModel`，并携带顺序、来源范围、上下文摘要、资源引用和 warnings。
- 合并阶段必须恢复全局结构：标题层级、列表连续性、表格连续性、脚注/链接、asset 去重、metadata 和 warnings。
- 合并后的 `DocumentModel` 与直接整文件转换结果必须语义等价；差异必须有登记原因和快照覆盖。
- 不允许为了分块速度破坏表格、代码块、XML/HTML 节点、图片资源或压缩包 entry。
- 直接转换与分块转换要共用 reader/writer 语义，避免两套逻辑产生质量漂移。

## 代码水平拆分原则

- 可以按格式、执行层、UI 能力和质量测试拆分代码模块。
- 代码拆分必须保持 `input -> DocumentModel -> output` 语义一致，并通过现有快照和样例测试。
- 不允许绕过 `DocumentModel` 做格式之间的私有直连，除非该直连只是性能优化且输出仍能回写/解释为 `DocumentModel`。
- 拆分前先补边界测试，拆分后比较快照、warnings、资源引用和错误分类，确认转换效果没有退化。

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

目标：先把现有 7 种输入、7 种输出的质量基线做稳，避免在 DOCX/PPTX/EPUB 之前继续堆不可靠能力。

### P0-A：样例与自动化基线

阶段状态：已完成。当前 `npm test` 会覆盖核心转换 smoke test、固定转换快照、浏览器端自检页面和静态服务入口。

- [x] 建立 `samples/` 样例集：每种当前支持输入格式至少 3 个样例，覆盖中文、图片、表格、列表、代码和异常输入。
- [x] 将 `scripts/smoke-test.js` 拆分为可维护测试用例，覆盖 Markdown/HTML/TXT/JSON/CSV/XML/PNG 的解析、输出和降级说明。
- [x] 扩展转换快照测试，覆盖当前可输出格式的 round-trip、不可逆降级、错误输入和空文档边界。
- [x] 添加浏览器端 smoke test：上传样例、选择格式、执行转换、下载结果、刷新预览。

### P0-B：错误、进度与大文档体验

阶段状态：进行中。统一错误结构已完成，下一步让 UI/Worker 展示可读诊断和真实阶段进度。

- [x] 定义统一 `ConversionError` 结构，分类为 parse / validate / convert / render / download。
- [x] 错误详情面板 UI：展示 category / code / format / message / warnings，不默认展示 stack 或 raw snippet。
- [x] 错误详情脱敏复制：复制诊断时只复制 category/code/format/message/warnings，不包含用户文档正文、title、stack。
- [x] Worker 错误透传：Worker error message 保留 `ConversionError.toJSON()` 字段，主线程可直接渲染。
- [x] Worker 阶段进度：progress 从固定 20%/100% 改为 read / parse / validate / convert / render / package。
- [x] 可视化进度条：显示阶段、百分比、忙碌状态和取消状态。
- [ ] 取消清理：取消转换后清理 active worker、旧下载 Blob URL、旧输出状态，避免留下可下载的旧结果。
- [ ] 预览迁移：将预览渲染迁移到 Worker 或 idle callback，避免大文档输入卡顿。
- [ ] 大文件入口策略：UI 不设置固定文件大小上限，文件读取改为按格式支持分片/流式路径，并在资源不足时返回可解释错误。
- [x] 添加本地安全 smoke test：验证核心转换不触发网络请求、不写入远程端点、不在日志输出用户文档内容。

### P0-C：当前格式质量补齐

- [ ] 完善 Markdown 脚注、链接、图片、表格对齐、嵌套列表和高级内联语法支持。
- [ ] 强化 CSV 解析，覆盖引号、换行、逗号、空单元格、BOM 和不同换行符。
- [ ] 强化 XML 解析，覆盖命名空间、属性、嵌套结构和 parsererror 展示。
- [ ] 为 PNG 输出设计 Canvas 渲染入口、分页策略、长图策略和下载命名规则。
- [x] 将 JSON schema 增加机器可读版本，例如 `docs/document-model.schema.json`，并让测试引用同一份 schema。

## P1：核心架构增强

目标：为 ZIP/EPUB/OOXML 这类容器格式铺路，先补清楚编排、资源、适配器边界，并优先支持市场需要的 AI-ready Markdown 输出。

- [x] 建立安全策略文档：本地处理边界、远程能力 opt-in 规则、缓存/历史保留规则、敏感数据日志规则。
- [ ] 增加安全模式开关：默认 `local-only`，禁止远程适配器、遥测、外部资源抓取。
- [ ] 将 `DocumentModel` 扩展为可编辑结构：稳定 block id、selection metadata、source span、warnings、format-specific metadata。
- [ ] 设计网页端编辑状态模型：输入编辑、标准化结构编辑、输出选项编辑、预览状态和下载状态分离。
- [ ] 设计动态分块转换架构：chunk planner、chunk reader、partial DocumentModel、merge planner、merged DocumentModel、output writer。
- [ ] 建立直接转换 vs 分块转换等价测试：比较 blocks、assets、warnings、metadata、Markdown/HTML/JSON 快照。
- [ ] 建立合并算法：恢复标题层级、连续列表、连续表格、代码块、脚注/链接、资源去重和 chunk provenance。
- [ ] 建立代码水平拆分边界：format adapter、conversion pipeline、render pipeline、worker protocol、UI panels、quality fixtures。
- [ ] 支持转换链路编排，例如 `docx -> DocumentModel -> html -> png`。
- [ ] 设计转换任务上下文 `ConversionContext`，统一传递 signal、progress、warnings、assets 和 options。
- [ ] 设计超大文件处理架构：chunk reader、stream parser、backpressure、临时资源释放、分阶段快照和可恢复取消。
- [ ] 设计可选格式适配器加载策略，避免核心包膨胀。
- [ ] 扩展 format adapter 安全边界说明，尤其是 HTML、ZIP、DOCX、PPTX、EPUB 输入。
- [ ] 完善 `AssetStore` 的资源去重、大小限制、MIME 校验和导出策略。
- [ ] 建立 AI-ready Markdown 输出准则：标题层级、表格、列表、链接、图片占位、页/幻灯片/工作表边界、降级说明。
- [ ] 为 Markdown/HTML/JSON 输出增加 `warnings`，让用户知道哪些样式、布局、动画、扫描图像或公式被降级。
- [ ] 建立行业顶尖质量基准：语义保真、表格保真、资源保真、版面降级可解释、输出可读性、性能和稳定性。
- [ ] 添加性能基准：1MB、10MB、50MB 文档转换时间、内存占用和 UI 阻塞时间。
- [ ] 添加超大文件基准：100MB、500MB、1GB+ 样例的读取、预览、转换、取消和内存峰值记录。
- [ ] 设计 GUI/PWA/桌面外壳路线：Web 核心复用、离线可用、文件系统权限最小化、本地处理不回退。

## P2：新格式与产品能力

目标：在 P0/P1 基线稳定后再扩展格式，按市场需求优先做 Office/PDF/EPUB 到 Markdown/HTML/JSON 的提取能力，再做高保真反向生成。

- [ ] 实现 PWA 离线模式：核心 JS、Worker、样式和自检页可离线使用。
- [ ] 实现隐私控制中心：本地缓存清理、历史开关、远程增强总开关、导出诊断检查。
- [ ] 实现结构化编辑器：按 block 编辑标题、段落、列表、代码、表格、图片/asset 引用。
- [ ] 实现实时预览 v2：编辑输入、编辑结构、切换输出格式时自动刷新预览，并显示 debounce/worker 状态。
- [ ] 实现预览对照模式：输入原文、标准化 DocumentModel、目标输出三栏/标签页对照。
- [ ] 支持批量转换和 ZIP 下载。
- [ ] 添加转换历史，默认只保存在浏览器本地，不上传文档内容。
- [ ] 针对移动端和小屏幕优化文件区、格式选择区、预览区。
- [ ] 发布包名称和图标资产彻底迁移到 Trans2Former。
- [ ] 发布为静态 Web 应用，可部署到 GitHub Pages、Cloudflare Pages 或任意静态服务器。
- [ ] 实现 DOCX 输入 MVP：段落、标题、列表、表格、图片引用、链接，优先输出 Markdown/HTML/JSON。
- [ ] 实现 PPTX 输入 MVP：幻灯片标题、文本框、表格、图片 alt/占位、演讲者备注，优先输出 Markdown/HTML/JSON。
- [ ] 实现 XLSX 输入 MVP：多工作表、单元格文本、基础表格映射，优先输出 Markdown/CSV/JSON。
- [ ] 实现 EPUB 输入 MVP：ZIP + OPF + XHTML 解析，优先输出 Markdown/HTML/JSON。
- [ ] 实现 PDF 输入评估版：先支持文本型 PDF 到 Markdown/HTML；扫描 PDF/OCR 作为可选能力，不进入核心包默认路径。
- [ ] 实现图片元数据和 OCR 预留接口：先支持 JPEG/WebP/SVG/PNG 作为 AssetStore 输入，OCR 后续按可选插件或外部 API 评估。
- [ ] 实现 DOCX 输出 MVP：只承诺由 DocumentModel 生成基础段落、标题、列表、表格、图片，不承诺复杂版式还原。
- [ ] 实现 PPTX 输出前先设计 `PresentationModel`，不要直接塞进 `DocumentModel`。
- [ ] 扩展超广格式路线：RTF、ODT、YAML、TOML、LaTeX、IPYNB、SVG、JPEG、WebP、GIF、BMP、TIFF 进入评估矩阵。
- [ ] 后期 GUI：基于同一 Web 核心提供桌面 GUI/PWA 安装体验，支持拖拽、多窗口、批量队列、本地文件系统权限最小化。

## 建议执行顺序

1. 先做 `samples/` 和测试拆分，让每个格式后续改动都有回归保护。
2. 再做统一错误结构和详情面板，因为它会影响解析器、Worker、UI 三层接口。
3. 同步建立本地安全 smoke test 和安全策略文档，保证后续功能不突破数据安全底线。
4. 接着做 Worker 阶段化进度和预览迁移，解决大文档卡顿与进度不可解释的问题。
5. 同步建立大文件无限制架构：不设人为上限，改造读取、解析、预览、取消和资源释放。
6. 设计动态分块转换与合并算法，并建立直接转换 vs 分块转换等价测试。
7. 设计代码水平拆分边界，保证后续扩展格式时不牺牲转换效果。
8. 然后补 AI-ready Markdown 输出准则、warnings 和质量评分维度，让降级结果可解释。
9. 再设计可编辑 `DocumentModel` 与结构化编辑器，形成网页端动态编辑和实时预览壁垒。
10. 进入 ZIP/OOXML 基础设施，优先做 DOCX/PPTX/XLSX 输入到 Markdown/HTML/JSON。
11. 随后做 EPUB 和 PDF 文本提取；扫描 PDF/OCR、音频、YouTube 放到可选能力，不进入核心 MVP。
12. 长期扩展超广格式矩阵，并为每个新增格式建立质量基准、样例集和快照测试。
13. 后期推进 GUI/PWA/桌面外壳，但必须复用 Web 核心并保持本地优先处理。

## 格式覆盖矩阵

| 格式 | 输入 | 输出 | 当前状态 | 下一步 |
| --- | --- | --- | --- | --- |
| Markdown | [x] | [x] | 支持标题、段落、列表、引用、代码、图片、表格 | 补 AI-ready Markdown 输出准则、脚注、高级内联、更多 round-trip 测试 |
| HTML | [x] | [x] | DOMParser 安全抽取，输出自包含 HTML | 扩展复杂表格/链接/图片降级测试，补 HTML -> Markdown 市场样例 |
| TXT | [x] | [x] | 支持段落、空行、简单标题推断 | 增加大文本性能测试 |
| JSON | [x] | [x] | 输出 Trans2Former DocumentModel JSON；schema 校验已接入 | 生成机器可读 JSON schema |
| CSV | [x] | [x] | 第一行表头映射为 table block | 增加引号、换行、逗号边界样例 |
| XML | [x] | [x] | raw XML + 可读文本结构；标准 XML 输出 | 完善命名空间、属性、嵌套结构映射 |
| PNG | [x] | [ ] | 输入进入 AssetStore，可转 HTML/MD/JSON/TXT/PDF-print | Canvas PNG 输出、多页/长图策略 |
| PDF | [ ] | [~] | 当前输出为浏览器打印/另存 PDF | 市场需求高；先做文本型 PDF -> Markdown/HTML 评估，不承诺高保真 PDF -> Office |
| ZIP | [ ] | [ ] | 未做 | 浏览器 ZIP 解包/打包，支撑批量转换、EPUB、DOCX、PPTX、XLSX |
| DOCX | [ ] | [ ] | 未做 | 市场优先级最高；先做输入到 Markdown/HTML/JSON，再做基础 DOCX 输出 |
| PPTX | [ ] | [ ] | 未做 | 市场优先级高；先做输入到 Markdown/HTML/JSON，输出前设计 `PresentationModel` |
| XLSX | [ ] | [ ] | 未做 | 市场优先级高；先做多工作表到 Markdown/CSV/JSON |
| EPUB | [ ] | [ ] | 未做 | 市场优先级中；ZIP + OPF + XHTML 解析，优先输出 Markdown/HTML/JSON |
| JPEG/WebP/SVG | [ ] | [ ] | 未做 | 扩展 AssetStore 图片输入与输出策略，OCR 作为可选能力 |
| Audio | [ ] | [ ] | 未做 | 市场存在但偏 AI 附加能力；先做 metadata，转写作为可选能力评估 |
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
