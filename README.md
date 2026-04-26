# Trans2Former

Trans2Former 是一个面向浏览器端构建的多格式文档转换与动态编辑工具。当前项目不再依赖 Electron，应用形态统一为浏览器 Web 应用；核心底线是用户数据默认本地处理、默认不上传、不遥测、不留存文档内容。后期将通过模块化插件设计，基础热门格式免下载可用，重格式和可选能力按需下载或加载。长期目标是覆盖 Office、PDF、EPUB、图片、压缩包、数据格式和可选 OCR/转写能力，提供行业顶尖质量的文档转换和编辑体验。

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
- 交互状态：支持结构化错误详情、脱敏诊断复制、阶段化转换进度和取消后输出清理
- 文件大小：产品目标是不设置人为上传大小上限，后续通过分片/流式/Worker/渐进预览支撑超大文件
- 超大文件策略：规划动态分块转换与结构化合并，避免单文件过大导致内存和卡顿问题
- 架构：采用模块化插件设计，基础热门格式免下载可用，重格式/可选能力按需下载或加载
- 测试：`npm test` 覆盖核心转换、快照、浏览器自检和本地安全检查

## 目标方向

Trans2Former 不走“依赖本地安装办公软件”的路线，不要求用户安装 Microsoft Office、LibreOffice、Pandoc、Electron 或 Playwright。转换能力优先通过浏览器端 JavaScript、Web Worker、WASM、Canvas、ZIP/XML 解析和文件 API 实现，必要时只使用可在浏览器运行的轻量前端依赖。

产品壁垒：

- 网页端动态编辑：不仅转换，还要能编辑标准化后的文档结构。
- 实时预览：输入、结构、输出格式和 warnings 变化后尽量实时反馈。
- 上传文件大小无限制：不设置固定 MB/GB 上限，实际处理能力由用户设备和浏览器资源决定。
- 动态分块不降质：单个超大文件可拆成语义子模块转换，再结构化合并，最终结果应与直接转换语义等价。
- 行业顶尖质量：每个格式必须有样例、快照、降级说明和质量基准。
- 超广格式覆盖：长期覆盖 Office、PDF、EPUB、图片、压缩包、数据格式和可选 OCR/转写能力。
- 热门格式免下载：基础包内置 Markdown、HTML、TXT、JSON、CSV、XML、PNG input、PDF-print 等高频轻量格式。
- 模块插件按需下载：重格式和可选能力不默认进入核心包，用户需要时再加载对应模块，降低资源占用并提升常用路径性能。
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

详细分阶段任务见 [DEVELOPMENT_TASKS.md](DEVELOPMENT_TASKS.md)。开发文档总目录见 [docs/README.md](docs/README.md)，产品定位见 [docs/PRODUCT_STRATEGY.md](docs/PRODUCT_STRATEGY.md)，格式路线见 [docs/FORMAT_ROADMAP.md](docs/FORMAT_ROADMAP.md)，动态分块合并设计见 [docs/DYNAMIC_CHUNKING_MERGE_DESIGN.md](docs/DYNAMIC_CHUNKING_MERGE_DESIGN.md)。

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

## 开发文档

- [docs/README.md](docs/README.md)：文档总目录和维护规则
- [DEVELOPMENT_TASKS.md](DEVELOPMENT_TASKS.md)：当前任务看板
- [docs/PRODUCT_STRATEGY.md](docs/PRODUCT_STRATEGY.md)：产品原则、市场路线和安全底线
- [docs/FORMAT_ROADMAP.md](docs/FORMAT_ROADMAP.md)：格式覆盖矩阵和新增格式准入规则
- [docs/SECURITY_POLICY.md](docs/SECURITY_POLICY.md)：本地优先和远程增强规则
- [docs/RESOURCE_BUDGET.md](docs/RESOURCE_BUDGET.md)：核心包体积与依赖预算
- [docs/development-standards/00_README.md](docs/development-standards/00_README.md)：开发规范体系
- [docs/development-standards/07_COST_AND_RESOURCE_GOVERNANCE.md](docs/development-standards/07_COST_AND_RESOURCE_GOVERNANCE.md)：成本、资源和模块插件治理规则

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
- 资源预算 smoke test

## 资源预算

- 默认包只包含 `core + format-basic`。
- `format-basic` 内置热门轻量格式，保证常见转换无需下载即可使用。
- PDF 输入、DOCX、PPTX、XLSX、EPUB、ZIP、OCR、音频转写、本地 AI、云端增强默认必须通过模块插件按需下载或加载。
- 插件必须声明 manifest、体积预算、依赖、安全模式、加载方式和失败降级路径。
- `npm test` 会检查核心目录体积、默认依赖数量，并阻止重依赖进入默认核心路径。

## 数据安全

- 默认 `local-only`，核心转换在用户设备上执行。
- 产品不设置人为上传大小上限；后续大文件处理应使用分片读取、流式解析、Worker 和渐进预览。
- 默认不上传文档、图片、音频、转换结果、错误详情或编辑内容。
- 默认不接入第三方转换 API、OCR API、转写 API、分析 SDK 或遥测 SDK。
- 错误详情面板复制诊断时只复制脱敏字段，不默认复制用户文档正文、title 或 stack。
- 取消转换后会终止 active Worker、撤销旧 Blob URL、清空旧输出并禁用下载入口，避免误下载上一轮结果。
- 远程增强能力必须显式 opt-in，且默认关闭。

## 已知限制

1. PDF 当前使用浏览器打印/另存为 PDF，不是程序化生成 `.pdf` 二进制文件。
2. EPUB、DOCX、PPTX、PNG 输出尚未实现。
3. 任意格式互转仍需要继续建立统一中间文档模型，否则复杂格式之间会出现信息丢失。
4. 当前文本读取仍有内存压力，后续会逐步改造为分片/流式处理，以真正支撑超大文件。

## Community
https://linux.do/

## 许可证

MIT License - 详见 [LICENSE](LICENSE)。
