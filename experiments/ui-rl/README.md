# ui-rl

输出层强化学习环境的重建,计划见 `PLAN.md`。运行需要的组件库、截图检查和生成 Agent 都复制在 `gen/`(先在 `gen/` 里 `npm ci`),不依赖 ui-loop;ui-loop 原样保留作对照。全部是 mock 数据;密钥只走环境变量(`source judge.env`)。

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

## 第 2 阶段:报告数据(2026-10-13)

- `node data/gen-data.mjs`:复制原有 f1–f6(f6 的摘要「6 到 9 步」改成「5 到 9 步」,云途第 6 步补上 P6 的备注),按规格新写 f7–f24。模型写原始内容,`lib/features.mjs` 的 check 校验(编号、问题和建议的指向、阶段对比的列、摘要里的步数、虚构产品名、规格),不通过把问题发回去改,最多 2 次;程序补齐指标、产品汇总、截图路径,再画截图。
- 规格让会影响排版的数据特征拉开:产品 2–5 个,每个产品 3–15 步,有备注的步骤 14%–94%(原有 6 份都在 33%–56%),问题 1–8 个,阶段对比和共性做法有的有、有的没有,摘要 72–217 字。小 4 份、中 10 份、大 4 份。
- 划分(`data/split.json`):训练 f1–f12,验证 f13–f18,测试 f19–f24;试点训练 f1–f4 + f7–f10,试点验证 f13–f16。
- 概览和抽查的 5 份:`reports/phase2-data.md`。
- 程序查不出的小出入还有(例如证据里的填写项数和那一屏的 inputs 差 1),不影响排版,没有再加校验。

## 生成 Agent(`gen/`,2026-10-13)

从 ui-loop 复制过来(组件库、`shoot.mjs`、`generate.mjs`、`agent.mjs`、`sandbox.sh`、规范、组件说明、g0),依赖版本和 ui-loop 完全一样。复制后拿 `ui-loop/traces/flow-g0/f1` 核对过:新旧两边 `shoot.mjs` 的检查结果、整页截图、缩略图、10 张切块逐字节相同;按节截图和 `cache/sections` 里的也相同;judge 的 13 个提示词复制前后 sha1 相同。

试跑第 1 步时 6 版里有一版 20 分钟没写完、两版中途报错。查日志找到的原因,改了 `gen/scripts/agent.mjs` 两处:

- **等模型开始回复的时限 10 秒 → 60 秒**(主要原因)。v2、v6 一共 12 次「Request timed out」,全部发生在会话里已经有 9 张以上截图之后:图多了,中转站常常 10 秒以上才开始回复,10 秒就被当成超时重发,每次白等 30 多秒;v2 连续 4 次后会话中断。judge 的 `call()` 早就是 60 秒。
- **沙箱里只能用 node 运行检查脚本**。v3 把截图看错了,以为页面上多了一行字,之后几分钟自己写脚本渲染、截图去查,绕过了「最多检查 5 次」。现在 bash 里用 node / npx / npm / python 运行别的东西会被拦下,提示用 `node $SHOOT .` 检查、用 read 看截图;grep、cat、ls 照常能用(包括读组件源码)。

`scripts/rollout.mjs` 的 20 分钟上限保留,只当兜底。


### 组件库整理(`gen/next/`,等试点跑完再换进 `gen/app`)

原来 `app/src/components/report/` 是 ui-loop 一路改过来的两层:`index.tsx` 里的 `Stat`、`DataTable`、`List`、`KV`、图表、`Text` 只是一行转发,真正的实现都在 706 行的 `render.tsx` 的一个大 switch 里,还夹着用不到的老代码(另一套 page/section 框架、card、alert、badges)。生成 Agent 想查一个组件怎么画,得先发现这层转发,再去大文件里找分支。

`gen/next/report/` 按 shadcn 的写法重写:一个组件一个文件(`stat.tsx`、`data-table.tsx`、`list.tsx`、`kv.tsx`、`chart.tsx`、`progress-list.tsx`、`text.tsx`、`figure.tsx`、`layout.tsx`),`index.tsx` 只做导出。组件名、属性、类名一字不改;去掉了用不到的分支和只用来追踪 spec 的 `data-type` 属性。`List` 里写明了 `meta` 在各模式下显示在哪。

核对:`gen/next/check-same.sh gen/next/check-pages.txt`(在 `experiments/` 下运行)。选的 21 页覆盖现有 263 个不同页面里用到的全部 108 种组件和属性写法,外加试点第 1 步的 6 版;新旧两套各渲染一次,检查结果、整页截图、缩略图、每张切块全部逐字节相同。

训练正在用 `gen/app`,中途换掉等于换了生成环境(Agent 读到的源码不一样),所以试点跑完再换。换的时候 `components.md` 一起补上:各组件源码在哪个文件、`List` 的 `meta` 在各模式下显示在哪。

#### 网格内放开(也在 `gen/next/`,一起换进去)

原则:网格里怎么填都可以,但每一块的左右边都要落在 12 列的栏线上。

- 组件:所有内容组件和 `Figure` 多了 `start`(从第几列开始)和 `rowSpan`(竖着跨几行),`Block` 多了 `start`;`Section` 多了 `layout="stack"`(标题在上、内容占满 12 列);`Grid` 不写 `cols` 时按自己有几列宽来分(`side` 节里 9、`stack` 节里 12、写了 `span` 就是 `span`),所以里面的东西天然落在栏线上。不写新 props 的旧页面渲染结果不变(21 页逐字节核对过,`SHOOT_GRID=0`)。
- 检查:`gen/scripts/grid-check.mjs`,`shoot.mjs` 在组件库带 `grid.ts` 时调用,量每一块的左右边,不在栏线上就报「网格」问题。拿第 1 遍观察的 16 版页面试:带清单的 3 版为了「四项一行」在 9 列宽里写了 `Grid cols={12}`,4 个指标全不在栏线上;g0 有 2 版两列的 `List` 不在栏线上。ia5 都没看出来。
- 规范和组件说明的草稿:`gen/next/design.md`(在 `design-b2b9.md` 基础上加 A6 网格,B 改成默认排法,C2 加 `stack`,C4 改成自由组合;B9 的 2 条改用单列,因为 9 列分不成两半)、`gen/next/components.md`。
