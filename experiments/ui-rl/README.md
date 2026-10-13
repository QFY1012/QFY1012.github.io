# ui-rl

输出层强化学习环境的重建,计划见 `PLAN.md`。ui-loop 原样保留,这里复用它的组件库、截图检查和生成 Agent。全部是 mock 数据;密钥只走环境变量(`source judge.env`)。

## 第 0 阶段:测基线

| 步骤 | 命令 | 状态 |
|---|---|---|
| 0.1 logprobs 探针 | `node scripts/probe-logprobs.mjs [--url ...] [--model ...]` | 已跑,见下 |
| 0.2 抽页面对 | `python3 scripts/build-pairs.py` | 已跑:84 对(候选 72、A/A 12),98 张页面图 |
| 0.3 盲标 | 标注页 `labels/label.html`(已发布为 artifact,标注存在它的 db 里) | 进行中 |
| 0.4 现在的 judge 重复判 | `JUDGE_MODEL=deepseek-v4.1-flash JUDGE_EFFORT=high node scripts/judge-repeat.mjs --rounds 5` | 等额度 |
| 0.5 对照打分 | `node scripts/eval-reward.mjs --run baseline-judge` | 脚本已写好,用假数据测过 |

- `labels/key.json` 是答案(每对的来源、哪边是候选),标完之前不要看。`labels/pages/` 由 `build-pairs.py` 从 `ui-loop/traces` 生成,不进仓库。
- 标注从标注页的 db 导出到 `labels/human.json`(Claude 用 ArtifactData 读 `labels` 集合),每条 `{pair, round: r1|r2, score: -2..2, reason}`,score 正数 = pairs.json 的右边更好。
- judge-repeat 先跑完第 1 轮的所有对再跑第 2 轮;额度中途用完,重跑同一命令续跑。

### 0.1 探针结论(2026-10-13)

- openone 的 `deepseek-v4.1-flash`:思考 / 不思考、流式 / 非流式四种都**不返回 logprobs**;`thinking: {type: "disabled"}` 也被忽略,照样思考。
- 不给 response_format 时,要求「只输出一个数字」,非流式两次都写了一段解释再给结论:正式判法要用 JSON 字段或固定的最后一行来取分数。
- DeepSeek 官方端点:现在的 key 是 openone 的,官方端点 401,没测成。
- 2026-10-13 按官方文档的参数再探一次(`logprobs: true, top_logprobs: 20`):openone 上能用的只有 `deepseek-v4.1-flash`、`deepseek-v4-flash-0731`、`deepseek-v4-pro-0813`(官方名 `deepseek-flash`、`deepseek-v4-pro` 报 model_not_found)。三个模型、思考 / 不思考、流式 / 非流式**都不返回 logprobs**,是中转站去掉了。`reasoning_effort: "none"` 能关掉两个 flash 的思考,pro 关不掉;`thinking: {type: "disabled"}` 都不起作用。
- 所以第 1 阶段的有刻度比较先用**采样近似**:同一请求采 k 次,用 1–9 的出现频率当分布;拿到支持 logprobs 的端点再换回概率期望。

## 第 1 阶段:比较 judge(2026-10-13)

全部在第 0 阶段的 84 对盲标上比(dev:候选 c1 c2 c3 c5 c8 c11 + flow-g0 的 A/A 对;test:其余)。judge 定义在 `lib/judges.mjs`,结果在 `runs/p1-*`,对比表在 `reports/phase1-judges*.md`。

| judge | 改了什么 | 结论 |
|---|---|---|
| rubric31(`baseline-judge`) | loop 原来的审美 judge | test 候选 1/6,和随机差不多 |
| func | loop 早期的需求 judge | test 候选 2/6 |
| ia、ia31 | 从人工理由整理的 6 条(+ rubric31 视觉 7 条) | test 候选 4/6,明显好于 rubric31 |
| ia2、ia2s | 加两条取舍规则(补丁);ia2s 换成按节对齐的输入 | 规则对 c3、c5 有效但是补丁,删掉后(ia3s)退回 ia31 的水平 |
| ia2p、ia2g | 同一节左右拼图;1–9 分采 3 次 | 拼图更易受顺序影响,放弃;采样对「差不多」有用但贵 3 倍,放弃 |
| ia4s、ia4v | 只留人工理由里有依据的 5 条(删掉「简练」);ia4v 再加 rubric31 视觉细节作平局参考 | 各跑两轮:候选 10/11 和人工一致(只错 c4),两轮判出的方向 100% 一致 |
| **ia5** | **定下来的版本**:信息组织 4 条 + 视觉一节(「指标一行排满」并进「同类组件一致」) | 只是 ia4v 调了结构,没有单独重跑 |

几点经验:

- 只跑一轮时,同一个 judge 自己就会有一两个候选的结论变掉;各版本间「差一个候选」在这个波动以内。比较版本至少各跑两轮。
- 「简练」是整理标准时加进去的,人工理由里一次也没出现,却是 judge 用得最多的一条,是 c3 判错的原因。改标准时只留理由里有依据的条目(按候选数算,同一候选的重复理由只算一次),不针对个别判错的对加规则。
- 按节对齐的输入比整页切块省约 40% 的输入;openone 不返回 logprobs(见上),有刻度的比较只能靠采样。
- c4 四个版本都判反:人工更看重「结论和指标合并」,judge 更看重「背景信息不和建议混在一起」。c4 在 test 里,记作已知分歧,没有据此改标准。
- 并发 32 时开头会有少量「60 秒没有开始回复」的重试,之后正常;84 对一轮约 5 分钟。

### 人工重标(暂缓,留作以后)

- 标注页上的「重标 · 21 对」:每 4 对取 1 对,左右对调、顺序倒过来显示,存的时候换算回 pairs.json 的左右。
- 用途:算人工前后两次的一致率,作 judge 一致率的上限参考。如果人工自己也只有八成左右一致,test 上 75–78% 就不算差。
- 和第一次标注隔得不久(PLAN 原定一周后),可能记得上次的选择,一致率会偏高。

### 可优化项目

- **第 2 层量化指标**(PLAN 3.2):留白、对齐、间距刻度、字号级数、一行没排满等,从渲染后的 DOM 直接量,不花 API 费用;每项在 84 对上看和人工方向是否一致,一致的才用。现在没做,第 1 阶段只用第 3 层 judge(ia5)。
- **验收没全达标**:test 上和人工一致 75–78%,低于 PLAN 的 85%(主要是 c4);决定先接受,进第 2 阶段。
