# AGENTS.md — Name100Women MVP

本文件用于约束 Codex、AI Agent 和开发者在本仓库中的实现行为。  
任何实现不得擅自扩大 MVP 范围。PRD 与 ERD 为产品和数据层面的事实来源。

---

## 1. 项目目标

项目唯一当前目标：

> 尽快上线一个可被 Google 理解、可真实游玩、可记录行为的 Name 100 Women MVP，用于验证 `name100women` 关键词能否获取流量。

优先级：

```text
正确的名字验证
> 流畅的输入与计时
> SEO可索引
> 数据可分析
> 视觉装饰
> 未验证的未来扩展
```

---

## 2. 已确定技术栈

- React Router Framework Mode
- React
- TypeScript
- Vite
- Cloudflare Vite Plugin
- Cloudflare Workers
- Cloudflare D1
- Drizzle ORM + Drizzle Kit
- Cloudflare KV
- Zod
- Tailwind CSS
- GA4
- Microsoft Clarity

不得未经明确决策替换为：

- Next.js
- TanStack Start
- Astro
- Prisma
- Supabase
- Firebase
- 独立 Node.js Server

---

## 3. MVP路由

必须实现：

```text
/
 /how-it-works
 /privacy
 /terms
 /contact
 /sitemap.xml
 /robots.txt
 /api/game/start
 /api/game/guess
 /api/game/end
 404
```

不得自行新增：

- `/leaderboard`
- `/stats`
- `/rules`
- `/blog`
- `/women/*`
- `/games/*`
- `/about`
- 登录、支付或管理后台页面

---

## 4. 核心业务规则

### 游戏

- Session 创建时不开始计时；
- 第一位有效人物被服务端接受时开始计时；
- 前端计时仅用于显示；
- 服务端时间是最终权威；
- 达到100个不同有效 QID 自动完成；
- 玩家可 Give Up；
- 刷新不恢复游戏；
- 同一 QID 一局只能接受一次。

### 有效人物

必须：

- 对应真实人物；
- 可靠公开数据识别为女性；
- 至少有一个 Wikipedia sitelink；
- 可以是已故或在世人物；
- 可以使用本名、艺名或公开别名。

不接受：

- 虚构人物；
- 非人物实体；
- 无法唯一确定的人物；
- 已接受过的同一 QID。

---

## 5. 验证顺序

必须严格按以下边界实现：

```text
Zod 请求验证
→ 输入标准化
→ Session 与限流
→ 精确人工覆盖
→ QID人工覆盖
→ KV
→ D1
→ Wikipedia 实体发现
→ Wikidata 结构化判断
→ QID重复检查
→ D1写入
→ KV写入
→ 响应
```

Wikipedia 负责实体发现和重定向。  
Wikidata 负责人物属性和唯一 QID。  
不得使用 LLM 作为实时核心验证器。

---

## 6. 代码边界

```text
Route
- HTTP 请求和响应
- Zod parse
- 状态码
- 获取 Cloudflare bindings

Service
- 游戏和名字验证业务规则
- 流程编排

Repository
- D1 数据读写
- Drizzle 查询

External Client
- Wikipedia
- Wikidata
- 超时和响应 Schema

Shared
- Zod Schemas
- 类型
- 枚举
- 常量
```

禁止：

- 在 React 组件中直接访问 D1；
- 在 Route 文件中堆积完整验证逻辑；
- 在 Repository 中加入产品判定规则；
- 浏览器直接调用 Wikipedia 或 Wikidata；
- 信任前端提交的 QID、计时或 accepted 状态。

---

## 7. 数据规则

- Wikidata QID 是人物唯一业务标识；
- `person_aliases.normalized_alias` 不得全局唯一；
- 同一别名可能对应多个 QID；
- `game_guesses` 必须保留 DUPLICATE 和失败记录；
- 使用部分唯一索引保证一局一个 QID 只能有一个 ACCEPTED；
- 人工覆盖优先级最高；
- KV 不是唯一事实来源；
- 删除 KV 后系统仍应可运行。

---

## 8. API状态

统一使用：

```text
ACCEPTED
DUPLICATE
NOT_FOUND
NOT_A_PERSON
NOT_A_WOMAN
FICTIONAL
AMBIGUOUS
TEMPORARY_ERROR
INVALID_REQUEST
RATE_LIMITED
SESSION_NOT_FOUND
GAME_FINISHED
```

第三方 API 失败必须返回 `TEMPORARY_ERROR`，不得错误返回 `NOT_FOUND` 或 `NOT_A_WOMAN`。

---

## 9. 隐私与分析

### GA4

可发送游戏行为和进度。  
不得发送：

- raw_input
- normalized_input
- 人物姓名
- QID
- IP
- Cookie token

### Clarity

用于行为和界面观察。

### D1

可保存 Guess 输入，用于验证准确性分析。Privacy 页面必须说明。

---

## 10. SEO要求

首页必须 SSR 输出：

- Title
- Meta Description
- Canonical
- Open Graph
- 可索引正文
- FAQ JSON-LD
- WebApplication 或 Game JSON-LD

游戏输入框必须在首屏。  
不得将所有未知路由返回 HTTP 200。  
不得把 API、测试页、参数页放入 sitemap。

---

## 11. 性能原则

- KV 命中优先；
- D1 查询必须有索引；
- 外部 API 设置 3–5 秒超时；
- 最多有限重试一次；
- 游戏列表不加载人物头像；
- 第三方分析脚本不得阻塞核心输入；
- 移动端优先检查软键盘与焦点。

---

## 12. 开发顺序

必须按以下顺序推进：

```text
P0 工程与Cloudflare环境
P1 D1 Schema、Migration、Seed
P2 Session与服务端计时
P3 名字验证链路
P4 首页游戏交互
P5 静态页面与SEO
P6 GA4、Clarity和内部事件
P7 异常、限流、缓存回退
P8 测试、预发布冒烟和上线验收
```

不得先开发排行榜、新模式或视觉动效。

---

## 13. 每阶段必须输出

每个开发阶段结束时，Agent 应输出：

1. 已完成内容；
2. 修改文件；
3. 关键实现决策；
4. 执行过的命令；
5. 测试结果；
6. 未完成或风险；
7. 下一阶段入口条件。

不得仅回复“完成”。

---

## 14. 必须执行的检查

上线前至少执行：

```text
lint
typecheck
unit tests
integration tests
build
D1 migration dry-run / preview
Cloudflare preview deployment
关键路由 HTTP 检查
移动端交互冒烟
SEO meta 与 sitemap 检查
```

必须验证：

- 第一位有效答案才开始计时；
- 同 QID 重复不计分；
- 第100位自动完成；
- Give Up 正常；
- Wikipedia/Wikidata超时返回 TEMPORARY_ERROR；
- KV 缺失可回退 D1；
- 未知路由返回404；
- GA4不发送姓名。

---

## 15. 禁止过度建设

除非 PRD 被明确更新，不得实现：

- 登录；
- 用户资料；
- 支付；
- 排行榜；
- 公共统计；
- 多模式；
- Daily Challenge；
- 分享图片服务；
- 人物详情页；
- Blog；
- Admin UI；
- 完整 Wikidata 数据导入；
- LLM 人物判定；
- Durable Objects；
- Queues；
- R2。

允许为未来保留清晰边界，但不得为未来功能编写大量未使用代码。

---

## 16. 事实来源优先级

发生冲突时按以下优先级处理：

```text
最新明确用户决策
> PRD.md
> ERD.md
> AGENTS.md
> 代码注释
> Agent自行推断
```

若业务规则不明确，选择最小实现，不擅自扩展产品范围。
