# 格式转换合规性问题 - 快速参考指南

## 三级严重性快速查看

### 🔴 关键问题 - 文件可能无法打开
```
PPTX: 缺失 slideLayouts 和 slideMasters
├─ 表现: PowerPoint 报"演示文稿已损坏"或无法打开
├─ 位置: pptx.js 第 142-173 行
└─ 修复: 需要添加 5+ 个新文件和关系

EPUB: mimetype 处理和 HTML-XHTML 转换
├─ 表现: EpubCheck 验证失败，某些阅读器拒绝打开
├─ 位置: epub.js 第 89-120 行
└─ 修复: 改进 HTML 转换和 ZIP 顺序验证
```

### 🟠 高优先级 - 功能缺陷或格式不符
```
XLSX: 缺失 styles.xml + 使用 inlineStr
├─ 表现: 文件打开但无样式，文件体积大
├─ 位置: xlsx.js 第 144-182 行
└─ 修复: 添加 styles.xml 和 sharedStrings.xml

DOCX: 缺失 document.xml.rels
├─ 表现: 现在可打开，但无法扩展以支持图片/链接
├─ 位置: docx-output.js 第 38-86 行
└─ 修复: 生成关系文件
```

### 🟡 中等 - 不符合规范但功能尚可
```
• PPTX: 缺失主题文件
• EPUB: OPF 元数据不完整
• XLSX: Content_Types.xml 注册不完整
```

### 🟢 低优先级 - 优化问题
```
• ZIP 文件使用 STORED 而不压缩（文件体积大）
• PDF 实现过于简陋
```

---

## 问题速查表

### 按格式
```
DOCX
├─ 缺失 word/_rels/document.xml.rels [关系文件]
└─ 图片处理只输出占位符文本 [功能]

XLSX  
├─ 缺失 xl/styles.xml [样式]
├─ 缺失 xl/sharedStrings.xml [字符串存储]
└─ Content_Types.xml 注册不完整 [配置]

PPTX 🔴
├─ 缺失 slideLayouts/ 目录及文件
├─ 缺失 slideMasters/ 目录及文件  
├─ 缺失 ppt/theme/theme1.xml
└─ 不完整的关系文件链接

EPUB 🔴
├─ HTML-to-XHTML 转换不完整
├─ mimetype 处理不符合规范
└─ OPF 元数据不完整

PDF
└─ 实现过于简陋，仅支持纯文本
```

### 按问题类型
```
缺失关键文件
├─ XLSX: xl/styles.xml
├─ XLSX: xl/sharedStrings.xml
├─ DOCX: word/_rels/document.xml.rels
└─ PPTX: slideLayouts/, slideMasters/, theme1.xml

关系文件不完整
├─ PPTX: presentation.xml.rels 缺少 slideMaster/theme 关系
└─ DOCX: 缺少整个 document.xml.rels

规范合规问题
├─ EPUB: mimetype 顺序和格式不符 EPUB 3.3 规范
├─ XLSX: 用 inlineStr 代替 sharedStrings（不标准）
└─ PPTX: 结构不符合 Office Open XML

转换问题
├─ EPUB: HTML-to-XHTML 转换脆弱
└─ PDF: 过度简化的实现
```

---

## 代码位置速查

### docx-output.js (96 行)
```javascript
第 32 行    图片占位符处理
第 38-86 行 writeDocx 主函数 ⚠️ 缺少 document.xml.rels
```

### xlsx.js (182 行)
```javascript
第 22-27 行 readStyleFormats() - 期望 styles.xml
第 150 行   sheetXml() - 使用 inlineStr ⚠️ 非标准
第 144-182 行 writeXlsx() ⚠️ 缺少 styles.xml 和 sharedStrings.xml
```

### pptx.js (173 行)
```javascript
第 142-173 行 writePptx() ⚠️🔴 缺少多个关键文件
第 168-169 行 presentation.xml.rels ⚠️ 不完整
```

### epub.js (120 行)
```javascript
第 89-93 行  HTML-XHTML 转换 ⚠️ 不完整
第 95-120 行 writeEpub() ⚠️🔴 mimetype 处理
```

### zip-writer.js (54 行)
```javascript
第 3-54 行 writeStoredZip() - 使用 STORED（无压缩）
         - 不强制条目顺序
```

---

## 建议的修复顺序（优先级）

### 紧急（会导致文件无法打开）
- [ ] **PPTX** - 添加幻灯片布局、母版、主题
  - 影响: PowerPoint 无法打开
  - 预计工作量: 中等（需要生成5个新文件）
  - 文件: pptx.js

- [ ] **XLSX** - 生成 styles.xml
  - 影响: 样式信息丢失
  - 预计工作量: 小（模板式生成）
  - 文件: xlsx.js

- [ ] **EPUB** - 修复 HTML-XHTML 转换
  - 影响: 生成无效 XHTML
  - 预计工作量: 小到中（改进正则替换）
  - 文件: epub.js

### 高优先级（功能不完整）
- [ ] **DOCX** - 生成 document.xml.rels
  - 影响: 无法扩展支持图片
  - 预计工作量: 小（即使为空也可以）
  - 文件: docx-output.js

- [ ] **XLSX** - 改用 sharedStrings.xml
  - 影响: 文件体积大，不标准
  - 预计工作量: 中（需要字符串去重逻辑）
  - 文件: xlsx.js

### 中优先级（规范问题）
- [ ] **PPTX** - 添加主题文件
  - 影响: 某些 Office 版本可能问题
  - 预计工作量: 小
  - 文件: pptx.js

- [ ] **EPUB** - 增强 OPF 元数据
  - 影响: 阅读器显示信息不完整
  - 预计工作量: 小
  - 文件: epub.js

- [ ] **ZIP** - 确保条目顺序（特别是 EPUB）
  - 影响: EPUB 规范合规性
  - 预计工作量: 中
  - 文件: zip-writer.js

### 低优先级（优化）
- [ ] 实现 ZIP DEFLATE 压缩
  - 影响: 文件体积（但可正常打开）
  - 预计工作量: 中高（复杂的压缩算法）
  - 文件: zip-writer.js

---

## 测试清单

### 每个格式的最小验证
```
DOCX:
  ✓ 在 Word 中打开且显示内容
  ✓ 用 7-Zip/WinRAR 打开，检查文件结构完整
  ✓ 运行 Office XML 验证工具（如果可用）

XLSX:
  ✓ 在 Excel 中打开且显示数据
  ✓ 检查样式信息（至少应有默认样式）
  ✓ 文件大小合理（比 DOCX 略大）

PPTX:
  ✓ 在 PowerPoint 中打开
  ✓ 幻灯片内容显示正确
  ✓ 无"修复"提示

EPUB:
  ✓ EpubCheck 通过验证（https://w3c.github.io/epubcheck/）
  ✓ 在至少 3 个阅读器中打开（Calibre, Edge, 移动应用等）
  ✓ 目录导航工作正常

PDF:
  ✓ 在 Adobe Reader 和浏览器中打开
  ✓ 文本可复制
  ✓ 内容完整
```

---

## 工具和资源

### 文件验证工具
```
DOCX/XLSX/PPTX:
  - Office Open XML validation tools
  - 7-Zip / WinRAR (检查结构)

EPUB:
  - EpubCheck: https://w3c.github.io/epubcheck/
  - Calibre: 打开电子书检查

ZIP:
  - zipdiff, zipinfo 等工具
```

### 参考规范
```
DOCX/XLSX/PPTX:
  - ECMA-376 (Office Open XML Standard)
  - ISO/IEC 29500

EPUB:
  - EPUB 3.3: https://www.w3.org/publishing/epub33/

PDF:
  - ISO 32000 (PDF Specification)
```

---

## 影响评估矩阵

| 问题 | 频率 | 严重性 | 易修复度 | 总优先级 |
|------|------|--------|--------|---------|
| PPTX 幻灯片布局 | 高 | 🔴 | 中 | 🥇 |
| XLSX styles.xml | 高 | 🟠 | 小 | 🥇 |
| EPUB HTML转换 | 高 | 🔴 | 小 | 🥇 |
| DOCX rels 文件 | 中 | 🟠 | 小 | 🥈 |
| XLSX sharedStrings | 高 | 🟠 | 中 | 🥈 |
| ZIP 压缩 | 高 | 🟢 | 大 | 🥉 |

---

## 快速诊断

### 如何识别生成的文件有问题

**DOCX 问题诊断**
```bash
# 检查文件结构
unzip -l output.docx | grep "word/_rels"
# 应该看到 word/_rels/document.xml.rels
```

**XLSX 问题诊断**
```bash
# 检查是否有样式文件
unzip -l output.xlsx | grep styles.xml
# 应该看到 xl/styles.xml

# 检查是否有共享字符串
unzip -l output.xlsx | grep sharedStrings.xml  
# 应该看到 xl/sharedStrings.xml
```

**PPTX 问题诊断**
```bash
# 检查幻灯片布局
unzip -l output.pptx | grep slideLayouts
# 应该看到 ppt/slideLayouts/slideLayout1.xml

# 检查幻灯片母版
unzip -l output.pptx | grep slideMasters
# 应该看到 ppt/slideMasters/slideMaster1.xml
```

**EPUB 问题诊断**
```bash
# 运行 EpubCheck
java -jar epubcheck.jar output.epub
# 应该通过所有验证

# 检查 mimetype 是否正确
unzip -l output.epub | head -1
# 应该列出 mimetype 作为第一个条目
```

---

## 开发者快速参考

### 修复 XLSX styles.xml 的最小代码
```javascript
const generateBasicStylesXml = (NS) => `<?xml version="1.0"?>
<styleSheet xmlns="${NS}/spreadsheetml/2006/main">
  <numFmts count="0"></numFmts>
  <fonts count="1"><font><sz val="11"/></font></fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1"><border></border></borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="1"><xf/></cellXfs>
</styleSheet>`;

// 在 writeXlsx 中添加
{ name: "xl/styles.xml", data: generateBasicStylesXml(NS) }
```

### 修复 DOCX document.xml.rels 的最小代码
```javascript
{ name: "word/_rels/document.xml.rels", 
  data: `<?xml version="1.0"?>
<Relationships xmlns="${NS}/package/2006/relationships">
</Relationships>` 
}
```

### 验证 EPUB mimetype 的最小代码
```javascript
if (entries[0].name !== "mimetype") {
  throw new Error("EPUB: mimetype must be first entry");
}
```

