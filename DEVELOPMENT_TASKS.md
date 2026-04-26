# Trans2Former Development Tasks

最后更新：2026-04-26  
维护规则：每次开发结束后必须更新本文件，标记已完成项并补充新发现任务。

## 文档入口

- 产品定位、市场路线、产品壁垒和数据安全底线见 [docs/PRODUCT_STRATEGY.md](docs/PRODUCT_STRATEGY.md)。
- 格式覆盖矩阵和格式优先级见 [docs/FORMAT_ROADMAP.md](docs/FORMAT_ROADMAP.md)。
- 动态分块与结构化合并设计见 [docs/DYNAMIC_CHUNKING_MERGE_DESIGN.md](docs/DYNAMIC_CHUNKING_MERGE_DESIGN.md)。
- 资源预算和插件化边界见 [docs/RESOURCE_BUDGET.md](docs/RESOURCE_BUDGET.md)。
- 开发规范、质量门禁、成本资源治理见 [docs/development-standards/00_README.md](docs/development-standards/00_README.md)。
- 完整文档目录见 [docs/README.md](docs/README.md)。

## 当前基线

- [x] 项目标识统一为 Trans2Former。
- [x] 仓库地址迁移到 `https://github.com/Vantalens/Trans2Former`。
- [x] 移除 Electron、Playwright、CLI 和服务端转换 API。
- [x] Express 仅保留静态资源托管和 `/api/health`。
- [x] 转换链路改为 `input -> DocumentModel -> output`。
- [x] `DocumentModel`、`AssetStore`、`ConverterRegistry` 已建立。
- [x] 转换任务已移入 Web Worker，支持基础进度、用户可读错误和取消按钮。
- [x] `npm test` 会覆盖核心转换、快照、浏览器静态入口、本地安全和资源预算。
- [x] 文档已分层：根目录保留入口/流程，`docs/` 承载产品、格式、架构、安全和资源专题。
- [x] 开发方向确定为模块化插件设计：热门基础格式免下载可用，重格式和可选能力按用户需求下载或加载对应模块插件。

## P0：近期优先任务

目标：先把现有 7 种输入、7 种输出的质量基线做稳，避免在 DOCX/PPTX/EPUB 之前继续堆不可靠能力。

### P0-A：样例与自动化基线

阶段状态：已完成。

- [x] 建立 `samples/` 样例集：每种当前支持输入格式至少 3 个样例，覆盖中文、图片、表格、列表、代码和异常输入。
- [x] 将 `scripts/smoke-test.js` 拆分为可维护测试用例，覆盖 Markdown/HTML/TXT/JSON/CSV/XML/PNG 的解析、输出和降级说明。
- [x] 扩展转换快照测试，覆盖当前可输出格式的 round-trip、不可逆降级、错误输入和空文档边界。
- [x] 添加浏览器端 smoke test：上传样例、选择格式、执行转换、下载结果、刷新预览。

### P0-B：错误、进度与大文档体验

阶段状态：进行中。错误结构、阶段进度、取消清理、安全测试和资源预算已完成；下一步优先做预览迁移和大文件入口策略。

- [x] 定义统一 `ConversionError` 结构，分类为 parse / validate / convert / render / download。
- [x] 错误详情面板 UI：展示 category / code / format / message / warnings，不默认展示 stack 或 raw snippet。
- [x] 错误详情脱敏复制：复制诊断时只复制 category/code/format/message/warnings，不包含用户文档正文、title、stack。
- [x] Worker 错误透传：Worker error message 保留 `ConversionError.toJSON()` 字段，主线程可直接渲染。
- [x] Worker 阶段进度：progress 从固定 20%/100% 改为 read / parse / validate / convert / render / package。
- [x] 可视化进度条：显示阶段、百分比、忙碌状态和取消状态。
- [x] 取消清理：取消转换后清理 active worker、旧下载 Blob URL、旧输出状态，避免留下可下载的旧结果。
- [x] 添加本地安全 smoke test：验证核心转换不触发网络请求、不写入远程端点、不在日志输出用户文档内容。
- [x] 添加资源预算 smoke test：限制核心 public/core/scripts 体积，阻止默认依赖引入 PDF/OCR/AI/Office 重库。
- [ ] 预览迁移：将预览渲染迁移到 Worker 或 idle callback，避免大文档输入卡顿。
- [ ] 大文件入口策略：UI 不设置固定文件大小上限，文件读取改为按格式支持分片/流式路径，并在资源不足时返回可解释错误。

### P0-C：当前格式质量补齐

- [ ] 完善 Markdown 脚注、链接、图片、表格对齐、嵌套列表和高级内联语法支持。
- [ ] 强化 CSV 解析，覆盖引号、换行、逗号、空单元格、BOM 和不同换行符。
- [ ] 强化 XML 解析，覆盖命名空间、属性、嵌套结构和 parsererror 展示。
- [ ] 为 PNG 输出设计 Canvas 渲染入口、分页策略、长图策略和下载命名规则。
- [x] 将 JSON schema 增加机器可读版本，例如 `docs/document-model.schema.json`，并让测试引用同一份 schema。

## P1：核心架构增强

目标：为 ZIP/EPUB/OOXML 这类容器格式铺路，补清楚编排、资源、适配器边界，并优先支持市场需要的 AI-ready Markdown 输出。

- [x] 建立安全策略文档：本地处理边界、远程能力 opt-in 规则、缓存/历史保留规则、敏感数据日志规则。
- [x] 设计资源分层架构：core、format-basic、format-plugin、optional-plugin，并定义每层依赖和包体预算。
- [x] 整理开发文档结构：新增 `docs/README.md`，将产品原则和格式矩阵从任务看板拆入专题文档。
- [x] 建立开发规范目录：`docs/development-standards/`，覆盖文档规则、开发流程、AI 协作、质量门禁、安全和模块插件治理。
- [x] 明确 `format-basic` 体验边界：基础包必须内置热门轻量格式，保证常见转换无需下载即可使用。
- [ ] 增加安全模式开关：默认 `local-only`，禁止远程适配器、遥测、外部资源抓取。
- [ ] 将 `DocumentModel` 扩展为可编辑结构：稳定 block id、selection metadata、source span、warnings、format-specific metadata。
- [ ] 设计网页端编辑状态模型：输入编辑、标准化结构编辑、输出选项编辑、预览状态和下载状态分离。
- [ ] 设计转换任务上下文 `ConversionContext`，统一传递 signal、progress、warnings、assets 和 options。
- [ ] 设计动态分块转换架构：chunk planner、chunk reader、partial DocumentModel、merge planner、merged DocumentModel、output writer。
- [ ] 建立直接转换 vs 分块转换等价测试：比较 blocks、assets、warnings、metadata、Markdown/HTML/JSON 快照。
- [ ] 建立合并算法：恢复标题层级、连续列表、连续表格、代码块、脚注/链接、资源去重和 chunk provenance。
- [ ] 设计格式插件 manifest：声明格式、能力等级、依赖体积、是否默认加载、是否 local-only、是否可选远程增强。
- [ ] 设计按需下载插件加载器：用户选择重格式时再加载对应模块，支持缓存、取消、失败降级和完整性校验。
- [ ] 建立插件资源预算测试：验证 `format-plugin` / `optional-plugin` 不进入默认核心包和默认 dependencies。
- [ ] 建立基础格式晋升评审：定义热门格式进入 `format-basic` 的体积、安全、质量和使用频率门槛。
- [ ] 建立代码水平拆分边界：format adapter、conversion pipeline、render pipeline、worker protocol、UI panels、quality fixtures。
- [ ] 支持转换链路编排，例如 `docx -> DocumentModel -> html -> png`。
- [ ] 设计超大文件处理架构：chunk reader、stream parser、backpressure、临时资源释放、分阶段快照和可恢复取消。
- [ ] 设计可选格式适配器加载策略，避免核心包膨胀。
- [ ] 完善 `AssetStore` 的资源去重、大小限制、MIME 校验和导出策略。
- [ ] 建立 AI-ready Markdown 输出准则：标题层级、表格、列表、链接、图片占位、页/幻灯片/工作表边界、降级说明。
- [ ] 为 Markdown/HTML/JSON 输出增加 `warnings`，让用户知道哪些样式、布局、动画、扫描图像或公式被降级。
- [ ] 建立行业顶尖质量基准：语义保真、表格保真、资源保真、版面降级可解释、输出可读性、性能和稳定性。
- [ ] 添加性能基准：1MB、10MB、50MB 文档转换时间、内存占用和 UI 阻塞时间。
- [ ] 添加超大文件基准：100MB、500MB、1GB+ 样例的读取、预览、转换、取消和内存峰值记录。
- [ ] 设计 GUI/PWA/桌面外壳路线：Web 核心复用、离线可用、文件系统权限最小化、本地处理不回退。

## P2：新格式与产品能力

目标：按市场需求优先做 Office/PDF/EPUB 到 Markdown/HTML/JSON 的提取能力，再做高保真反向生成。

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

## 已完成归档

### 项目迁移

- [x] README、INSTALL、CONTRIBUTING、CHANGELOG、COMMIT_CHECKLIST 已同步浏览器优先路线。
- [x] 旧桌面壳文档和服务端转换路线已清理。
- [x] Git remote 已更新为 `Vantalens/Trans2Former`。

### 模型与策略

- [x] `docs/CONVERSION_POLICY.md` 已定义不可逆信息和降级策略。
- [x] `docs/DOCUMENT_MODEL_SCHEMA.md` 已文档化 DocumentModel。
- [x] `docs/document-model.schema.json` 已提供机器可读 schema。
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
- [x] 取消后会清理 Worker、旧 Blob URL 和旧下载状态。
- [x] 基础转换快照测试已加入 `npm test`。
- [x] `git check-ignore -v` 已验证生成物会被忽略，源码和文档不会被误忽略。
