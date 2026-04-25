# Trans2Former Browser-First Checklist

## 当前提交前检查

- [ ] `npm install` 可完成依赖安装。
- [ ] `npm test` 可通过浏览器端转换核心 smoke test。
- [ ] `npm start` 可启动 Web 应用。
- [ ] 浏览器可访问 `http://localhost:3000`。
- [ ] 浏览器端可完成 Markdown / HTML / TXT / JSON 互转。
- [ ] README 与安装文档不再描述桌面应用发布。
- [ ] 不引入 Office、LibreOffice、Pandoc 等本地办公软件依赖。

## 架构约束

- 应用形态以浏览器 Web 为主。
- 转换核心逐步迁移到浏览器端 JavaScript、Web Worker、WASM、Canvas、ZIP/XML 和 File API。
- 服务端只作为过渡期 Web/API 容器，最终应能收敛为静态托管。
- 不再添加桌面壳、桌面构建脚本或桌面打包流程。

## 发布检查

- [ ] 更新 `DEVELOPMENT_TASKS.md` 中已完成阶段。
- [ ] 每次开发结束后已同步更新任务列表。
- [ ] 检查 `rg -n "Electron|electron|Playwright|playwright|desktop|exe|portable" .` 不包含当前运行依赖说明。
- [ ] 记录仍处于过渡期的能力，例如当前 PDF 依赖浏览器打印。
