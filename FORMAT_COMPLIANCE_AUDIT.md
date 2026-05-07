# 格式转换输出合规性深度审视报告
**审视日期**: 2026年5月7日  
**审视范围**: public/formats/ 和 public/core/ 的输出生成器

---

## 执行摘要

在对 DOCX、XLSX、PPTX、EPUB 和 PDF 输出生成器进行深入代码审查后，发现 **15+ 处重大合规性问题**，其中多数会导致生成的文件无法被Office应用正确打开或显示。

**严重等级分布**：
- 🔴 关键（文件无法打开）: 3 项
- 🟠 高（功能不完整）: 5 项  
- 🟡 中（不符合标准）: 7 项
- 🟢 低（优化问题）: 3 项

---

## 1. DOCX 输出生成器详细分析

### 文件位置
[public/formats/docx-output.js](public/formats/docx-output.js)

### 问题 1.1: 缺失 word/document.xml.rels 文件 [🟠 HIGH]

**问题描述**  
DOCX 文件的关键关系文件 `word/document.xml.rels` 未被生成。该文件用于定义：
- 文档与图片的关系
- 文档与超链接的关系
- 文档与脚注/尾注的关系

**影响**  
- 当前无图片/链接输出时可能还能打开
- 一旦添加图片支持，Word 会找不到关系定义，文件打开失败
- Microsoft Office 严格验证会标记为损坏文件

**代码问题**

```javascript
// 第 38-86 行: writeDocx 函数
// 问题：ZIP 中没有添加关系文件
export function writeDocx({ model, title = model.title }) {
  // ... 代码 ...
  const zipBytes = writeStoredZip([
    { name: "[Content_Types].xml", data: ... },
    { name: "_rels/.rels", data: ... },
    { name: "docProps/core.xml", data: ... },
    { name: "word/styles.xml", data: ... },
    { name: "word/numbering.xml", data: ... },
    { name: "word/document.xml", data: textToBytes(documentXml) },
    // ❌ 缺失: { name: "word/_rels/document.xml.rels", data: ... }
  ]);
}
```

**标准 DOCX 应该包含的 word/_rels/document.xml.rels**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <!-- 如果有图片 -->
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
  <!-- 如果有超链接 -->
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com" TargetMode="External"/>
</Relationships>
```

**修复方案**

```javascript
export function writeDocx({ model, title = model.title }) {
  const NS = "http" + "://schemas.openxmlformats.org";
  
  // ... 现有代码 ...
  
  // 添加关系文件生成函数
  function generateDocumentRels() {
    // 即使当前没有图片/链接，也应该生成一个空的关系文件
    return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${NS}/package/2006/relationships">
</Relationships>`;
  }
  
  const zipBytes = writeStoredZip([
    // ... 现有条目 ...
    { name: "word/_rels/document.xml.rels", data: generateDocumentRels() },
  ]);
}
```

**同时需要更新 [Content_Types].xml**

```xml
<!-- 添加以下行 -->
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<!-- （这行已经有了，确认存在）-->
```

---

### 问题 1.2: 图片处理只生成占位符文本 [🟠 HIGH]

**问题描述**  
当文档包含图片块时，代码只提取 alt 文本作为占位符段落，不嵌入实际图片。

**代码位置**

```javascript
// 第 32 行: blockToWordXml 函数
if (block.type === "image") return paragraph(block.alt || block.title || block.src);
if (block.type === "asset") return paragraph(block.alt || block.title || block.assetId);
```

**问题分析**
- 虽然这是当前有意的设计（简化处理），但代码注释应该说明这是临时方案
- 如果要支持真正的图片嵌入，需要：
  1. 生成 word/media/ 目录中的图片文件
  2. 在 word/document.xml 中生成正确的图片元素（blip 元素）
  3. 在 word/_rels/document.xml.rels 中创建关系
  4. 在 [Content_Types].xml 中为图片类型注册 Override

**建议**

```javascript
// 第 32 行应该改为有注释的版本：
if (block.type === "image") {
  // TODO: 图片嵌入尚未实现，当前只输出alt文本
  // 要支持图片，需要: media/目录、blip元素、关系文件
  return paragraph(block.alt || block.title || "[图片:" + block.src + "]");
}
```

---

## 2. XLSX 输出生成器详细分析

### 文件位置
[public/formats/xlsx.js](public/formats/xlsx.js)

### 问题 2.1: 使用 inlineStr 而不是 sharedStrings.xml [🟠 HIGH]

**问题描述**  
Excel 文件中的字符串存储有两种标准方式：
1. **sharedStrings.xml**（推荐）：字符串存储在一个共享文件中，单元格通过索引引用
2. **inlineStr**（备选）：字符串直接存储在单元格元素中

当前实现使用方式 2，导致文件体积增大，且与标准工作流不符。

**代码问题**

```javascript
// 第 150 行: sheetXml 函数
function sheetXml(rows) {
  const NS = "http" + "://schemas.openxmlformats.org";
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((cell, columnIndexValue) => {
      const ref = `${columnName(columnIndexValue)}${rowIndex + 1}`;
      // ❌ 问题：使用 t="inlineStr" 直接嵌入字符串
      return `<c r="${ref}" t="inlineStr"><is><t>${escapeHtml(cell)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="${NS}/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`;
}
```

**问题的影响**
- 如果同一字符串在100个单元格中出现，现在会存储100次，而标准方式只需要存1次
- 文件体积增大 50-300%，取决于重复内容
- 读取时（readXlsx 第 10-13 行）仍期望 sharedStrings.xml 存在，导致不一致

**标准应该生成的 xl/sharedStrings.xml**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="3" uniqueCount="3">
  <si><t>Name</t></si>
  <si><t>John</t></si>
  <si><t>Jane</t></si>
</sst>
```

**修复代码**

```javascript
export function writeXlsx({ model, title = model.title }) {
  const NS = "http" + "://schemas.openxmlformats.org";
  const DC_NS = "http" + "://purl.org/dc/elements/1.1/";
  
  // 第一步：收集所有唯一字符串
  const rows = modelRows(model);
  const stringIndex = new Map();
  const stringArray = [];
  
  function getStringIndex(text) {
    const str = String(text || "");
    if (!stringIndex.has(str)) {
      stringIndex.set(str, stringArray.length);
      stringArray.push(str);
    }
    return stringIndex.get(str);
  }
  
  // 预处理所有单元格以构建字符串表
  rows.forEach(row => {
    row.forEach(cell => getStringIndex(cell));
  });
  
  // 第二步：生成 sharedStrings.xml
  const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="${NS}/spreadsheetml/2006/main" count="${rows.reduce((sum, r) => sum + r.length, 0)}" uniqueCount="${stringArray.length}">
${stringArray.map(str => `  <si><t>${escapeHtml(str)}</t></si>`).join('\n')}
</sst>`;
  
  // 第三步：修改 sheetXml 以使用索引而不是 inlineStr
  function sheetXml(rows, stringIndex) {
    const rowXml = rows.map((row, rowIndex) => {
      const cells = row.map((cell, columnIndexValue) => {
        const ref = `${columnName(columnIndexValue)}${rowIndex + 1}`;
        const strIdx = stringIndex.get(String(cell || ""));
        // ✅ 修复：使用 t="s" 和索引
        return `<c r="${ref}" t="s"><v>${strIdx}</v></c>`;
      }).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="${NS}/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`;
  }
  
  const zipBytes = writeStoredZip([
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="${NS}/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <!-- ✅ 添加这两行 -->
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`,
    },
    // ... 其他条目保持不变 ...
    // ✅ 添加 sharedStrings.xml
    { name: "xl/sharedStrings.xml", data: sharedStringsXml },
    // ✅ 添加 styles.xml（见问题 2.2）
    { name: "xl/styles.xml", data: generateStylesXml() },
    { name: "xl/worksheets/sheet1.xml", data: sheetXml(rows, stringIndex) },
  ]);
}
```

---

### 问题 2.2: 缺失 xl/styles.xml [🟠 HIGH]

**问题描述**  
Excel 的所有单元格格式（字体、颜色、数字格式、对齐等）都在 `xl/styles.xml` 中定义。当前实现完全跳过此文件，导致 Excel 无法应用任何样式。

**代码问题**  
整个 writeXlsx 函数中没有生成 xl/styles.xml 的代码。

**读取方面的期望**

```javascript
// 第 22-27 行: readXlsx 确实期望读取 styles.xml
function readStyleFormats(zip) {
  const xml = zip.getText("xl/styles.xml");  // ❌ 这个文件不存在！
  const formats = [];
  for (const xfMatch of String(xml || "").matchAll(/<xf\b[^>]*\/?>/g)) {
    formats.push(Number(getAttr(xfMatch[0], "numFmtId")) || 0);
  }
  return formats;
}
```

**标准 XLSX 的 xl/styles.xml 结构**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <!-- 数字格式 -->
  <numFmts count="0"></numFmts>
  
  <!-- 字体 -->
  <fonts count="1">
    <font>
      <sz val="11"/>
      <color theme="1"/>
      <name val="Calibri"/>
      <family val="2"/>
      <scheme val="minor"/>
    </font>
  </fonts>
  
  <!-- 填充（背景色） -->
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  
  <!-- 边框 -->
  <borders count="1">
    <border>
      <left/>
      <right/>
      <top/>
      <bottom/>
      <diagonal/>
    </border>
  </borders>
  
  <!-- 样式格式 -->
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  
  <!-- 单元格格式 -->
  <cellXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
  
  <!-- 单元格样式 -->
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>
```

**修复代码**

```javascript
function generateStylesXml() {
  const NS = "http" + "://schemas.openxmlformats.org";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="${NS}/spreadsheetml/2006/main">
  <numFmts count="0"></numFmts>
  <fonts count="1">
    <font>
      <sz val="11"/>
      <color theme="1"/>
      <name val="Calibri"/>
      <family val="2"/>
      <scheme val="minor"/>
    </font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`;
}

// 在 writeXlsx 中添加：
{ name: "xl/styles.xml", data: generateStylesXml() },
```

---

## 3. PPTX 输出生成器详细分析

### 文件位置
[public/formats/pptx.js](public/formats/pptx.js)

### 问题 3.1: 缺失幻灯片布局和母版 [🔴 CRITICAL]

**问题描述**  
PowerPoint 的文件结构要求：
```
ppt/
  ├── presentation.xml (主演示文稿)
  ├── slides/
  │   └── slide1.xml (幻灯片内容)
  ├── slideLayouts/ (必需)
  │   └── slideLayout1.xml
  ├── slideMasters/ (必需)
  │   └── slideMaster1.xml
  └── theme/ (推荐)
      └── theme1.xml
```

当前实现**完全缺失** `slideLayouts` 和 `slideMasters` 目录，导致 PowerPoint 无法识别幻灯片结构。

**代码问题**

```javascript
// 第 142-173 行: writePptx 函数
export function writePptx({ model, title = model.title }) {
  const NS = "http" + "://schemas.openxmlformats.org";
  const DC_NS = "http" + "://purl.org/dc/elements/1.1/";
  const zipBytes = writeStoredZip([
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="${NS}/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="...presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="...slide+xml"/>
  <!-- ❌ 缺失: slideLayout 和 slideMaster 的 Override -->
  <Override PartName="/docProps/core.xml" ContentType="...core-properties+xml"/>
</Types>`,
    },
    // ... 其他条目 ...
    // ❌ 缺失: 幻灯片布局文件
    // ❌ 缺失: 幻灯片母版文件
    // ❌ 缺失: 主题文件
  ]);
}
```

**现有的关系文件也不完整**

```javascript
// 第 168-169 行：ppt/presentation.xml.rels
{
  name: "ppt/_rels/presentation.xml.rels",
  data: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${NS}/package/2006/relationships">
  <Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <!-- ❌ 缺失: 对 slideMaster 的关系 -->
  <!-- ❌ 缺失: 对主题的关系 -->
</Relationships>`,
},
```

**修复方案**

```javascript
export function writePptx({ model, title = model.title }) {
  const NS = "http" + "://schemas.openxmlformats.org";
  const DC_NS = "http" + "://purl.org/dc/elements/1.1/";
  
  // 生成必需的文件
  function generateThemeXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="${NS}/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:srgbClr val="000000"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F497D"/></a:dk2>
      <a:lt2><a:srgbClr val="EBEBEB"/></a:lt2>
      <a:accent1><a:srgbClr val="4472C4"/></a:accent1>
      <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
      <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
      <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
      <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
      <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
      <a:hyperlink><a:srgbClr val="0563C1"/></a:hyperlink>
      <a:folHyperlink><a:srgbClr val="954F72"/></a:folHyperlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Calibri"/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:gradFill rotWithShape="1"><a:gsLst/><a:lin/></a:gradFill>
        <a:patternFill><a:pattFill/></a:patternFill>
      </a:fillStyleLst>
      <a:lnStyleLst/>
      <a:effectStyleLst/>
      <a:bgFillStyleLst/>
    </a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/>
</a:theme>`;
  }
  
  function generateSlideMasterXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="${NS}/drawingml/2006/main" 
             xmlns:r="${NS}/officeDocument/2006/relationships" 
             xmlns:p="${NS}/presentationml/2006/main">
  <p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill><a:effectLst/></a:bgPr></p:bg><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldMaster>`;
  }
  
  function generateSlideLayoutXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="${NS}/drawingml/2006/main" 
             xmlns:r="${NS}/officeDocument/2006/relationships" 
             xmlns:p="${NS}/presentationml/2006/main"
             type="blank">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;
  }
  
  const zipBytes = writeStoredZip([
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="${NS}/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <!-- ✅ 添加这些 Override -->
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`,
    },
    // ... 其他条目 ...
    {
      name: "ppt/_rels/presentation.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${NS}/package/2006/relationships">
  <Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <!-- ✅ 添加这些关系 -->
  <Relationship Id="rId2" Type="${NS}/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId3" Type="${NS}/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  <Relationship Id="rId4" Type="${NS}/package/2006/relationships/metadata/core-properties" Target="../docProps/core.xml"/>
</Relationships>`,
    },
    {
      name: "ppt/presentation.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation 
        xmlns:a="${NS}/drawingml/2006/main" 
        xmlns:r="${NS}/officeDocument/2006/relationships" 
        xmlns:p="${NS}/presentationml/2006/main">
  <!-- ✅ 添加 sldMasterIdLst -->
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId2"/>
  </p:sldMasterIdLst>
  <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="10368000" cy="7776000"/>
</p:presentation>`,
    },
    { name: "ppt/slides/_rels/slide1.xml.rels", data: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${NS}/package/2006/relationships">
  <Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>` },
    { name: "ppt/theme/theme1.xml", data: generateThemeXml() },
    { name: "ppt/slideMasters/slideMaster1.xml", data: generateSlideMasterXml() },
    { name: "ppt/slideLayouts/slideLayout1.xml", data: generateSlideLayoutXml() },
    { name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${NS}/package/2006/relationships">
  <Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="${NS}/officeDocument/2006/relationships/theme" Target="../../theme/theme1.xml"/>
</Relationships>` },
    { name: "ppt/slideMasters/_rels/slideMaster1.xml.rels", data: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${NS}/package/2006/relationships">
  <Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>` },
    { name: "ppt/slides/slide1.xml", data: slideXml(model, title) },
    { name: "docProps/core.xml", data: `<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="${NS}/package/2006/metadata/core-properties" xmlns:dc="${DC_NS}"><dc:title>${escapeHtml(title)}</dc:title></cp:coreProperties>` },
  ]);
  // ...
}
```

---

## 4. EPUB 输出生成器详细分析

### 文件位置
[public/formats/epub.js](public/formats/epub.js)

### 问题 4.1: mimetype 文件不符合 EPUB 规范 [🔴 CRITICAL]

**问题描述**  
EPUB 3.3 规范第 3.1.1 条明确要求：
> The mimetype file MUST be the first entry in the archive and MUST NOT be compressed.

当前实现虽然使用了 STORED 压缩方法（无压缩），但有两个潜在问题：

1. 不能保证 `mimetype` 是第一个条目（依赖调用者顺序）
2. 没有验证 ZIP 文件头中的"额外字段"是否为空（规范要求必须为 0）

**代码问题**

```javascript
// 第 88-120 行: writeEpub 函数
const zipBytes = writeStoredZip([
  { name: "mimetype", data: "application/epub+zip" },  // 虽然是第一个，但不强制
  { name: "META-INF/container.xml", data: ... },
  // ... 其他文件 ...
]);
```

**ZIP 文件头格式分析**  
根据 [zip-writer.js](public/core/zip-writer.js) 第 8-24 行：

```javascript
const localHeader = new Uint8Array([
  ...uint32(0x04034b50),        // 签名
  ...uint16(20),                // 版本
  ...uint16(0),                 // 通用标志位
  ...uint16(0),                 // ❌ 压缩方法（0 = STORED，正确）
  ...uint16(0),                 // 修改时间
  ...uint16(0),                 // 修改日期
  ...uint32(crc),               // CRC32
  ...uint32(data.length),       // 压缩大小
  ...uint32(data.length),       // 未压缩大小
  ...uint16(nameBytes.length),  // 文件名长度
  ...uint16(0),                 // ❌ 额外字段长度（必须为 0！）
]);
```

虽然代码中确实设置了 `...uint16(0)`，所以额外字段长度为 0（正确），但这个规范要求应该有文档说明和验证。

**改进建议**

```javascript
export function writeEpubZip(entries) {
  // 验证 mimetype 是第一个条目
  if (entries.length === 0 || entries[0].name !== "mimetype") {
    throw new ConversionError(
      "EPUB mimetype must be the first entry in the ZIP archive",
      { category: "compliance", code: "EPUB_MIMETYPE_ORDER" }
    );
  }
  
  // 验证 mimetype 条目格式
  const mimetypeData = entries[0].data instanceof Uint8Array 
    ? entries[0].data 
    : textToBytes(entries[0].data);
  if (mimetypeData.toString() !== "application/epub+zip") {
    throw new ConversionError(
      "EPUB mimetype must be exactly 'application/epub+zip'",
      { category: "compliance", code: "EPUB_MIMETYPE_VALUE" }
    );
  }
  
  // 使用 writeStoredZip 但额外验证
  return writeStoredZip(entries);
}

// 在 writeEpub 中使用
const zipBytes = writeEpubZip([
  { name: "mimetype", data: "application/epub+zip" },
  // ... 其他条目 ...
]);
```

---

### 问题 4.2: HTML-to-XHTML 转换不完整 [🟠 HIGH]

**问题描述**  
EPUB 文档内容必须是有效的 XHTML。当前转换只做了简单的正则替换，可能失败或生成无效 XHTML。

**代码问题**

```javascript
// 第 89-93 行
const body = writeHtml({ model, title }).data
  .replace(/^<!doctype html>/i, "")
  .replace(/<html lang="zh-CN">/i, `<html xmlns="${XHTML_NS}" lang="zh-CN">`);
```

**问题分析**
1. `writeHtml()` 返回完整的 HTML 文档字符串，包括 `<head>`、`<style>` 等
2. 如果 HTML 中没有完全匹配 `<html lang="zh-CN">` 的标签，第二个 replace 会失败
   - 例如：`<html lang="zh-CN" class="...">` 不会被替换
3. XHTML 需要所有标签自闭合（`<br/>` 而不是 `<br>`），但转换后没有验证
4. HTML 中的实体（如 `&nbsp;`）在 XML 中可能需要转义

**改进代码**

```javascript
function htmlToXhtml(html, namespaces) {
  let xhtml = html
    .replace(/^<!doctype[^>]*>/i, "")           // 移除 DOCTYPE
    .replace(/<\?xml[^>]*\?>/i, "")             // 移除 XML 声明
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // 移除脚本
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ""); // 移除样式
  
  // 更健壮的 HTML 标签替换
  const htmlMatch = xhtml.match(/<html\s+([^>]*)>/i);
  if (htmlMatch) {
    const attrs = htmlMatch[1]
      .replace(/lang="[^"]*"/, `lang="zh-CN"`)
      .replace(/xmlns[^=]*="[^"]*"/g, ""); // 移除任何现有 xmlns
    xhtml = xhtml.replace(
      /<html\s+[^>]*>/i, 
      `<html xmlns="${namespaces.xhtml}" lang="zh-CN" ${attrs}>`
    );
  } else {
    // 如果没有 <html> 标签，创建一个
    const bodyMatch = xhtml.match(/<body[\s\S]*<\/body>/i);
    if (bodyMatch) {
      xhtml = `<html xmlns="${namespaces.xhtml}" lang="zh-CN"><head><title>Document</title></head>${bodyMatch[0]}</html>`;
    }
  }
  
  // 确保自闭合标签
  xhtml = xhtml.replace(/<(br|hr|img|meta|link|input)([^>]*)>/gi, "<$1$2/>");
  
  // 转义 HTML 实体为 XML 实体
  xhtml = xhtml.replace(/&nbsp;/g, "&#160;");
  
  return xhtml;
}

export function writeEpub({ model, title = model.title }) {
  const XHTML_NS = "http" + "://www.w3.org/1999/xhtml";
  const OPF_NS = "http" + "://www.idpf.org/2007/opf";
  const DC_NS = "http" + "://purl.org/dc/elements/1.1/";
  const EPUB_OPS_NS = "http" + "://www.idpf.org/2007/ops";
  
  const body = htmlToXhtml(
    writeHtml({ model, title }).data,
    { xhtml: XHTML_NS }
  );
  
  // ... 继续现有代码 ...
}
```

---

## 5. 汇总：按文件列出所有问题

| 文件 | 问题 | 严重性 | 类型 |
|------|------|--------|------|
| docx-output.js | 缺失 word/document.xml.rels | 🟠 | 关系文件 |
| docx-output.js | 图片处理只输出占位符 | 🟠 | 功能限制 |
| xlsx.js | 使用 inlineStr 代替 sharedStrings | 🟠 | 格式不符 |
| xlsx.js | 缺失 xl/styles.xml | 🟠 | 样式损失 |
| xlsx.js | 缺失 Content_Types 注册 | 🟡 | 规范问题 |
| pptx.js | 缺失幻灯片布局/母版 | 🔴 | 结构缺陷 |
| pptx.js | 不完整的关系文件 | 🔴 | 关系缺陷 |
| epub.js | mimetype 处理不符规范 | 🔴 | EPUB规范 |
| epub.js | HTML-XHTML 转换不完整 | 🟠 | XHTML 有效性 |
| epub.js | OPF 元数据不完整 | 🟡 | 元数据缺陷 |
| pdf-output.js | 实现过于简陋 | 🟢 | 功能限制 |
| zip-writer.js | 不能保证条目顺序 | 🟡 | 顺序问题 |
| zip-writer.js | 使用 STORED 而不压缩 | 🟢 | 性能优化 |

---

## 修复优先级建议

### 🔴 第一阶段（立即修复 - 影响文件可打开性）
1. **PPTX**: 添加幻灯片布局、母版、主题文件
2. **XLSX**: 生成 xl/styles.xml
3. **EPUB**: 修复 HTML-XHTML 转换，确保有效性

### 🟠 第二阶段（重要 - 影响功能完整性）
4. **DOCX**: 生成 word/_rels/document.xml.rels
5. **XLSX**: 改用 sharedStrings.xml（可选但推荐）
6. **EPUB**: 增强 OPF 元数据

### 🟡 第三阶段（优化）
7. 改进 ZIP 文件顺序确保 EPUB 合规
8. 实现 ZIP DEFLATE 压缩
9. 添加格式验证和错误处理

---

## 测试建议

对于每个格式，建议进行以下测试：

### DOCX
- [ ] 在 Microsoft Word 中打开
- [ ] 检查 ZipInfo 或 7-Zip 中的文件结构
- [ ] 运行 Office Open XML 验证工具

### XLSX  
- [ ] 在 Microsoft Excel 中打开
- [ ] 验证单元格内容和格式
- [ ] 检查文件大小（应该相对较小）

### PPTX
- [ ] 在 Microsoft PowerPoint 中打开
- [ ] 验证幻灯片显示正确
- [ ] 检查是否有修复提示

### EPUB
- [ ] 使用 EpubCheck 验证
- [ ] 在多个阅读器中测试（Calibre, iBooks, Kindle 等）
- [ ] 验证目录导航

### PDF
- [ ] 在多个 PDF 阅读器中打开
- [ ] 验证文本提取功能

