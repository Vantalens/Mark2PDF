# Plugin Security Model

版本：v0.2.0
状态：P2 生效
最后更新：2026-05-01

本文定义 Trans2Former 模块插件系统的安全边界。插件可以下载，但文档处理阶段必须本地执行且禁止联网。

## 核心原则

- 插件安装模式可以使用网络，但不得接触用户文档。
- 文档处理模式可以接触用户文档，但必须 `local-only-no-network`。
- 插件不得声明 `remote-api`，不得调用第三方转换 API、云端 OCR、云端转写或云端 AI。
- 插件必须声明权限、资源预算、完整性哈希、安全模式和失败降级路径。
- 本地模型只能作为手动安装、手动启用、可删除的 `local-model-plugin`。
- 默认插件分发采用 GitHub Releases，不自建文档处理或插件分发后端。
- 浏览器端和桌面端必须都有插件下载板块和更新板块，但下载/更新只属于 install mode。

## 两种模式

| 模式 | 允许联网 | 允许接触用户文档 | 允许权限 |
| --- | --- | --- | --- |
| install | 是 | 否 | `install-network`, `cache-plugin` |
| processing | 否 | 是 | `process-document`, `read-assets`, `write-output` |

## GitHub Releases 分发

插件下载服务默认采用 GitHub Releases：

- 下载板块展示插件能力、版本、体积、权限、资源预算和 GitHub Release 链接。
- 更新板块展示当前版本、可更新版本、release notes、权限变化、资源预算变化和回滚入口。
- 浏览器端默认跳转 GitHub Release 页面，由用户下载后本地导入插件包。
- 桌面端可以在 install mode 下打开 GitHub Release 或 release asset，但不得读取当前文档队列。
- 文档处理、编辑、预览和导出阶段不得自动检查、下载或更新插件。
- 插件包导入后必须校验 manifest、兼容版本、SHA-256 和资源预算。

详细规则见 [PLUGIN_DISTRIBUTION.md](PLUGIN_DISTRIBUTION.md)。

## Manifest

机器可读 schema：

```text
docs/plugin-manifest.schema.json
```

运行时策略入口：

```js
import {
  validatePluginManifest,
  assertPluginModeAllows,
  verifyPluginIntegrity,
} from "./core/plugin-policy.js";
```

## 资源预算

| kind | 下载体积上限 | 运行内存上限 |
| --- | ---: | ---: |
| `format-plugin` | 10 MB | 1024 MB |
| `optional-plugin` | 50 MB | 2048 MB |
| `local-model-plugin` | 500 MB | 4096 MB |

超过预算的插件必须拆分、延后或重新归类，不得进入默认核心包。

## 本地模型插件

本地 OCR、layout analysis、table recovery 等能力只能作为可选、本地、可删除插件，不得进入核心包。

适用能力：

- 本地 OCR：扫描 PDF、图片文档、OFD 页面图像。
- 本地版面分析：多栏、页眉页脚、表格区域、图片区域。
- 本地表格恢复：扫描表格、复杂表格边界和单元格合并。
- 本地文本清洗：规则优先，模型只作为可选增强。

禁止能力：

- 云端 OCR、云端转写、云端 AI 总结/改写/增强。
- 第三方转换 API。
- 会上传用户文档、片段、文件名或错误日志的模型能力。

本地模型插件规则：

- kind 必须是 `local-model-plugin` 或明确的 `optional-plugin`。
- 必须手动安装、手动启用、可禁用、可删除。
- 安装模式可以联网下载插件和模型文件，但不能接触用户文档。
- 处理模式可以接触用户文档，但必须禁联网。
- 模型文件不得默认进入 `dependencies`、`public/core` 或 `format-basic`。
- 插件必须声明模型大小、运行内存、推理耗时、缓存位置和失败降级。
- 模型缓存不得保存用户文档内容。

推荐 warning codes：

- `LOCAL_OCR_DISABLED`
- `LOCAL_OCR_MODEL_MISSING`
- `LOCAL_OCR_LOW_CONFIDENCE`
- `LOCAL_LAYOUT_APPROXIMATED`
- `LOCAL_TABLE_RECOVERY_APPROXIMATED`
- `LOCAL_MODEL_RESOURCE_LIMIT`

## 完整性校验

插件 manifest 必须提供：

```json
{
  "integrity": {
    "sha256": "..."
  }
}
```

安装后、处理前必须校验插件代码内容的 SHA-256。校验失败时不得执行插件，必须走 `fallback`。

## 基础格式晋升规则

一个格式从插件晋升到 `format-basic` 必须同时满足：

- 高频、轻量、市场常用。
- 不引入云端能力。
- 默认依赖和核心体积不突破预算。
- 有样例、快照、warnings、质量说明和安全测试。
- 对免下载体验有明确收益。

## 验收

`npm test` 包含 `scripts/plugin-security-test.js`，覆盖 manifest、权限隔离、processing no-network、完整性校验、资源预算和本地模型插件规则。
