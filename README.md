# Mark2PDF

一个高质量的 Markdown 转 PDF 工具，支持网页上传预览和 PDF 导出，重点保证以下内容渲染正确：

- 字体（包含中英文混排）
- 特殊符号（数学符号、货币符号、Unicode 符号）
- 数学公式（行内 `$...$` 与块级 `$$...$$`）

## 网页版功能

- 拖拽或浏览上传 Markdown 文件
- 在线预览渲染后的文档
- 生成 PDF 并在网页内预览
- 一键下载 PDF

## 技术方案

- Markdown 解析：`markdown-it`
- 数学公式：`markdown-it-texmath` + `KaTeX`
- PDF 导出：`Playwright (Chromium)`
- 代码高亮：`highlight.js`

## 快速开始

```bash
npm install
npx playwright install chromium
```

启动网页服务：

```bash
npm start
```

打开浏览器访问：

```text
http://localhost:3000
```

启动桌面版：

```bash
npm run desktop
```

CLI 转换命令：

```bash
npm run convert -- ./example.md
```

或者指定输出文件：

```bash
npm run convert -- ./example.md ./output.pdf
```

指定纸张格式（A4 / Letter）：

```bash
npm run convert -- ./example.md ./output.pdf --format A4
```

## 页面操作

1. 打开网页后，直接把 `.md` 文件拖到上传区域，或点击浏览文件。
2. 左侧可以继续编辑 Markdown，右侧会实时更新预览。
3. 点击“生成 PDF”后，页面下方会出现 PDF 预览。
4. 点击“下载 PDF”即可保存文件。

## 打包 Windows exe

```bash
npm install
npm run dist
```

打包完成后，`dist` 目录下会生成可执行文件。当前配置使用 portable 模式，适合直接双击运行。

## 示例 Markdown

在项目根目录创建 `example.md`：

```markdown
# Mark2PDF 演示

这是中文、English、符号混排：∞ ≠ ≤ ≥ ± © ® ™ Ω → ← ✓ ✗。

行内公式：$e^{i\pi}+1=0$。

块级公式：

$$
\int_{0}^{\infty} e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$

- [x] 任务 1
- [ ] 任务 2

```js
function add(a, b) {
  return a + b;
}
```
```

## 字体说明

程序使用以下字体回退链，尽可能提高跨平台表现：

- 正文：`Noto Serif SC`, `Source Han Serif SC`, `Noto Serif`, `Times New Roman`
- 代码：`Cascadia Code`, `Fira Code`, `JetBrains Mono`, `Consolas`
- 符号：`Noto Sans Symbols 2`, `Segoe UI Symbol`, `Arial Unicode MS`

若你的系统缺少某些字体，建议安装 Noto / Source Han 系列以获得更稳定的排版效果。
