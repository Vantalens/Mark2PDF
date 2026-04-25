# Changelog

所有值得注意的项目变更将在此文件中记录。

## [2.1.0] - 2026-04-25

### 新增

- 新增浏览器端 `DocumentModel`，将转换链路调整为 `input -> DocumentModel -> output`。
- 新增 `ConverterRegistry`，统一注册输入/输出格式能力。
- 新增 `AssetStore`，为图片、字体、附件等资源提供统一模型。
- 新增 PNG 输入能力，可作为图片资源导入并输出到 HTML / Markdown / JSON / TXT / PDF-print。
- 新增 `npm test` smoke test，覆盖基础浏览器端转换链路。

### 变更

- 项目正式收敛为浏览器 Web 应用路线。
- Express 仅作为静态资源容器和 `/api/health` 健康检查。
- README、安装说明、贡献规范和任务清单已同步为浏览器优先路线。

### 移除

- 移除 Electron 桌面入口和桌面打包流程。
- 移除 Playwright 运行依赖和服务端 PDF 转换 API。
- 移除 CLI 入口，当前运行形态聚焦浏览器 Web 应用。

## [2.0.0] - 2026-04-20

### 新增

- 品牌升级：项目正式更名为 Trans2Former。
- 增加多格式转换工作台雏形。
- 增加浏览器端转换方向规划。

## [1.0.0] - 2026-04-16

### 新增

- 初始 Markdown 转换工具版本。
- 提供基础 Web 页面、预览区和输出区。