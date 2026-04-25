# DocumentModel Schema

版本：v0.1.0  
状态：生效  
最后更新：2026-04-25

## 目标

`DocumentModel` 是 Trans2Former 的统一中间文档模型。所有格式转换都应遵循：

```text
input format -> DocumentModel -> output format
```

## 顶层结构

```json
{
  "schemaVersion": "trans2former.document.v1",
  "title": "document",
  "sourceFormat": "md",
  "blocks": [],
  "assets": [],
  "metadata": {}
}
```

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `schemaVersion` | string | 是 | 当前固定为 `trans2former.document.v1`。 |
| `title` | string | 是 | 文档标题。 |
| `sourceFormat` | string | 是 | 原始输入格式，例如 `md`、`html`、`txt`、`json`、`png`。 |
| `blocks` | array | 是 | 文档正文块。 |
| `assets` | array | 是 | 图片、字体、附件等资源。 |
| `metadata` | object | 是 | 格式特有或转换过程产生的元数据。 |

## Block 类型

### heading

```json
{ "type": "heading", "level": 1, "text": "Title" }
```

### paragraph

```json
{ "type": "paragraph", "text": "Paragraph text" }
```

### list

```json
{ "type": "list", "ordered": false, "items": ["One", "Two"] }
```

### code

```json
{ "type": "code", "language": "js", "code": "console.log('ok')" }
```


### table

```json
{ "type": "table", "headers": ["Name", "Value"], "rows": [["A", "1"]] }
```
### quote

```json
{ "type": "quote", "text": "Quoted text" }
```

### image

```json
{ "type": "image", "src": "image.png", "alt": "Alt", "title": "Title" }
```

### asset

```json
{ "type": "asset", "assetId": "asset-1", "alt": "Alt", "title": "Title" }
```

### raw

```json
{ "type": "raw", "format": "html", "content": "<div>...</div>" }
```

## Asset 结构

```json
{
  "id": "asset-1",
  "name": "image.png",
  "mime": "image/png",
  "data": "data:image/png;base64,...",
  "size": 1234,
  "role": "image"
}
```

## 校验

浏览器端校验入口：

```js
import { validateDocumentModel, assertValidDocumentModel } from "./core/document-schema.js";
```

- `validateDocumentModel(model)` 返回 `{ ok, errors }`。
- `assertValidDocumentModel(model)` 在失败时抛出错误。