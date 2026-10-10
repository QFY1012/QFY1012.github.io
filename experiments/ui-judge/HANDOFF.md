# 交接:UI 审美 judge 实验(2026-10-10)

目标:做一个稳定、准确的 UI 审美 judge(看截图,两两比较),用人工排序验证一致率。全部是 mock 数据。

## 怎么判(流程)

- 每组 5 个版本(运营月报、A/B 实验报告是 6 个),两两比较。每对按 A/B、B/A 两种顺序各判一次,**两次选同一版才算判出**,否则记「分」。整套重复 3 遍。
- 一致率 = 判出且和人工排序一致 ÷ 判出。人工判平的对不计。
- judge 看到:每版 1 张整页缩略图 + 若干 640px 切块(`thumb.png`、`clean-*.png`)。
- 模型:`deepseek-v4.1-flash`,走 openone(`JUDGE_URL=https://openoneapi.com/v1/chat/completions`),**`JUDGE_EFFORT=high`**。openone 的 low 档几乎不思考(平均 412 输出 token,官方源 low 是 1167);high 才和官方 low 相当。
- 密钥只用环境变量 `DEEPSEEK_API_KEY` 传入,不在仓库里。原来放在会话临时目录,已随会话失效,要重新提供。**实验结束后请轮换用过的两个 key。**

```sh
export DEEPSEEK_API_KEY=... JUDGE_URL=https://openoneapi.com/v1/chat/completions JUDGE_MODEL=deepseek-v4.1-flash JUDGE_EFFORT=high
node scripts/evalset-judge.mjs --cond rubric7            # 跑全部组;已有结果自动跳过,可断点续跑
node scripts/evalset-judge.mjs --cond rubric7 --score    # 一致率、judge 排名、逐对结果
node scripts/progress.mjs <输出目录>                     # 各轮进度
```

结果目录:`out/aesthetic/evalset/<cond>@<model>[-<effort>]/<组>__<版本a>__<版本b>__r<n>.json`。

## 恢复数据(out/ 被 git 忽略)

`archive/` 里有两个包,在 `experiments/ui-judge/` 下解压即可:
- `archive/judgements.tgz`:所有 judge 判定结果和日志(`out/aesthetic/evalset/`、`out/*.log`)。
- `archive/pages.tgz`:评测集 47 个页面 judge 要用的图(缩略图、切块、风格页的 page.html)。其中 `out/versions/` 是更早一轮迭代生成的,无法用脚本重建。

## 评测集

- `evalset/key.json`:9 组,盲标签(甲乙丙丁戊己辛)→ 版本目录。`evalset/human.json`:人工排序(1 最好)。
- 组:运营月报、A/B 实验报告、体验走查报告、季度销售复盘、会员调研报告,以及 4 组「五种风格」(手写 HTML,`scripts/style-pages/*.mjs`,`node scripts/build-style-pages.mjs <name>` 生成,`python3 scripts/cut-pages.py out/style --no-pairs` 切图)。

## 各评分标准的结果(openone high,除注明外)

| 标准 | 是什么 | 合计一致率 | 能判出 | 备注 |
|---|---|---|---|---|
| principles(旧 6 条原则) | 一次调用直接选 | 88%(218/248) | 248/300 | 体验走查 63%:辛(V8)太挤,judge 却因为它去掉卡片而选它 |
| principles2 | 第 2 条改成按屏数拥挤,先写观察 | 90%(216/240) | 240/300 | 体验走查升到 90%,运营月报降到 85%。这是打补丁的写法 |
| dims4-sep(7 维) | 每维单独调用,两种顺序都选同一版才算 1 票 | 前三组 86–93% | — | 有明显位置偏差(A 位占 59%,「一致」维 38% 前后矛盾),只跑了约 100/600,已不再推荐 |
| rubric7(新 7 条) | 对齐后重写:一次调用逐条写 A/B 观察并判,最后总体选 | **跑到一半,未出结果** | | 下一步要看的 |

## 和用户对齐出的偏好(写 rubric 的依据)

用户逐对看了 judge 一直判反的对,给出的理由:
- **最主要是拥挤**:辛、戊(A/B 风格)、甲(销售复盘下半部分)都是「太挤」。
- **多余的装饰是缺点**:每块都套同样的卡片(A/B 实验报告的丙、运营月报的己)是多余的;「卡片统一」不能算优点。
- **用底色突出最重要的一块是好的**:运营月报·五种风格的丁,深绿顶栏衬出核心指标。
- **调性要统一**:运营月报戊的大面积橙红实心柱和整页调性不搭。
- **分组要有节奏**:己的卡片间距处处一样,没有分组和节奏。
- **留白要成形**,对齐要讲正负形(内容块和空白都是规整矩形)。
- 用户对写 rubric 的要求:**不要打补丁**(不要「不能用 X 抵消」这类句子);**不要模糊**,要有具体标准和例子;但**不要太长**;例子必须通用,**不能取自测试集**(否则等于泄题)。
- 用户说有 4 对其实「差不多」:销售复盘甲对丙、A/B 风格丁对戊、运营月报风格甲对丁、运营月报戊对己。还没决定是否在 human.json 里改成平局不计。

## 当前的 rubric7(`scripts/pairwise-judge.mjs` 里的 `RUBRIC_7`)

按重要程度:1 疏朗(每屏 ≤3 种内容、块间 ≥2 行、不同内容不并排)· 2 分组清楚有节奏(组间距 ≥ 组内 2 倍)· 3 装饰各有用处 · 4 重点清楚 · 5 调性统一(彩色 ≤2 种、最重的一块是最重要的、线条粗细接近)· 6 同类一致 · 7 正负形整齐。阈值(3 种、2 行、2 倍)是拍的,未经用户确认。用户曾考虑把 5、6 合并成「一致协调」变 6 条,决定先试 7 条。

## 进行中 / 下一步

1. **rubric7 在 9 组上跑到一半**(会话结束即中断)。解压 archive 后用上面的命令续跑,再 `--score`,和 principles2 的 90% 比。也要看对齐过的那几对是否判对(那是照着它们写的,判对是应该的)。
2. **4 组新的泛化测试集**(财务月报 finance、招聘季报 hiring、客服质检 cs、物流时效 logistics):页面已全部做完并提交(`data/<topic>.json` + `scripts/style-pages/<topic>.mjs`,各 5 版,截图已逐张检查过渲染问题)。本地用 `node scripts/build-style-pages.mjs <topic>` 重新生成截图。要求:5 个版本像 5 个不同设计师的作品、水平有高有低,**生成者不看 judge 规则**,风格避开已用过的。完成后:检查截图 → `cut-pages.py` 切图 → 在 key.json 加 4 组(标为留出集,盲标签随机)→ 让用户盲排 → 再跑 judge。**这 4 组只测试,不拿来改规则。**
3. 7 维(dims4-sep high)只跑了约 100/600,已不推荐,可以不续跑。
4. GitHub 上的 `ui-judge-progress` 分支是之前的进度中转,没用了,需要用户在 GitHub 网页上手动删除。
