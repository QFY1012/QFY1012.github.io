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
