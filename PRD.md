# Name100Women MVP 产品需求文档（PRD）

- 项目名称：Name 100 Women
- 域名：`https://name100women.top`
- 联系邮箱：`support@name100women.top`
- 文档版本：v1.0
- 产品阶段：MVP
- 目标运行环境：Cloudflare Workers
- 默认语言：English
- 文档用途：产品、设计、前端、后端、测试和上线验收统一依据

---

## 1. 项目背景

`name100women` 是一个围绕 “Can you name 100 women?” 挑战形成的搜索关键词。现阶段项目不追求建设完整游戏平台、百科内容站或社区，而是快速上线一个真正可玩的英文游戏页面，验证该关键词能否获得：

1. Google 自然搜索曝光；
2. 搜索点击；
3. 真实游戏开始行为；
4. 持续输入和完成行为；
5. 分享或重复游玩行为。

MVP 的所有功能和技术投入均需服从“尽快上线并验证流量”这一目标。

---

## 2. MVP目标

### 2.1 核心目标

建立以下最短闭环：

```text
Google 搜索
→ 进入首页
→ 理解玩法
→ 输入女性姓名
→ 后端验证
→ 持续挑战
→ 完成或主动结束
→ 查看并复制结果
→ 记录完整行为数据
```

### 2.2 MVP需要回答的问题

#### 搜索层

- Google 是否收录首页？
- `name100women` 及相关查询是否产生曝光？
- 搜索结果是否产生点击？
- 首页排名是否有持续改善的可能？

#### 产品层

- 用户进入首页后是否会开始游戏？
- 验证速度和准确性是否足以支持连续输入？
- 用户平均能输入多少位女性？
- 用户主要在哪个进度退出？
- 用户是否愿意复制结果或再次游玩？

#### 技术层

- Wikipedia 与 Wikidata 的实时验证是否稳定？
- 本地缓存能否显著降低外部请求？
- 哪些人物经常被误判、未识别或判定为模糊？
- Cloudflare Workers、D1 和 KV 是否足以承载早期流量？

---

## 3. 非目标

MVP 阶段明确不做：

- 用户注册和登录；
- 支付、会员和积分；
- 公共排行榜；
- 公共统计页面；
- Daily Challenge；
- Fictional Women 模式；
- 音乐、体育、科学等分类模式；
- 多语言；
- 动态公开结果 URL；
- 服务端生成分享图片；
- 人物百科详情页；
- Blog 内容体系；
- About 独立页面；
- 完整管理后台；
- 广告系统；
- 移动 App；
- 完整 Wikidata 离线副本。

---

## 4. 目标用户

### 4.1 主要用户

- 在 Google 搜索 `name100women`、`name 100 women game` 等关键词的用户；
- 从 X、TikTok、Twitch、YouTube 或其他社交平台看到挑战后寻找可玩版本的用户；
- 喜欢 Trivia、Quiz、Memory Challenge 和 Speedrun 的用户。

### 4.2 次要用户

- 主播和内容创作者；
- 课堂、团队活动和女性历史相关活动参与者；
- 希望了解游戏如何验证人物的用户。

---

## 5. 产品定位

### 5.1 产品描述

Name 100 Women 是一个无需注册、打开即可游玩的计时记忆挑战。玩家输入真实女性的姓名，系统通过本地缓存、Wikipedia 和 Wikidata 完成验证。每个真实人物在一局中只能计分一次。

### 5.2 核心价值

- 打开即玩；
- 规则明确；
- 验证结果可解释；
- 输入反馈快速；
- 结果可复制和分享；
- 不强制登录。

### 5.3 推荐首页核心文案

```text
Can You Name 100 Women?

Type the names of 100 real women.
No repeats. The timer starts after your first correct answer.
```

---

## 6. MVP页面范围

### 6.1 必须上线页面

| 路由 | 页面职责 | 是否索引 |
|---|---|---:|
| `/` | 游戏、SEO主落地页、规则、FAQ、挑战介绍 | 是 |
| `/how-it-works` | 解释名字验证与数据来源 | 是 |
| `/privacy` | 隐私政策 | 是 |
| `/terms` | 使用条款 | 是 |
| `/contact` | 联系与误判反馈方式 | 是 |
| `/sitemap.xml` | 搜索引擎站点地图 | 不适用 |
| `/robots.txt` | 爬虫规则 | 不适用 |
| `404` | 未找到页面 | 否 |

### 6.2 首页内容顺序

```text
Header
Hero
Game Area
Compact Rules
How to Play
What Counts as a Valid Answer
How Names Are Verified
FAQ
Challenge Background
Footer
```

首屏必须看到游戏输入框。长正文不得出现在游戏区域之前。

### 6.3 暂不建立独立 Rules 页面

MVP 规则放在首页，详细验证机制放在 `/how-it-works`。

后续仅在以下信号出现后新增 `/rules`：

- 首页规则内容过长；
- 用户频繁询问边界规则；
- GSC 出现稳定规则型查询；
- 新增第二种游戏模式。

---

## 7. 核心游戏流程

```text
用户进入首页
→ 页面初始化匿名游戏 Session
→ 输入第一位女性姓名
→ 提交至服务端
→ 服务端验证成功
→ 服务端写入 started_at
→ 前端开始显示计时
→ 玩家继续输入
→ 达到 100 位自动完成
或
→ 点击 Give Up 主动结束
→ 展示结果
→ Copy Result / Share Result / Play Again
```

---

## 8. 游戏规则

### 8.1 有效人物规则

一个答案被接受，需满足：

1. 能够唯一对应到一个 Wikidata 实体；
2. 实体属于真实人物；
3. 可靠公开数据将该人物识别为女性；
4. 至少存在一个 Wikipedia 语言版本页面；
5. 该 Wikidata QID 尚未在当前游戏中被接受；
6. 输入可以是本名、艺名或可靠公开别名；
7. 在世和已故女性均可接受；
8. 不额外引入主观“知名度”评分。

### 8.2 无效答案

以下答案不接受：

- 虚构人物；
- 非人物实体；
- 不符合游戏女性人物规则的实体；
- 无法找到公开人物记录；
- 无法唯一确定具体人物；
- 当前游戏已提交过的同一 QID；
- 明显无意义、过长或格式非法的输入。

### 8.3 同名和模糊输入

系统不能可靠确定具体人物时返回 `AMBIGUOUS`，要求玩家输入完整姓名。

MVP 不展示自动补全，也不提供候选人物选择弹窗，以免泄露答案并增加复杂度。

### 8.4 女性身份判定

产品规则文案使用：

> A person counts when reliable public data, such as Wikidata or Wikipedia, identifies them as a woman.

不得使用“biological female only”等狭窄或冒犯性规则。

技术实现应允许人工覆盖第三方数据缺失或错误。

---

## 9. 计时规则

| 场景 | 规则 |
|---|---|
| 页面加载 | 不开始计时 |
| Session 创建 | 不开始计时 |
| 第一位有效人物被服务端接受 | 开始计时 |
| 名字验证请求进行中 | 继续计时 |
| 切换浏览器标签 | 继续计时 |
| 达到 100 位 | 自动停止 |
| 点击 Give Up | 停止 |
| 刷新页面 | 当前局结束，不恢复 |
| 关闭页面 | 当前局后续标记为 abandoned |

前端计时器仅用于显示；最终游戏时长必须由服务端时间计算。

---

## 10. 输入体验

### 10.1 基本要求

- 页面打开后输入框自动聚焦；
- 支持 Enter 提交；
- 不显示自动补全；
- 同一时间仅允许一个提交请求；
- 请求结束后输入框清空并重新聚焦；
- 验证期间不能重复提交相同请求；
- 移动端键盘不得遮挡核心进度和反馈；
- 网络异常时保留原输入并允许重试。

### 10.2 输入约束

- 去除首尾空格；
- 合并连续空格；
- Unicode 标准化；
- 最大长度建议 100 字符；
- 空输入禁止提交；
- 过长或非法请求返回 `INVALID_REQUEST`。

---

## 11. 名字验证架构

### 11.1 总体策略

采用：

> 人工覆盖优先 + 本地预热库与缓存 + Wikipedia 实体发现 + Wikidata 结构化判断 + 按需沉淀。

### 11.2 验证顺序

```text
1. Zod 验证请求结构
2. 标准化输入
3. 检查游戏 Session
4. 基础限流
5. 查询人工覆盖
6. 查询 KV alias/person 缓存
7. 查询 D1 alias/person 数据
8. Wikipedia 精确标题/重定向查询
9. Wikipedia 搜索少量候选
10. 获取 Wikidata QID
11. Wikidata 判断 human、woman、sitelink 等属性
12. 检查本局 QID 重复
13. 写入 person / alias / cache
14. 写入 guess 记录
15. 返回标准状态
```

### 11.3 Wikipedia 职责

- 识别用户想表达的人；
- 处理页面标题和重定向；
- 提供关联 Wikidata QID；
- 提供标准标题和简短公开描述。

### 11.4 Wikidata 职责

- 判断实体是否为真实人物；
- 判断是否符合女性人物规则；
- 提供稳定唯一 QID；
- 判断是否存在 Wikipedia sitelink；
- 支持 QID 级重复判断。

### 11.5 本地数据职责

- 加速高频人物验证；
- 保存人物和别名；
- 保存人工覆盖；
- 减少第三方 API 波动影响；
- 记录真实用户中的高频未识别输入。

---

## 12. 预热人物库

### 12.1 规模

MVP 上线前预热 500–1,000 位高频女性人物。

### 12.2 覆盖领域

- Music
- Film and Television
- Sports
- Politics
- History
- Science
- Literature
- Royalty
- Business
- Internet and Social Media

### 12.3 最小字段

- Wikidata QID；
- 标准英文名；
- 标准化名称；
- 常见别名；
- 简短描述；
- Wikipedia 标题；
- 验证状态；
- 最后更新时间。

预热库的目标是减少首批请求延迟，不是建设百科数据库。

---

## 13. 服务端返回状态

### 13.1 业务状态

| 状态 | 含义 | HTTP建议 |
|---|---|---:|
| `ACCEPTED` | 有效且首次提交 | 200 |
| `DUPLICATE` | 同一 QID 已接受 | 200 |
| `NOT_FOUND` | 未找到可靠人物 | 200 |
| `NOT_A_PERSON` | 匹配实体不是人物 | 200 |
| `NOT_A_WOMAN` | 不符合游戏规则 | 200 |
| `FICTIONAL` | 虚构人物 | 200 |
| `AMBIGUOUS` | 无法唯一确定 | 200 |
| `TEMPORARY_ERROR` | 第三方服务或内部临时异常 | 503 |
| `INVALID_REQUEST` | 请求格式非法 | 400 |
| `RATE_LIMITED` | 请求过于频繁 | 429 |
| `SESSION_NOT_FOUND` | Session 无效或不存在 | 404 |
| `GAME_FINISHED` | 游戏已结束 | 409 |

### 13.2 前端提示

| 状态 | 英文提示 |
|---|---|
| `ACCEPTED` | Accepted |
| `DUPLICATE` | You already named her. |
| `NOT_FOUND` | We couldn't find this person. |
| `NOT_A_PERSON` | This entry does not appear to be a person. |
| `NOT_A_WOMAN` | This person does not match the game rules. |
| `FICTIONAL` | Fictional characters do not count. |
| `AMBIGUOUS` | Try entering her full name. |
| `TEMPORARY_ERROR` | We couldn't verify this name right now. Try again. |
| `RATE_LIMITED` | You're submitting too quickly. Please wait a moment. |

---

## 14. 游戏进度与结束

### 14.1 进度展示

必须展示：

- `X / 100`；
- 当前用时；
- 已接受人物列表；
- 最近一次验证反馈。

可在 10、25、50、75、90 位时提供轻量里程碑反馈。

### 14.2 自动完成

第 100 个不同有效 QID 被接受后：

- 服务端设置 `completed_at`；
- Session 状态改为 `completed`；
- 停止计时；
- 返回最终服务端时长；
- 前端切换到结果视图。

### 14.3 Give Up

玩家可主动点击 `Give Up`。

要求：

- 使用次要按钮样式；
- 结束前可使用轻量确认；
- 服务端写入 `ended_at`；
- Session 状态改为 `gave_up`；
- 展示最终结果。

---

## 15. 结果视图

MVP 不建立独立公开结果 URL。

### 15.1 必须展示

- `You named X women`；
- 总用时；
- 错误或未接受次数；
- 完成状态；
- `Copy Result`；
- 支持时显示 `Share Result`；
- `Play Again`。

### 15.2 分享文案

完成示例：

```text
I named 100 women in 18:42.

Can you beat my time?

https://name100women.top
#Name100Women
```

未完成示例：

```text
I named 54 women before giving up.

How many can you name?

https://name100women.top
#Name100Women
```

不得在分享文案中公开玩家具体输入列表。

---

## 16. API需求

### 16.1 `POST /api/game/start`

职责：

- 创建匿名 Session；
- 返回 `sessionId`；
- 初始状态为 `not_started`；
- 不启动计时。

请求可为空或仅包含允许的匿名客户端信息。

### 16.2 `POST /api/game/guess`

请求：

```json
{
  "sessionId": "uuid",
  "name": "Marie Curie"
}
```

成功返回示例：

```json
{
  "status": "ACCEPTED",
  "person": {
    "qid": "Q7186",
    "name": "Marie Curie",
    "description": "Polish and French physicist and chemist"
  },
  "progress": {
    "correct": 18,
    "target": 100
  },
  "game": {
    "status": "in_progress",
    "startedAt": "ISO-8601 timestamp",
    "durationMs": 105000
  }
}
```

服务端必须自行决定 QID 和是否接受。前端不能提交 `accepted: true` 或自行指定可信 QID。

### 16.3 `POST /api/game/end`

请求：

```json
{
  "sessionId": "uuid",
  "action": "GIVE_UP"
}
```

职责：

- 验证 Session；
- 结束游戏；
- 返回最终服务端时长和统计。

---

## 17. 技术架构

### 17.1 确定选型

- Framework：React Router Framework Mode
- Frontend：React + TypeScript
- Build：Vite
- Cloudflare Integration：Cloudflare Vite Plugin
- Runtime：Cloudflare Workers
- Database：Cloudflare D1
- ORM：Drizzle ORM + Drizzle Kit
- Cache：Cloudflare KV
- Runtime Validation：Zod
- Styling：Tailwind CSS
- Analytics：GA4 + Microsoft Clarity + D1 internal events

### 17.2 模块职责

```text
Route
→ 负责 HTTP 输入输出、状态码和响应头

Service
→ 负责业务规则和验证流程

Repository
→ 负责 D1 数据访问

External Client
→ 负责 Wikipedia / Wikidata 调用

Schema
→ Zod 负责运行时输入与外部响应验证

KV
→ 高频验证和短期失败缓存

D1
→ 永久人物数据、游戏数据和人工覆盖
```

### 17.3 建议目录

```text
app/
├── components/
│   ├── game/
│   └── layout/
├── routes/
├── server/
│   ├── db/
│   ├── repositories/
│   ├── services/
│   ├── external/
│   └── security/
├── shared/
│   ├── schemas/
│   ├── types/
│   └── constants/
└── styles/
```

---

## 18. 缓存策略

| 数据类型 | 存储 | 建议策略 |
|---|---|---|
| 人工覆盖 | D1 + KV | 长期有效 |
| 成功人物验证 | D1 + KV | KV 30–90 天，D1 永久 |
| Alias → QID | D1 + KV | KV 30–90 天 |
| `NOT_FOUND` | KV | 6–24 小时 |
| `AMBIGUOUS` | KV 可选 | 短期或不缓存 |
| `TEMPORARY_ERROR` | 不缓存或数分钟 | 不得长期缓存 |
| 游戏 Session | D1 | 永久或按数据策略清理 |
| 当前局 QID | D1 | 当前 Session 生命周期 |

KV 绑定缺失时，应用应允许回退到 D1，而不是完全不可用。

---

## 19. 限流与基础安全

### 19.1 限流目标

- 防止脚本高频调用外部验证；
- 防止单 Session 并发提交；
- 防止恶意制造大量 D1 写入。

### 19.2 基本措施

- 输入最大长度；
- Zod 运行时校验；
- 按 IP 哈希和 Session 组合限流；
- 同一 Session 串行 Guess；
- 外部 API 超时；
- 外部 API 最多一次有限重试；
- 不信任前端计时和 QID；
- 所有 SQL 通过 Drizzle 参数化；
- 不在 GA4 中发送用户输入的人名；
- 不将原始 IP 作为公开或长期业务标识。

---

## 20. SEO需求

### 20.1 首页

必须服务端输出：

- 唯一 Title；
- Meta Description；
- Canonical；
- Open Graph；
- Twitter Card；
- 可索引正文；
- FAQ JSON-LD；
- WebApplication 或 Game JSON-LD。

推荐 Title：

```text
Name 100 Women Game – Can You Name 100 Women?
```

### 20.2 核心关键词

- name100women
- name 100 women
- name 100 women game
- can you name 100 women
- name 100 women challenge
- 100 women challenge
- name a woman game

### 20.3 Sitemap

仅包含：

- `/`
- `/how-it-works`
- `/privacy`
- `/terms`
- `/contact`

### 20.4 Robots

示例：

```text
User-agent: *
Allow: /

Disallow: /api/
Disallow: /admin/

Sitemap: https://name100women.top/sitemap.xml
```

### 20.5 404

- 返回真实 HTTP 404；
- 不得将未知路由全部以 200 返回首页；
- 提供返回游戏入口。

---

## 21. 数据分析

### 21.1 GA4事件

- `game_view`
- `game_started`
- `first_valid_guess`
- `progress_10`
- `progress_25`
- `progress_50`
- `progress_75`
- `progress_90`
- `game_completed`
- `game_gave_up`
- `play_again`
- `copy_result`
- `share_result`
- `validation_error_shown`
- `how_it_works_click`
- `contact_click`

GA4 参数中不得包含用户具体输入姓名。

### 21.2 Clarity用途

- 检查首屏是否立即看到输入框；
- 检查移动端键盘遮挡；
- 检查重复点击和无响应区域；
- 检查错误提示是否可见；
- 观察退出位置；
- 观察 SEO 正文阅读情况。

### 21.3 D1内部数据

记录：

- Session 生命周期；
- 每次 Guess；
- 原始输入和标准化输入；
- 验证状态；
- QID；
- 数据来源；
- Cache Hit；
- 外部 API 响应时间；
- 失败原因；
- 人工覆盖使用情况。

---

## 22. Privacy与合规

隐私政策需明确：

- 游戏输入可能被保存；
- 数据用于提供服务、排错和提高验证准确性；
- 网站不要求玩家提交真实姓名；
- 使用 Cloudflare、GA4 和 Microsoft Clarity；
- Cookie、本地存储和匿名 Session 的用途；
- 联系和数据请求邮箱；
- 用户输入不会作为 GA4 事件参数发送。

Contact 页面提供误判反馈模板：

```text
Name entered:
Expected person:
Wikipedia or Wikidata link:
What happened:
```

---

## 23. 性能目标

### 23.1 页面

- 首屏尽快展示可操作输入框；
- SEO 正文不阻塞游戏交互；
- 不在游戏列表中加载人物头像；
- GA4 和 Clarity 延迟或非阻塞加载；
- 移动端优先。

### 23.2 验证接口

目标值：

| 场景 | 目标 |
|---|---:|
| KV 命中 | P95 < 300 ms |
| D1 命中 | P95 < 600 ms |
| 外部实时验证 | 尽量 P95 < 2 s |
| 外部 API 超时 | 建议 3–5 s 内失败 |
| 临时错误 | 可立即重试，不永久判错 |

---

## 24. 可访问性

- 输入框具备明确 label；
- 所有状态不能只依赖颜色；
- 错误反馈使用 `aria-live`；
- 按钮可使用键盘操作；
- 焦点状态清晰；
- Give Up、Play Again、Copy Result 均有可读名称；
- 避免因进度动画造成页面跳动；
- 满足基础 WCAG AA 对比度。

---

## 25. MVP验收标准

### 25.1 功能验收

- 用户无需登录即可开始；
- 第一位有效答案后计时；
- 有效人物可以接受；
- 别名可映射到同一 QID；
- 同一 QID 重复提交不计分；
- 虚构人物被拒绝；
- 模糊输入提示完整姓名；
- 外部异常不显示为人物不符合规则；
- 达到 100 自动完成；
- Give Up 可结束；
- Copy Result 可用；
- Play Again 创建新 Session；
- 刷新后不恢复旧游戏。

### 25.2 SEO验收

- 首页服务端 HTML 含主要正文；
- Title、Description、Canonical 正确；
- sitemap 和 robots 可访问；
- 未知路由返回 404；
- API 路由不进入 sitemap；
- JSON-LD 通过结构化数据验证；
- 无测试域名 canonical。

### 25.3 数据验收

- Session、Guess 和 Person 数据正常写入 D1；
- KV 命中和回退有效；
- GA4 事件不包含姓名；
- Clarity 正常加载；
- 能查询高频 `NOT_FOUND` 和 `AMBIGUOUS` 输入；
- 能区分 `completed`、`gave_up`、`abandoned`。

### 25.4 工程验收

- TypeScript 通过；
- Lint 通过；
- Build 通过；
- D1 migration 可重复执行；
- Cloudflare Preview 环境可运行；
- 生产环境绑定正确；
- 无真实密钥提交到仓库；
- README 包含本地开发和部署步骤。

---

## 26. MVP结果判断

### 26.1 搜索信号

- 是否被正常收录；
- 是否产生目标关键词曝光；
- 点击率；
- 排名趋势。

### 26.2 产品信号

- `game_view → first_valid_guess` 转化；
- 平均正确人数；
- 10/25/50/75/100 进度到达率；
- Give Up 比例；
- 验证失败率；
- 验证响应时间。

### 26.3 后续决策逻辑

```text
有曝光、无点击
→ 优化 Title、Description、SERP 表达

有点击、不开局
→ 优化首屏、加载速度、玩法说明

开局多、进度低
→ 检查游戏难度、验证速度和误判

NOT_FOUND / AMBIGUOUS 高
→ 优先优化验证和人工覆盖

完成或 Give Up 后分享较多
→ 开发分享卡片和传播能力

完成记录和真实数据足够
→ 再开发排行榜和公共 Stats

重复游玩明显
→ 再开发新模式或 Daily Challenge

长期无曝光
→ 不扩展功能，重新评估关键词与竞争度
```

---

## 27. 后续阶段规划

### 阶段1：有初步流量和真实提交

- 完善结果分享；
- 个人结果统计；
- 误判反馈流程；
- 必要时拆出 `/rules`。

### 阶段2：有足够完成数据

- `/leaderboard`
- `/stats`
- 基础反作弊；
- 非登录 display name。

### 阶段3：确认重复游玩

- Fictional Women；
- Women in Music；
- Women in Sports；
- Women in Science；
- Daily Challenge。

### 阶段4：确认长期SEO价值

- `/women/[slug]`
- 数据驱动 Blog；
- `/about`
- 可控索引的内容体系。

---

## 28. 最终开发原则

1. 不为未验证的未来需求过度建设；
2. 名字验证准确性优先于视觉复杂度；
3. 首屏游戏体验优先于长篇介绍；
4. 第三方服务失败必须与“答案无效”区分；
5. 前端不可决定计时、QID和是否接受；
6. 从第一天记录可支持后续决策的数据；
7. 新页面和新模式必须由真实搜索或用户行为触发。
