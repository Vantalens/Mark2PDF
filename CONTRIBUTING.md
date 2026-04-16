# 贡献指南

感谢你有兴趣为 Mark2PDF 做出贡献！本指南将帮助你快速上手。

## 行为准则

请遵守 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。简而言之：
- 以尊重和包容的态度对待所有人
- 接受建设性的批评
- 关注对社区最有利的事
- 尊重他人的隐私

## 我如何开始？

### 报告 Bug

1. **检查现有 Issues**：[GitHub Issues](https://github.com/YOUR_USERNAME/Mark2PDF/issues)
2. **创建新 Issue**，请包含：
   - 清晰的标题和描述
   - 操作系统、Node.js 版本、应用版本
   - 复现问题的精确步骤
   - 实际结果 vs 预期结果
   - 错误日志或截图

### 建议功能

1. 在 [Issues](https://github.com/YOUR_USERNAME/Mark2PDF/issues) 中搜索类似建议
2. 如果不存在，创建新 Issue，标题格式：`[功能请求] 功能描述`
3. 详细说明：
   - 为什么需要这个功能
   - 它如何解决问题
   - 可能的实现方式

### 代码贡献

#### 1. Fork 项目

在 GitHub 上点击 "Fork" 按钮创建你的副本。

#### 2. 克隆本地

```bash
git clone https://github.com/YOUR_USERNAME/Mark2PDF.git
cd Mark2PDF
```

#### 3. 创建特性分支

```bash
git checkout -b feature/description
```

分支命名规范：
- `feature/add-dark-theme` - 新功能
- `bugfix/fix-formula-wrap` - bug 修复
- `docs/update-readme` - 文档更新
- `refactor/optimize-renderer` - 代码重构

#### 4. 安装依赖并运行

```bash
npm install
npx playwright install chromium
npm start              # 或 npm run desktop 开发模式
```

#### 5. 进行修改

确保你的代码：
- 遵循现有的代码风格
- 包含适当的注释
- 有清晰的提交信息

#### 6. 本地测试

```bash
# 测试 Web 版本
npm start

# 测试桌面版本
npm run desktop

# 构建生产版本
npm run dist
```

测试清单：
- [ ] 新功能正常工作
- [ ] 没有破坏现有功能
- [ ] UI 界面正确显示
- [ ] 中文、公式、代码都正确渲染

#### 7. 提交更改

```bash
git add .
git commit -m "feat: 添加新功能描述"
git push origin feature/description
```

提交信息格式（[Conventional Commits](https://www.conventionalcommits.org/)）：
- `feat: 新功能描述`
- `fix: bug 修复描述`
- `docs: 文档更新`
- `style: 代码风格调整`
- `refactor: 代码重构`
- `perf: 性能优化`
- `test: 添加测试`
- `chore: 项目维护`

#### 8. 创建 Pull Request

1. 前往 GitHub 上的原始项目
2. 点击 "New Pull Request"
3. 选择你的分支
4. 填写 PR 描述：
   - 修复或实现的内容
   - 关联的 Issue（如适用）
   - 测试说明
   - 可能的影响范围

5. 等待审查和反馈

### PR 审查流程

- 代码审查：确保质量和风格一致
- CI 检查：自动测试和 linting
- 反馈：维护者可能会要求修改
- 合并：通过审查后合并到 main

---

## 项目结构

```
Mark2PDF/
├── public/                 # Web 前端
│   ├── index.html         # 主 HTML 页面
│   ├── app.js             # 前端应用逻辑
│   └── styles.css         # UI 样式表
├── src/                   # 后端代码
│   ├── web-server.js      # Express 服务器
│   ├── renderer.js        # Markdown/PDF 渲染引擎
│   ├── electron-main.js   # Electron 主进程
│   └── template.css       # PDF 文档样式
├── dist/                  # 构建输出（忽略）
├── package.json           # 项目元数据
├── README.md              # 项目概述
├── CHANGELOG.md           # 版本历史
├── INSTALL.md             # 安装指南
├── CONTRIBUTING.md        # 本文件
└── LICENSE                # MIT 许可证
```

---

## 开发工作流

### 新功能开发示例

假设你想添加"导出为 HTML"功能：

1. **规划**
   - 在 Issues 中讨论设计
   - 确定必要的改动

2. **实现**
   ```bash
   git checkout -b feature/export-html
   # 修改 src/renderer.js 添加 HTML 导出函数
   # 修改 public/app.js 添加按钮和处理逻辑
   # 修改 public/index.html 添加下载按钮
   ```

3. **测试**
   ```bash
   npm start
   # 测试新功能是否工作
   ```

4. **提交**
   ```bash
   git add .
   git commit -m "feat: 添加 HTML 导出功能"
   git push origin feature/export-html
   ```

5. **创建 PR**
   - 标题：`Add HTML export feature`
   - 描述：说明功能和用途

### Bug 修复示例

假设你要修复"公式换行"问题：

1. **创建分支**
   ```bash
   git checkout -b bugfix/formula-wrap-issue
   ```

2. **修复**
   ```
   # 修改 src/template.css 中的 .katex-display 样式
   ```

3. **测试**
   ```bash
   npm run dist
   # 测试长公式是否正确换行
   ```

4. **提交**
   ```bash
   git add .
   git commit -m "fix: 修复长公式无法换行的问题"
   git push origin bugfix/formula-wrap-issue
   ```

---

## 代码风格

### JavaScript
- 使用 ES6+ 语法
- 使用有意义的变量名
- 函数应该有 JSDoc 注释
- 回调使用 async/await 而非传统回调

示例：
```javascript
/**
 * 渲染 Markdown 为 HTML
 * @param {string} markdown - Markdown 源文本
 * @returns {Promise<string>} 渲染后的 HTML
 */
async function renderMarkdown(markdown) {
  // 实现
}
```

### CSS
- 使用有意义的类名
- 遵循 BEM 命名规范（如适用）
- 使用 CSS 变量管理颜色和间距
- 注释复杂样式

### HTML
- 语义化标签
- 无障碍属性（aria-label 等）
- 清晰的嵌套结构

---

## 测试建议

虽然本项目目前没有自动化测试套件，但贡献者应该手工测试：

### 功能测试
- [ ] 上传 Markdown 文件
- [ ] 预览是否正确
- [ ] 生成 PDF
- [ ] 下载 PDF
- [ ] 快捷键 Ctrl+S

### 格式测试
- [ ] 标题、列表、表格
- [ ] 代码块（多种语言）
- [ ] 行内和块级公式
- [ ] 中英文混排
- [ ] 特殊符号

### 兼容性测试
- [ ] Windows 10/11
- [ ] 不同浏览器（Chrome, Firefox, Safari）
- [ ] 大型文件（>1MB Markdown）
- [ ] 特殊字符文件名

---

## 文档更新

如果你发现文档错误或改进点：

1. 修改相应的 `.md` 文件
2. 确保格式清晰、语法正确
3. 提交 PR

文档文件：
- `README.md` - 项目概述
- `INSTALL.md` - 安装指南
- `CHANGELOG.md` - 版本历史
- `CONTRIBUTING.md` - 本文件

---

## 获取帮助

- **讨论**：在 Issues 中提问
- **Chat**：查看社区讨论
- **邮件**：联系维护者

---

## 许可证

通过提交贡献，你同意你的贡献将在 MIT License 下发布。

---

感谢你为 Mark2PDF 的贡献！🎉

**最后更新**：2026-04-16