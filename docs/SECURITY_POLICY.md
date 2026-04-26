# Trans2Former Security Policy

版本：v0.1.0
状态：生效
最后更新：2026-04-26

## 底线

Trans2Former 的核心转换必须默认在用户设备本地执行。用户文档、图片、音频、转换结果、编辑内容和错误详情默认不得上传、遥测或留存。

## 默认模式

- 默认模式是 `local-only`。
- 浏览器端核心转换只允许使用本地能力：File API、Blob URL、Web Worker、Canvas、WASM、IndexedDB、ZIP/XML/JSON/文本解析。
- 默认不得调用远程转换 API、OCR API、转写 API、分析 SDK、遥测 SDK、外部 URL 抓取或远程字体/脚本。
- Express 服务只托管静态资源和 `/api/health`，不得接收文档内容作为转换请求。

## 远程增强规则

任何远程增强能力都必须满足：

- 默认关闭。
- 用户显式 opt-in。
- 显示将发送的数据类型和用途。
- 用户可取消，取消后必须终止 active Worker、释放 Blob URL、清空旧输出状态并禁用旧下载入口。
- 请求结果可清理。
- 不影响本地转换主路径。

## 错误与诊断

- 错误详情默认只展示 `category`、`code`、`format`、`message`、`warnings`。
- 可能包含用户内容的 raw snippet、source text、stack trace 必须默认隐藏。
- 复制诊断信息不得默认复制用户文档内容。
- 自动测试必须阻止前端引入 `fetch`、`XMLHttpRequest`、`sendBeacon`、`WebSocket` 等网络发送路径。

## 本地缓存

- localStorage、IndexedDB、Cache Storage 只能用于用户明确开启的历史、偏好或离线缓存。
- 必须提供清除入口。
- 默认不得把文档正文、转换结果或错误原文写入持久化存储。
