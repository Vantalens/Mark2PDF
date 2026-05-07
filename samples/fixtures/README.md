# Public Fixture Index

P4 fixture 分层索引：

| Layer | Purpose | Current regression entry |
| --- | --- | --- |
| basic | 基础格式和最小结构 | `samples/md/`, `samples/csv/`, `samples/json/`, `samples/xml/`, `samples/png/` |
| edge | 表格、链接、metadata、命名空间和边界结构 | `samples/md/table-code.md`, `samples/html/inline-media.html`, `samples/xml/namespace.xml` |
| large | 大文件、渐进预览和资源预算 | `samples/txt/long-lines.txt`, `scripts/p2-responsiveness-test.js` |
| lossy | 可解释降级和 warning 回归 | `samples/png/tiny-red.data-url.txt`, `scripts/p4-p5-p6-test.js` |
| security | 本地优先、禁联网、插件隔离 | `scripts/local-security-test.js`, `scripts/plugin-security-test.js`, `scripts/p4-p5-p6-test.js` |

重格式公开样例当前以可重新生成的程序化 fixture 为主，避免把版权不明的 Office/PDF/OFD 文件放进仓库。新增公开授权文件时必须登记来源、许可、层级和对应快照。
