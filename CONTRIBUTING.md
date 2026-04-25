# 贡献指南

Trans2Former 当前是浏览器优先的 Web 应用。贡献代码时请保持这个方向：不要新增 Electron、Playwright、Office、LibreOffice、Pandoc 或其他本地转换软件作为运行依赖。

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
- 修改 UI 后要手动验证上传、预览、转换、下载和 PDF 打印路径。

## PPTX 方向

PPTX 支持应优先走浏览器端可编辑对象路线，例如 Schema/PresentationModel -> PPTX。可以参考外部 PPT skill 的 schema 思路，但不要把 Python/Playwright 脚本引入为运行时依赖。
