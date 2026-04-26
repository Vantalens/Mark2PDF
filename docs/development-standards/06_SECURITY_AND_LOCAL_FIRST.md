# Security And Local First

版本：v0.1.0  
状态：生效  
最后更新：2026-04-26

## 底线

Trans2Former 的核心转换默认在用户设备上执行。默认不上传、不遥测、不留存用户文档内容。

## 默认禁止

- 默认上传文档、图片、音频、转换结果或错误详情。
- 默认接入远程转换 API、OCR API、转写 API、分析 SDK 或遥测 SDK。
- 默认把用户文档正文写入 localStorage、IndexedDB 或日志。
- 默认加载会向第三方发送用户内容的插件。

## 允许但必须显式 opt-in

- 远程 OCR
- 远程转写
- AI 增强
- 云端增强转换
- 外部资源抓取

这些能力必须满足：

- 默认关闭
- 用户明确触发
- 发送内容可预览或可解释
- 可取消
- 可审计
- 可清除缓存

## 插件安全要求

- 插件 manifest 必须声明 `localOnly`、`remoteCapable`、`networkRequired`。
- local-only 插件不得调用网络 API。
- remote-capable 插件不得默认启用。
- 插件下载只下载代码和资源，不上传用户文件。
- 插件缓存必须可清理。

## 变更记录

- v0.1.0：建立本地优先和插件安全规则。
