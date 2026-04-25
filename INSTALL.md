# 安装与运行

Trans2Former 现在定位为浏览器 Web 应用，不再依赖 Electron，也不再发布桌面 exe 壳。

## 系统要求

- Node.js 18 或更高版本
- npm 9 或更高版本
- 现代浏览器：Chrome、Edge、Firefox 或 Safari

## 本地运行

```bash
npm install
npm start
```

启动后打开：

```text
http://localhost:3000
```

当前 Node.js 服务只负责承载 Web 页面，转换逻辑在浏览器端执行。后续目标是支持静态部署。

## 当前限制

1. PDF 当前使用浏览器打印/另存为 PDF。
2. EPUB、DOCX、PPTX、PNG 的浏览器端互转尚未实现。
3. 不需要安装 Office、LibreOffice、Pandoc、Playwright 或桌面壳程序。

## 升级

```bash
git pull origin main
npm install
npm start
```

## 故障排除

### 启动时出现 Cannot find module

```bash
npm install
npm start
```

### 页面打不开

确认终端输出的地址可访问，默认是：

```text
http://localhost:3000
```

### PDF 如何保存

选择输出 PDF 后，点击“浏览器打印 / 另存为 PDF”，在浏览器打印窗口中选择“保存为 PDF”。
