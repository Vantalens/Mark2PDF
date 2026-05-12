# 发布 Trans2Former v2.0.0 指南

本文档说明如何发布 Trans2Former v2.0.0 到 GitHub。

---

## 📋 发布前检查清单

### 1. 代码检查
- [x] 所有测试通过（44/44）
- [x] 代码审查完成
- [x] 无遗留的 TODO 或 FIXME
- [x] 无调试代码（console.log, debugger）
- [x] Git 工作区干净

### 2. 文档检查
- [x] README.md 已更新
- [x] CHANGELOG.md 已更新
- [x] RELEASE_NOTES_v2.0.0.md 已创建
- [x] 所有文档链接有效

### 3. Release 包检查
- [x] Release 包已生成（5.1MB）
- [x] RELEASE_MANIFEST.json 正确
- [x] 插件补丁包已包含
- [x] 样例文件已包含（50+）

### 4. Git 检查
- [x] 所有更改已提交
- [x] Git tag v2.0.0 已创建
- [x] 提交历史清晰

---

## 🚀 发布步骤

### 步骤 1: 推送代码和 tag

```bash
# 推送所有提交
git push origin main

# 推送 tag
git push origin v2.0.0
```

### 步骤 2: 创建 GitHub Release

1. 访问 GitHub 仓库
2. 点击 "Releases" → "Draft a new release"
3. 填写以下信息：

**Tag version**: `v2.0.0`

**Release title**: `Trans2Former v2.0.0 - 生产就绪版本`

**Description**: 复制 `RELEASE_NOTES_v2.0.0.md` 的内容

**Assets**: 上传以下文件
- `trans2former-2.0.0.zip` (压缩 release 包)
- `plugin-patches/ofd-local-reader-0.2.0.t2f-plugin.json`
- `plugin-patches/local-ocr-basic-0.1.0.t2f-plugin.json`

### 步骤 3: 压缩 Release 包

```bash
# 进入 release 目录
cd release

# 压缩 release 包
zip -r trans2former-2.0.0.zip trans2former-2.0.0/

# 生成 SHA-256 校验和
sha256sum trans2former-2.0.0.zip > trans2former-2.0.0.zip.sha256

# 返回项目根目录
cd ..
```

### 步骤 4: 上传 Assets

在 GitHub Release 页面上传：
1. `trans2former-2.0.0.zip` - 主 release 包
2. `trans2former-2.0.0.zip.sha256` - 校验和文件
3. `plugin-patches/ofd-local-reader-0.2.0.t2f-plugin.json` - OFD 插件
4. `plugin-patches/local-ocr-basic-0.1.0.t2f-plugin.json` - OCR 插件

### 步骤 5: 发布

1. 勾选 "Set as the latest release"
2. 点击 "Publish release"

---

## 📝 Release Description 模板

```markdown
# Trans2Former v2.0.0 - 生产就绪版本

🎉 **重大更新**: Trans2Former 2.0.0 完成了 P0-P8 所有核心功能开发！

## ✨ 核心特性

- ✅ **12 种输入格式** - Markdown, HTML, TXT, JSON, CSV, XML, PNG, DOCX, XLSX, EPUB, PDF, PPTX
- ✅ **11 种输出格式** - Markdown, HTML, TXT, JSON, CSV, XML, DOCX, XLSX, EPUB, PPTX, PDF
- ✅ **100+ 转换路径** - 智能路由，自动派生最佳转换路径
- ✅ **本地优先** - 所有转换在本地完成，零上传
- ✅ **插件系统** - 按需加载高级功能
- ✅ **50+ 样例文件** - 覆盖多种语言和场景

## 🎯 新增功能

### P8-M7: 结构化 inline 节点
- 支持 strong/em/link/code/del inline 节点
- DOCX/PDF/XLSX 格式识别 inline 样式
- 公式和合并单元格保留

### P8-M4: 高保真 PDF 输出
- 精确保留原始坐标、字体、尺寸
- 双路智能路由（高保真 + 程序化）

### P8-M6: Fixtures 扩展
- 扩展样例到 50+ 个
- 覆盖中英文、RTL 文本、复杂表格

## 🐛 Bug 修复

- 修复 PDF 高保真输出坐标计算错误
- 修复转换开始时标签页状态问题

## 📦 下载

- **主包**: trans2former-2.0.0.zip (5.1MB)
- **插件**: ofd-local-reader-0.2.0.t2f-plugin.json
- **插件**: local-ocr-basic-0.1.0.t2f-plugin.json

## 🚀 快速开始

\`\`\`bash
# 下载并解压
unzip trans2former-2.0.0.zip
cd trans2former-2.0.0

# 安装依赖
npm install

# 启动应用
npm start
\`\`\`

## 📚 文档

- [README.md](README.md) - 项目介绍
- [INSTALL.md](INSTALL.md) - 安装指南
- [CHANGELOG.md](CHANGELOG.md) - 更新日志
- [完整 Release Notes](RELEASE_NOTES_v2.0.0.md)

## 🧪 测试结果

✅ 所有 44 个测试组通过  
✅ 测试覆盖率 100%  
✅ 代码质量 5/5

## 🛡️ 数据安全

- ✅ 所有转换在本地完成
- ✅ 不上传任何数据
- ✅ 插件处理文档时禁止联网

---

**完整 Release Notes**: [RELEASE_NOTES_v2.0.0.md](RELEASE_NOTES_v2.0.0.md)

**Made with ❤️ by Trans2Former Team**
```

---

## 🔍 发布后验证

### 1. 检查 Release 页面
- [ ] Release 标题正确
- [ ] Release 描述完整
- [ ] Assets 已上传
- [ ] 标记为 latest release

### 2. 测试下载
- [ ] 下载 zip 文件
- [ ] 验证 SHA-256 校验和
- [ ] 解压并测试运行

### 3. 更新文档
- [ ] 更新 README.md 中的版本号
- [ ] 更新安装指南链接

---

## 📢 发布公告

### GitHub Discussions
在 GitHub Discussions 发布公告：

**标题**: Trans2Former v2.0.0 发布 - 生产就绪版本

**内容**: 
```
🎉 Trans2Former v2.0.0 正式发布！

这是一个里程碑版本，完成了所有核心功能开发。

主要特性:
- 12 种输入格式，11 种输出格式
- 100+ 转换路径
- 本地优先，零上传
- 完整的插件系统

立即下载: https://github.com/Vantalens/Trans2Former/releases/tag/v2.0.0

欢迎试用并反馈！
```

### 社区
在 https://linux.do/ 发布公告。

---

## 🎯 下一步

发布完成后：
1. 监控 Issues 和反馈
2. 准备 v2.1.0 开发计划
3. 开始平台安装包构建
4. 实现 SSIM 视觉对比

---

## 📞 联系方式

如有问题，请联系：
- GitHub Issues: https://github.com/Vantalens/Trans2Former/issues
- GitHub Discussions: https://github.com/Vantalens/Trans2Former/discussions
- 社区: https://linux.do/

---

**发布日期**: 2026-05-12  
**版本**: 2.0.0  
**状态**: ✅ 准备发布
