# 安装指南

## 系统要求

### Windows
- Windows 10 或更高版本（推荐 Windows 11）
- 可用磁盘空间：最少 200MB
- RAM：最少 512MB（推荐 2GB+）

### macOS
- macOS 11 (Big Sur) 或更高版本
- Intel 或 Apple Silicon 处理器

### Linux
- Ubuntu 18.04 LTS 或相当版本
- 需要从源码构建

---

## 方式一：Windows 可执行文件（推荐）

### 下载
1. 前往 [Releases](https://github.com/YOUR_USERNAME/Mark2PDF/releases) 页面
2. 下载最新版本的 `Mark2PDF-x.x.x.exe`

### 运行
1. 双击 `Mark2PDF-x.x.x.exe` 直接运行
2. **无需安装**，第一次启动会自动初始化

### 常见问题

**Q: 弹出"无法验证开发者"的警告？**
- Windows SmartScreen 可能会误报。点击"更多信息"→"仍要运行"

**Q: 应用很慢或崩溃？**
- 确保系统有足够的空闲内存
- 尝试重启应用或电脑

**Q: 能否安装到 U 盘运行？**
- 可以，将 exe 放到 U 盘即可，但首次启动会较慢

---

## 方式二：从源码安装（Web 版本）

### 前置要求
- Node.js 18.0 或更高版本（[下载](https://nodejs.org/)）
- npm 9.0 或更高版本（通常随 Node.js 安装）
- Git（可选，用于克隆项目）

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/YOUR_USERNAME/Mark2PDF.git
cd Mark2PDF
```

或者手动下载并解压 [ZIP 文件](https://github.com/YOUR_USERNAME/Mark2PDF/archive/refs/heads/main.zip)

#### 2. 安装依赖
```bash
npm install
```

#### 3. 安装 Playwright 浏览器
```bash
npx playwright install chromium
```

这一步需要下载 Chromium 浏览器（约 200MB），首次运行需要等待。

#### 4. 启动应用
```bash
npm start
```

输出类似：
```
Server running on http://localhost:3000
请在浏览器中打开该地址
```

#### 5. 打开浏览器
- 自动打开：`http://localhost:3000`
- 手动打开：在浏览器地址栏输入上述地址

### 后台运行

如果需要后台运行服务，可以使用 `nohup` 或 `pm2`：

#### 使用 nohup
```bash
nohup npm start > app.log 2>&1 &
```

#### 使用 pm2（推荐）
```bash
npm install -g pm2
pm2 start "npm start" --name mark2pdf
pm2 save
```

---

## 方式三：Electron 桌面应用（开发者）

### 前置要求
同方式二

### 安装步骤

#### 1. 克隆并安装依赖
```bash
git clone https://github.com/YOUR_USERNAME/Mark2PDF.git
cd Mark2PDF
npm install
npx playwright install chromium
```

#### 2. 开发模式运行
```bash
npm run desktop
```

#### 3. 构建 exe（生产版本）
```bash
npm run dist
```

构建输出在 `dist/` 目录，可直接分发使用。

---

## 卸载

### Windows exe 版本
直接删除 `Mark2PDF-x.x.x.exe` 文件即可，无需卸载程序。

### 清理缓存（可选）
如果需要完全清理应用缓存和配置：
```
删除目录：%APPDATA%\Mark2PDF
```

### Web 版本
删除整个项目文件夹即可。

---

## 升级

### Windows exe 版本
1. 前往 [Releases](https://github.com/YOUR_USERNAME/Mark2PDF/releases) 下载新版本
2. 删除旧的 exe 文件
3. 使用新 exe 即可

### Web 版本
```bash
cd Mark2PDF
git pull origin main     # 或手动下载最新代码
npm install              # 更新依赖
npm start                # 重启应用
```

---

## 故障排除

### 问题：启动时出现 "Cannot find module" 错误

**解决方案**：
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
npx playwright install chromium
npm start
```

### 问题：PDF 生成失败

**可能原因**：
1. Playwright Chromium 未正确安装
2. 输入的 Markdown 包含特殊字符导致解析失败
3. 系统内存不足

**解决方案**：
```bash
# 重新安装 Playwright
npm install --save playwright
npx playwright install chromium
```

### 问题：上传文件后预览空白

**解决方案**：
1. 检查文件是否为有效 Markdown 格式
2. 尝试使用示例 Markdown（点击"加载示例"按钮）
3. 查看浏览器开发者工具的 Console 是否有错误信息（F12）

### 问题：在某些网络环境下无法使用

**解决方案**：
- 确保本地 `http://localhost:3000` 可访问
- 检查防火墙是否阻止了该端口
- 改用桌面 exe 版本（无网络依赖）

### 问题：中文内容显示为方框或乱码

**解决方案**：
1. 确保 Markdown 文件使用 UTF-8 编码保存
2. 清理浏览器缓存（Ctrl+Shift+Delete）
3. 重启应用

---

## 获取帮助

如遇到问题，请：

1. **查阅文档**：[README.md](README.md)
2. **检查 Issues**：[GitHub Issues](https://github.com/YOUR_USERNAME/Mark2PDF/issues)
3. **提交新 Issue**：请包含以下信息：
   - 操作系统和版本
   - 应用版本号
   - 具体问题描述和错误信息截图
   - 复现问题的步骤

---

**最后更新**：2026-04-16