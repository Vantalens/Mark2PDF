# 贡献指南

Trans2Former 当前是浏览器优先的 Web 应用。贡献代码时请保持这个方向：不要新增 Electron、Playwright、Office、LibreOffice、Pandoc 或其他本地转换软件作为运行依赖。

核心底线：用户数据默认本地处理。不要在默认路径中上传文档、转换结果、错误详情或用户编辑内容。

## 开发

```bash
npm install
npm start
```

打开：

```text
http://localhost:3000
```

## 项目结构

```text
public/
  app.js                  浏览器端界面逻辑
  browser-transformer.js  浏览器端转换核心
  index.html              主页面
  styles.css              页面样式
src/
  server.js               启动静态 Web 服务
  web-server.js           Express 静态资源容器
```

## 贡献规则

- 转换逻辑优先放在浏览器端模块中。
- 大文件、压缩包、图片处理等耗时任务后续应迁移到 Web Worker。
- 新增格式时，先设计中间模型，再做输入/输出适配器。
- 不提交生成产物、缓存、日志或本地构建输出。
- 修改 UI 后要验证上传、预览、转换、下载、PDF 打印路径和错误详情面板。
- 修改任务、定位、安全策略、测试命令或支持格式后，必须同步更新 `README.md`、`DEVELOPMENT_TASKS.md`、`INSTALL.md`、`COMMIT_CHECKLIST.md` 和必要的 `docs/` 文档。
- 每次开发结束必须更新 `DEVELOPMENT_TASKS.md`。

## 数据安全要求

- 默认不得引入 `fetch`、`XMLHttpRequest`、`sendBeacon`、`WebSocket`、远程转换 API、遥测 SDK 或分析 SDK。
- 默认不得把文档正文、转换结果、错误原文写入 localStorage、IndexedDB 或日志。
- 远程 OCR、转写、AI 增强只能作为显式 opt-in 能力，且默认关闭。
- 错误详情复制必须脱敏，只包含 category/code/format/message/warnings。
- 任何违反本地优先路线的改动都必须先更新安全策略并增加测试。

## 测试

```bash
npm test
```

当前测试包括核心转换 smoke、转换快照、浏览器自检静态服务检查、本地安全 smoke test。

## PPTX 方向

PPTX 支持应优先走浏览器端可编辑对象路线，例如 Schema/PresentationModel -> PPTX。可以参考外部 PPT skill 的 schema 思路，但不要把 Python/Playwright 脚本引入为运行时依赖。
