# 输出层自迭代(ui-loop)

上游 Skill 输出报告数据(JSON),生成 Agent 按设计规范和组件库写出页面。loop 根据 judge 对页面的两两比较,一次改一条规则。

## 两层:公共层和 Skill 输出指南

| 层 | 文件 | 谁改 | 改了要重测什么 |
|---|---|---|---|
| 公共层 | `design.md`(公共规范)、`components.md` 和 `app/`(组件库) | 设计系统负责人;loop 不改 | 所有 Skill |
| Skill 输出指南 | `skills/<skill>/guides/g<N>.md` | 这个 Skill 的 loop | 只有这个 Skill 的样本 |

输出指南只写这个 Skill 的数据怎么呈现(哪个字段用哪个组件、放在哪一节),不重复公共规范。生成时两者一起给生成 Agent。

一开始先只修改 design.md,所有 Skill 共用,结果一处修改要重测所有报告:a 发现的问题改了规则,b 的页面变差,说不清是改动造成的还是生成本身的随机差异。按 Skill 拆开后,改动只影响这个 Skill 的页面。下面「整份规范的 loop」保留作对照。

### Skill 输出指南的 loop(`scripts/skill-loop.mjs`)

试点两个 Skill:交互流程挖掘(同一任务、几个产品的界面链路对比)和色觉无障碍分析(界面对色盲是否友好)。每个 Skill 6 份样本(`skills/make_data.py` 生成,数据是编的),4 份训练、2 份留出验证(`skills/split.json`)。

- **训练样本**:生成、比较,judge 的观察交给 Maintainer 和 Reviser,用来找问题、写修改。
- **留出的验证样本**:Maintainer 和 Reviser 看不到,只用来决定这次修改是否采用。修改是照着训练样本写的,在训练样本上变好说明不了什么;在没参与找问题的样本上也变好,才说明这条规则对这个 Skill 普遍有效。

准备:空指南 g0 从头生成全部样本;训练样本再生成一次,两版比较,Maintainer 归纳第一批经验。

每一轮:

1. **Reviser** 读当前指南、经验库、修改记录和训练样本数据,只改一条规则,得到候选 `guides/c<k>.md`。
2. **改页面**:生成 Agent 拿当前版的页面和这一条改动,只改和这条规则有关的地方,不从头重写。两版页面的差别就来自这条改动。没改动的页面不送 judge。
3. **judge**:rubric31 两两比较,两种顺序都选同一版才算。训练样本比 1 轮,验证样本比 3 轮。
4. **把关**:验证样本一份都不输、至少赢一半,程序检查问题不增加,才采用。
5. **Maintainer** 用训练样本的比较更新这个 Skill 的经验库;和数据类型无关的经验标「公共」,以后可能提到公共规范。
6. **记录**:`skills/<skill>/changelog.md`,不管采用没有都写,包括每份样本改了多少行、每轮赢输。

停止:连续 3 个候选没通过、到轮数上限(默认 6)、每采用 2 个版本的人工检查点。最后用最终指南从头生成验证样本,和 g0 比较,再由用户盲排。

```sh
node scripts/skill-loop.mjs --skill flow [--max-rounds 6] [--setup-only]
```

| 文件 | 作用 |
|---|---|
| `skills/<skill>/data/` | 样本数据 |
| `skills/<skill>/guides/` | 输出指南各版本和候选 |
| `skills/<skill>/changes/` | 每个候选的那一条改动 |
| `skills/<skill>/experience.md` | 这个 Skill 的经验库 |
| `skills/<skill>/changelog.md` | 修改记录 |
| `skills/<skill>/state.json` | loop 进度 |
| `traces/<skill>-<版本>/<样本>/` | 页面、截图、会话、meta.json(含相对上一版改动的行数) |

## 整份规范的 loop(对照)

## 文件

| 文件 | 作用 |
|---|---|
| `design.md` | 规范 v0,手写;按用户选定的目标风格(A/B 实验报告、体验走查报告)整理 |
| `components.md` | 组件库说明:组件和 props |
| `app/` | 组件库(Radix 基础组件 + 报告组件)和构建环境 |
| `designs/` | 每个版本和候选的规范:`v0.md`、`c1.md`、`v1.md`… |
| `traces/<版本>/<报告>/` | 轨迹库:data.json、Agent 写的 Page.tsx、截图、程序检查、整段会话 session.jsonl、meta.json |
| `traces/_compare/` | judge 的每次比较(两种顺序各一份),含逐条观察 |
| `experience.md` | 经验库:Maintainer 归纳的成功和失败模式,带证据 |
| `changelog.md` | 修改记录:每个候选改了什么、对比结果、是否采用;没采用的也保留 |
| `loop-state.json` | loop 进度,中断后接着跑 |

## 一轮怎么走

1. **Reviser** 读当前版规范、经验库和修改记录,只改 B 或 C 的一条规则(改写或新增),得到候选。
2. **生成**:生成 Agent(pi)用候选规范为 6 份训练报告和 4 份验证报告写页面。
3. **judge**:用 rubric31 把候选和当前版的页面两两比较,两种顺序都选同一版才算数。训练报告比 1 轮,用来找问题;验证报告比 3 轮,用来把关。
4. **Maintainer** 读训练报告的比较和程序检查,更新经验库。验证报告的比较不给 Maintainer 和 Reviser 看。
5. **把关**:候选在验证报告上一份都不输、至少赢一半,并且程序检查问题没有增加,才采用;否则保留当前版。
6. **记录**:不管采用没有,都写进修改记录。

第 1 轮之前,用 v0 在训练报告上生成两次,把两版比较一次。同一份规范生成的两版差在哪里,就说明规范在哪里没写清楚,这是第一批经验。

- 训练报告:运营月报、A/B 实验、销售复盘、会员调研、体验走查、招聘季报
- 验证报告:财务月报、客服质检、物流时效、园区能耗

## 监督从哪里来

- **judge**:两两比较和用户排序的一致率,测试集 96%、验证集 93%(`../ui-judge/RUBRIC_CHANGELOG.md`)。loop 期间 rubric 冻结。
- **程序检查**:构建、只用组件库、统一刻度、数据忠实、元素越界;问题带 Page.tsx 行号。
- **人工检查点**:每采用 2 个版本暂停一次,用户盲排当前版和 v0。用户和 judge 判断不一致时,先修 judge,再继续。

## 什么时候停

- 连续 3 个候选没通过把关;
- 到达轮数上限(默认 10);
- 人工检查点;
- 最后由用户盲排 v0 和最终版,作为结论。

## 生成 Agent 的沙箱

Agent 用 pi 的 read / write / edit / bash。read、write、edit 只能访问自己的工作目录;每条 bash 命令都在 `scripts/sandbox.sh` 里运行:新的挂载、网络、进程命名空间,只看得到工作目录(可写)和组件库、构建依赖(只读),环境变量里没有 API key,不能联网。

## 运行

```sh
npm install
source <judge.env>                      # DEEPSEEK_API_KEY、JUDGE_URL;不进仓库
export JUDGE_MODEL=deepseek-v4.1-flash JUDGE_EFFORT=high
node scripts/loop.mjs [--max-rounds 10]
# 单独用:
node scripts/generate.mjs --run <名字> --cases ops,sales --design designs/v0.md
node scripts/compare.mjs --a <run> --b <run> --cases ops,sales --rounds 3
node scripts/shoot.mjs <工作目录>
```
