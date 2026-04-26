# Trans2Former Documentation

本目录用于承载开发期的产品、架构、格式、质量和安全文档。根目录文档只保留入口、安装、贡献和任务状态；长期原则和专题设计统一放在这里。

## 推荐阅读顺序

1. [PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md)：产品边界、市场路线、差异化亮点和数据安全底线。
2. [FORMAT_ROADMAP.md](FORMAT_ROADMAP.md)：格式覆盖矩阵、格式优先级和建议执行顺序。
3. [DOCUMENT_MODEL_SCHEMA.md](DOCUMENT_MODEL_SCHEMA.md)：`DocumentModel` 的结构说明。
4. [CONVERSION_POLICY.md](CONVERSION_POLICY.md)：不可逆转换、降级和 warnings 策略。
5. [SECURITY_POLICY.md](SECURITY_POLICY.md)：本地优先、安全模式、远程增强 opt-in 规则。
6. [RESOURCE_BUDGET.md](RESOURCE_BUDGET.md)：核心包体积、依赖和重格式插件化边界。
7. [DYNAMIC_CHUNKING_MERGE_DESIGN.md](DYNAMIC_CHUNKING_MERGE_DESIGN.md)：超大单文件动态分块与结构化合并设计。
8. [development-standards/00_README.md](development-standards/00_README.md)：开发规范体系，覆盖文档、流程、AI 协作、质量门禁和成本资源治理。

## 文档职责

| 文档 | 职责 |
| --- | --- |
| [../README.md](../README.md) | 项目入口、当前能力、运行和验证方式 |
| [../DEVELOPMENT_TASKS.md](../DEVELOPMENT_TASKS.md) | 当前任务看板、阶段状态、下一步开发顺序 |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | 贡献规则、开发约束、测试要求 |
| [../INSTALL.md](../INSTALL.md) | 安装、运行、验证、故障排除 |
| [../COMMIT_CHECKLIST.md](../COMMIT_CHECKLIST.md) | 提交前检查 |
| [../CHANGELOG.md](../CHANGELOG.md) | 已发生的变更记录 |
| [development-standards/00_README.md](development-standards/00_README.md) | 开发规范、任务流程、质量门禁和成本资源治理 |

## 维护规则

- 新增长期产品原则、架构决策或格式规划时，优先更新 `docs/` 专题文档。
- `DEVELOPMENT_TASKS.md` 只记录可执行任务，不堆放长篇背景说明。
- README 只保留用户和开发者快速入口，不复制完整路线图。
- 修改支持格式、安全边界、资源预算、测试命令或运行方式时，同步更新相关专题文档和任务看板。
- 模块化插件、热门基础格式免下载、按需下载、资源治理等开发规则统一维护在 `docs/development-standards/`。
