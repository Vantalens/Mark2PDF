# 格式转换输出合规性审视 - 完整问题清单

**审视日期**: 2026年5月7日  
**审视范围**: public/formats/ 和 public/core/ 中的格式输出生成器  
**总问题数**: 15+

---

## 📊 问题统计

| 严重性 | 数量 | 说明 |
|--------|------|------|
| 🔴 关键 | 3 | 会导致文件无法打开 |
| 🟠 高 | 5 | 功能不完整或格式不符 |
| 🟡 中 | 5 | 不符合标准或规范 |
| 🟢 低 | 3 | 优化问题 |

---

## 🔴 CRITICAL - 关键问题（文件无法打开）

### 1. PPTX: 缺失幻灯片布局、母版和主题文件

**文件**: [public/formats/pptx.js](public/formats/pptx.js)  
**行号**: 第 142-173 行  
**严重性**: 🔴 CRITICAL  

**问题描述**:
PowerPoint 文件结构完全缺少以下目录和文件：
- `ppt/slideLayouts/slideLayout1.xml` - 幻灯片布局
- `ppt/slideMasters/slideMaster1.xml` - 幻灯片母版  
- `ppt/theme/theme1.xml` - 主题文件
- 相应的关系文件和 Content_Types 注册

**表现形式**:
- Microsoft PowerPoint: "演示文稿已损坏，无法打开"
- 某些版本：无法加载，自动关闭
- LibreOffice：可能报错或显示不正确

**代码问题**:
```javascript
// ❌ writeStoredZip 数组中完全缺少这些条目
export function writePptx({ model, title = model.title }) {
  const zipBytes = writeStoredZip([
    { name: "[Content_Types].xml", ... },
    { name: "_rels/.rels", ... },
    { name: "ppt/_rels/presentation.xml.rels", ... },  // ⚠️ 不完整
    { name: "ppt/presentation.xml", ... },             // ⚠️ 结构不完整
    { name: "docProps/core.xml", ... },
    { name: "ppt/slides/slide1.xml", ... },
    // ❌ 缺少: slideLayouts, slideMasters, theme
  ]);
}
```

**修复建议**: 需要生成 5+ 个新的 XML 文件和 3 个关系文件  
**优先级**: 🥇 第一位（立即修复）

---

### 2. XLSX: 缺失 xl/styles.xml

**文件**: [public/formats/xlsx.js](public/formats/xlsx.js)  
**行号**: 第 144-182 行（writeXlsx 函数）  
**严重性**: 🔴 CRITICAL

**问题描述**:
Excel 文件中的所有样式定义都存储在 `xl/styles.xml`（字体、颜色、数字格式、对齐等）。当前实现完全不生成此文件。

**表现形式**:
- Excel 打开文件时显示警告：缺少样式信息
- 所有单元格使用默认样式
- 无法应用任何格式化

**代码问题**:
```javascript
// ❌ writeXlsx 中缺少任何样式文件生成
const zipBytes = writeStoredZip([
  { name: "[Content_Types].xml", data: ... },
  // ⚠️ [Content_Types].xml 中也没有为 xl/styles.xml 注册
  // ❌ 缺少: { name: "xl/styles.xml", data: ... }
  { name: "xl/workbook.xml", data: ... },
  { name: "xl/worksheets/sheet1.xml", data: ... },
]);
```

**同时**，readXlsx 期望读取这个文件：
```javascript
// 第 22-27 行
function readStyleFormats(zip) {
  const xml = zip.getText("xl/styles.xml");  // ❌ 这个文件不存在！
  // ...
}
```

**修复建议**: 需要生成包含基本样式定义的 `xl/styles.xml`  
**优先级**: 🥇 第一位（立即修复）

---

### 3. EPUB: HTML-to-XHTML 转换不完整 + mimetype 处理

**文件**: [public/formats/epub.js](public/formats/epub.js)  
**行号**: 第 89-120 行  
**严重性**: 🔴 CRITICAL

**问题 3a: HTML-to-XHTML 转换脆弱**

```javascript
// 第 89-93 行 - 问题代码
const body = writeHtml({ model, title }).data
  .replace(/^<!doctype html>/i, "")
  .replace(/<html lang="zh-CN">/i, `<html xmlns="${XHTML_NS}" lang="zh-CN">`);
  // ❌ 只进行了 2 个简单的正则替换
```

**问题**:
- `writeHtml()` 返回完整的 HTML 文档，包括 `<head>`、`<style>` 等
- 第二个 replace 可能失败：如果 HTML 标签是 `<html lang="zh-CN" class="...">` 就不会被匹配
- XHTML 需要有效的 XML，但没有任何验证
- 没有处理实体引用转义（`&nbsp;` 在 XML 中可能需要特殊处理）

**表现形式**:
- EpubCheck 验证失败
- 阅读器无法解析 XHTML 内容
- 某些 EPUB 阅读器拒绝打开文件

**问题 3b: mimetype 处理**

虽然代码确实将 `mimetype` 放在第一位，但 EPUB 3.3 规范要求：
1. mimetype 是第一个 ZIP 条目 ✓ (当前正确)
2. mimetype 必须使用 STORED 模式 ✓ (当前正确)
3. mimetype 的 ZIP 文件头中"额外字段"长度必须为 0 ✓ (当前正确)

但缺少文档和验证机制。

**优先级**: 🥇 第一位（立即修复）

---

## 🟠 HIGH - 高优先级问题（功能不完整）

### 4. DOCX: 缺失 word/document.xml.rels 关系文件

**文件**: [public/formats/docx-output.js](public/formats/docx-output.js)  
**行号**: 第 38-86 行  
**严重性**: 🟠 HIGH

**问题描述**:
DOCX 的关键关系文件 `word/_rels/document.xml.rels` 未被生成。该文件定义：
- 文档与图片的关系
- 文档与超链接的关系  
- 文档与脚注/尾注的关系

**表现形式**:
- 当前可能还能打开（无图片/链接时）
- 一旦添加图片支持，Word 会报错无法打开
- 某些验证工具会标记为损坏文件

**代码问题**:
```javascript
// ❌ writeStoredZip 中缺少关系文件
export function writeDocx({ model, title = model.title }) {
  const zipBytes = writeStoredZip([
    { name: "[Content_Types].xml", ... },
    { name: "_rels/.rels", ... },
    { name: "docProps/core.xml", ... },
    { name: "word/styles.xml", ... },
    { name: "word/numbering.xml", ... },
    { name: "word/document.xml", ... },
    // ❌ 缺少: { name: "word/_rels/document.xml.rels", data: ... }
  ]);
}
```

**修复建议**: 即使为空，也应生成关系文件  
**优先级**: 🥈 第二位（高优先级）

---

### 5. XLSX: 使用 inlineStr 而不是 sharedStrings.xml

**文件**: [public/formats/xlsx.js](public/formats/xlsx.js)  
**行号**: 第 150 行  
**严重性**: 🟠 HIGH

**问题描述**:
Excel 有两种存储字符串的方式，当前实现使用非标准方式（inlineStr），直接在单元格中嵌入字符串。

```javascript
// ❌ 第 150 行 - 非标准方式
return `<c r="${ref}" t="inlineStr"><is><t>${escapeHtml(cell)}</t></is></c>`;

// ✅ 应该使用
return `<c r="${ref}" t="s"><v>${stringIndex}</v></c>`;
```

**影响**:
- 同一字符串在 100 个单元格出现，现在存储 100 次（标准方式只需 1 次）
- 文件体积增大 50-300%
- 与标准 XLSX 工作流不一致
- 读取时（readXlsx）期望 sharedStrings.xml，导致不一致

**修复建议**: 需要添加字符串去重逻辑和 sharedStrings.xml 生成  
**优先级**: 🥈 第二位

---

### 6. PPTX: 不完整的关系文件

**文件**: [public/formats/pptx.js](public/formats/pptx.js)  
**行号**: 第 168-169 行  
**严重性**: 🟠 HIGH

**问题描述**:
`ppt/presentation.xml.rels` 和 `ppt/slides/_rels/slide1.xml.rels` 缺少重要的关系定义。

```javascript
// ❌ 第 168-169 行 - 不完整
{
  name: "ppt/_rels/presentation.xml.rels",
  data: `<?xml version="1.0"?>
<Relationships xmlns="${NS}/package/2006/relationships">
  <Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <!-- ❌ 缺少对 slideMaster 和 theme 的关系 -->
</Relationships>`,
},
```

**修复建议**: 需要添加 slideMaster 和 theme 的关系  
**优先级**: 🥈 第二位

---

### 7. EPUB: OPF 元数据不完整

**文件**: [public/formats/epub.js](public/formats/epub.js)  
**行号**: 第 106-113 行  
**严重性**: 🟠 HIGH（可用性问题）

**问题描述**:
`OEBPS/content.opf` 中的元数据过于简陋：

```xml
<!-- ⚠️ 当前 - 缺少推荐的字段 -->
<metadata xmlns:dc="...">
  <dc:identifier id="bookid">trans2former-${Date.now()}</dc:identifier>
  <dc:title>${escapeHtml(title)}</dc:title>
  <dc:language>zh-CN</dc:language>
</metadata>

<!-- ✅ 应该至少添加 -->
<dc:creator>Trans2Former</dc:creator>
<dc:date>${new Date().toISOString()}</dc:date>
<meta property="dcterms:modified">${new Date().toISOString()}</meta>
```

**修复建议**: 添加创建者、日期等元数据  
**优先级**: 🥈 第二位（可用性）

---

## 🟡 MEDIUM - 中等优先级（规范问题）

### 8. XLSX: Content_Types.xml 缺少注册

**文件**: [public/formats/xlsx.js](public/formats/xlsx.js)  
**行号**: 第 158-162 行  
**严重性**: 🟡 MEDIUM

```xml
<!-- ❌ 缺少以下 Override 定义 -->
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
```

---

### 9. PPTX: 缺失主题文件

**文件**: [public/formats/pptx.js](public/formats/pptx.js)  
**行号**: 第 142-173 行  
**严重性**: 🟡 MEDIUM

虽然基础功能可以工作，但规范要求至少有一个主题文件 `ppt/theme/theme1.xml`。

---

### 10. DOCX: w:document 缺少 w:docPr

**文件**: [public/formats/docx-output.js](public/formats/docx-output.js)  
**行号**: 第 39-45 行  
**严重性**: 🟡 MEDIUM

```xml
<!-- ❌ 当前 - 缺少 documentProperties -->
<w:document xmlns:w="...">
  <w:body>...</w:body>
</w:document>

<!-- ✅ 应该有 -->
<w:document xmlns:w="...">
  <w:documentProperties>
    <w:docPr val="..."/>
  </w:documentProperties>
  <w:body>...</w:body>
</w:document>
```

---

### 11. ZIP: 条目顺序不强制

**文件**: [public/core/zip-writer.js](public/core/zip-writer.js)  
**行号**: 第 3-54 行  
**严重性**: 🟡 MEDIUM（特别对 EPUB）

`writeStoredZip()` 按输入顺序添加条目，没有验证或强制特殊要求。对于 EPUB，mimetype 必须是第一个条目，但这依赖调用者正确传入。

---

### 12. DOCX: 图片处理只输出占位符

**文件**: [public/formats/docx-output.js](public/formats/docx-output.js)  
**行号**: 第 32 行  
**严重性**: 🟡 MEDIUM（功能限制）

```javascript
// ❌ 图片被转换为纯文本
if (block.type === "image") return paragraph(block.alt || block.title || block.src);
if (block.type === "asset") return paragraph(block.alt || block.title || block.assetId);
```

虽然这可能是有意的简化，但应该有注释说明这是临时方案。

---

## 🟢 LOW - 低优先级（优化问题）

### 13. ZIP: 使用 STORED 而不压缩

**文件**: [public/core/zip-writer.js](public/core/zip-writer.js)  
**行号**: 第 3-54 行  
**严重性**: 🟢 LOW

```javascript
// ❌ 所有条目都使用压缩方法 0（STORED，无压缩）
...uint16(0),  // 压缩方法
```

DOCX/XLSX/PPTX 包含大量 XML，应该使用 DEFLATE（压缩方法 8）来压缩，可以减少 50-80% 的文件体积。

---

### 14. PDF: 实现过于简陋

**文件**: [public/formats/pdf-output.js](public/formats/pdf-output.js)  
**行号**: 整个文件  
**严重性**: 🟢 LOW

实现只支持纯文本，不支持图片、表格格式化等。虽然技术上可能工作，但功能很有限。

---

### 15. EPUB: nav.xhtml 导航结构简陋

**文件**: [public/formats/epub.js](public/formats/epub.js)  
**行号**: 第 115-117 行  
**严重性**: 🟢 LOW

```xml
<!-- ⚠️ 只有一个顶级链接，不支持复杂目录结构 -->
<nav epub:type="toc">
  <ol>
    <li><a href="chapter.xhtml">${escapeHtml(title)}</a></li>
  </ol>
</nav>
```

应该根据文档结构生成完整的多层级目录。

---

## 📋 按格式统计

| 格式 | 关键问题 | 高优先级 | 中优先级 | 低优先级 | 总计 |
|------|--------|--------|--------|--------|------|
| DOCX | 0 | 1 | 2 | 1 | 4 |
| XLSX | 1 | 1 | 2 | 0 | 4 |
| PPTX | 1 | 1 | 2 | 0 | 4 |
| EPUB | 1 | 1 | 0 | 1 | 3 |
| PDF | 0 | 0 | 0 | 1 | 1 |
| ZIP | 0 | 0 | 1 | 1 | 2 |

---

## 🎯 修复建议优先级

### 第一阶段 - 立即修复（影响文件可打开性）
1. **PPTX** - 添加 slideLayouts、slideMasters、theme
2. **XLSX** - 生成 xl/styles.xml
3. **EPUB** - 改进 HTML-XHTML 转换

### 第二阶段 - 高优先级（影响功能完整性）
4. **DOCX** - 生成 document.xml.rels
5. **XLSX** - 改用 sharedStrings.xml（可选）
6. **PPTX** - 完整化关系文件
7. **EPUB** - 增强 OPF 元数据

### 第三阶段 - 中等优先级（规范合规）
8. **所有OOXML** - 完整的 Content_Types.xml 注册
9. **ZIP** - 强制条目顺序（EPUB）
10. **所有格式** - 添加验证和错误处理

### 第四阶段 - 优化（低优先级）
11. **ZIP** - 实现 DEFLATE 压缩
12. **PDF** - 改进实现（支持图片等）
13. **EPUB** - 改进导航结构

---

## ✅ 验证清单

对于每个格式修复后，应进行以下验证：

```
DOCX:
  [ ] 在 Microsoft Word 中打开
  [ ] 用 7-Zip 检查 word/_rels/document.xml.rels 存在
  [ ] 无警告信息

XLSX:
  [ ] 在 Microsoft Excel 中打开
  [ ] 用 7-Zip 检查 xl/styles.xml 存在
  [ ] 用 7-Zip 检查 xl/sharedStrings.xml 存在
  [ ] 数据和样式正确显示

PPTX:
  [ ] 在 Microsoft PowerPoint 中打开
  [ ] 用 7-Zip 检查 ppt/slideLayouts/ 存在
  [ ] 用 7-Zip 检查 ppt/slideMasters/ 存在
  [ ] 幻灯片内容正确显示

EPUB:
  [ ] EpubCheck 通过验证
  [ ] 在 3+ 个阅读器中测试（Calibre, Edge, 移动应用）
  [ ] 目录导航工作正常

PDF:
  [ ] 在 Adobe Reader 和浏览器中打开
  [ ] 内容完整，文本可复制
```

---

## 📁 文件清单

### 需要修改的文件

1. **public/formats/docx-output.js** - 2 个修复
2. **public/formats/xlsx.js** - 4 个修复
3. **public/formats/pptx.js** - 4 个修复
4. **public/formats/epub.js** - 3 个修复
5. **public/core/zip-writer.js** - 2 个修复

### 新增文件（不需要创建，但要在ZIP中生成）
- ppt/slideLayouts/slideLayout1.xml
- ppt/slideMasters/slideMaster1.xml
- ppt/theme/theme1.xml
- ppt/slideLayouts/_rels/slideLayout1.xml.rels
- ppt/slideMasters/_rels/slideMaster1.xml.rels
- xl/styles.xml
- xl/sharedStrings.xml （可选但推荐）
- word/_rels/document.xml.rels

---

## 📞 联系信息

如需讨论具体修复方案，可参考：
- 详细报告：[FORMAT_COMPLIANCE_AUDIT.md](FORMAT_COMPLIANCE_AUDIT.md)
- 快速参考：[FORMAT_COMPLIANCE_QUICK_REFERENCE.md](FORMAT_COMPLIANCE_QUICK_REFERENCE.md)
- 内存文件：/memories/session/format-compliance-issues.md

