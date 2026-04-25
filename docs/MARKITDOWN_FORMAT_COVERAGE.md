# MarkItDown Format Coverage Target

版本：v0.1.0  
状态：规划中  
最后更新：2026-04-25

目标：MarkItDown README 中提到的格式，Trans2Former 都应进入支持矩阵。但实现必须保持浏览器端路线，不直接引入 Python、本地 Office、LibreOffice、Pandoc、Electron 或 Playwright。

| MarkItDown 提到的格式 | Trans2Former 目标 | 当前状态 | 浏览器端策略 |
| --- | --- | --- | --- |
| PDF | 输入/输出 | 输出为 PDF-print 过渡；PDF 输入未做 | 输出先用浏览器打印，输入后续评估 pdf.js/WASM |
| PowerPoint | PPTX 输入/输出 | 未做 | 解析/生成 OOXML ZIP；借鉴 PresentationModel/schema 思路 |
| Word | DOCX 输入/输出 | 未做 | 解析/生成 OOXML ZIP；正文结构进入 DocumentModel |
| Excel | XLSX/CSV 输入/输出 | CSV 已支持；XLSX 未做 | CSV 走 table block；XLSX 后续解析 OOXML ZIP |
| Images | PNG 输入，更多图片格式后续 | PNG 输入已做 | 图片进入 AssetStore；OCR 作为可选后续能力 |
| Audio | 音频输入/元数据/转写 | 未做 | 先做 metadata；转写必须可选且不依赖本地二进制 |
| HTML | 输入/输出 | 已支持 | DOMParser + 安全降级 |
| Text | TXT/Markdown/JSON/XML/CSV | TXT/MD/JSON/XML/CSV 已支持 | text-based formats 走浏览器解析器 |
| CSV | 输入/输出 | 已支持 | 第一行表头 -> table block |
| JSON | 输入/输出 | 已支持 | DocumentModel JSON schema |
| XML | 输入/输出 | 已支持基础版 | raw XML + 可读文本/标准 XML 输出 |
| ZIP | 输入/输出容器 | 未做 | 后续用浏览器 ZIP 库，批量解包/打包 |
| YouTube URLs | URL 输入/提取 | 未做 | 浏览器环境限制较大，作为远程提取能力单独评估 |
| EPUB | 输入/输出 | 未做 | EPUB 是 ZIP + OPF + XHTML，优先级较高 |

## 实施优先级

1. Text-based formats：Markdown、HTML、TXT、JSON、CSV、XML。
2. Image formats：PNG 输入/输出，后续 JPEG/WebP/SVG。
3. Archive formats：ZIP 批量输入/输出。
4. EPUB：浏览器端 ZIP/XML/XHTML 解析。
5. Office Open XML：DOCX、PPTX、XLSX。
6. PDF：先输出，再评估输入。
7. Audio/YouTube：作为可选远程/AI 能力，不进入核心包。