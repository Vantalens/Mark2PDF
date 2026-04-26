# Documentation Rules

版本：v0.1.0  
状态：生效  
最后更新：2026-04-26

## 目标

让开发文档可执行、可追踪、可维护，避免 README、tasks、架构文档互相复制导致版本漂移。

## 文档分层

| 层级 | 位置 | 职责 |
| --- | --- | --- |
| 项目入口 | `README.md` | 当前能力、运行方式、核心链接 |
| 任务看板 | `DEVELOPMENT_TASKS.md` | 阶段状态、下一步任务、完成归档 |
| 开发规范 | `docs/development-standards/` | 文档、流程、AI 协作、门禁、插件治理 |
| 产品架构 | `docs/PRODUCT_STRATEGY.md`、`docs/FORMAT_ROADMAP.md`、`docs/RESOURCE_BUDGET.md` | 长期方向和专题设计 |
| 变更记录 | `CHANGELOG.md` | 已发生的用户可见和开发者可见变化 |

## 写作规则

- 使用 Markdown，标题最多到三级。
- 每份规范文档必须包含版本、状态、最后更新。
- 需求写“目标、范围、验收”，设计写“输入、处理、输出”，规则写“条件、行为、结果”。
- 避免“尽量、适当、可能”等无法验收的表述；如必须使用，要给出判断标准。
- 不在文档中记录真实密钥、令牌、私有凭据或用户内容样本。

## 命名规则

- 规范文档使用两位序号：`00_README.md`、`01_DOCUMENTATION_RULES.md`。
- 长期专题文档使用全大写英文名：`PRODUCT_STRATEGY.md`。
- 机器可读 schema 可使用小写文件名，例如 `document-model.schema.json`。

## 更新规则

- 新增长期原则：更新对应 `docs/` 专题文档，不堆入 `DEVELOPMENT_TASKS.md`。
- 新增任务：更新 `DEVELOPMENT_TASKS.md`，任务必须可执行、可验证。
- 新增依赖、插件、格式或加载路径：同步更新资源预算、格式路线和质量门禁。
- 每次开发结束：更新 `DEVELOPMENT_TASKS.md`，必要时更新 `CHANGELOG.md`。

## 变更记录

- v0.1.0：建立 Trans2Former 文档分层与写作规则。
