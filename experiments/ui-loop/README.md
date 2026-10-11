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

样本数据带图:交互流程挖掘每一步有界面截图,色觉无障碍分析有原界面和三种色盲眼中的样子(`skills/make_images.mjs`、`skills/simulate_cvd.py`,图是画的)。

#### 两个 judge,先功能、后美学

| judge | 看什么 | 怎么判 |
|---|---|---|
| 功能 judge(`scripts/function-judge.mjs`) | 数据有没有用完;方不方便操作(找、对照、看图对文字) | 一次看一页,读 data.json 和截图,逐条列出问题。每页跑 3 次,一条意见至少 2 次都出现才算数 |
| 美学 judge(rubric31) | 哪版设计更好 | 两版两两比较,两种顺序都选同一版才算 |

一步一步迭代:**功能没通过之前不跑美学**。功能通过 = 数据全部用完,且没有算数的「不方便」;程序检查(图片是否显示、数据是否漏掉)也算在功能里。两个 Skill 的页面都通过功能后,才进入美学;美学阶段的候选也要先过功能 judge,功能退步直接拒绝。

#### 归因:问题出在哪条规则

**组件库暂时当作齐全,不做组件更新**(图片直接用 `<img>`,见 `components.md`)。所以两个 judge 和程序检查的意见全部归到规则:

| 细分 | 意思 | 改哪里 | 把关 |
|---|---|---|---|
| 缺规则 | 输出指南和公共规范里都没有相关规则 | 这个 Skill 的输出指南(规则在公共规范时,由用户改公共规范) | 留出样本 |
| 规则不清楚 | 有规则,但写得不清楚 | 同上 | 同上 |
| 没被照做 | 规则写清楚了,页面没照做 | 同上 | 同上 |

规则写了 Agent 却没照做,说明规则没起作用(太抽象、和别的规则冲突、被淹没),同样改规则:写成更具体、可检查的做法,能程序检查的加进程序检查。多个 Skill 都出现的问题,由用户决定是否提到公共规范。

#### 检测顺序

程序检查 → 功能 judge → 美学 judge,前一步不过不跑下一步。程序检查在渲染后的页面上查:构建、只用组件库(`<img>` 以外,页面上出现任何不是组件库画的画布、视频等元素都算违规,不管代码怎么写)、数据和图片是否都显示、统一刻度、越界。

#### 组件库分支(`scripts/component-loop.mjs`,暂停)

暂时不做组件更新,这一节先留作以后用。

组件库是公共层,一次只改一项能力(新组件,或给已有组件加 props),用户审两次。

1. **交方案**(`propose --runs flow-g0,cvd-g0`):收集归因为「组件库」的问题,交给组件 Agent。它在沙箱里拿到组件库副本(`traces/_components/k<n>/`)、shadcn/ui new-york-v4 全部源码(`vendor/shadcn/`,离线副本)和一份真实样本,只写方案 `plan.md`:用哪个 shadcn 组件、ui/ 里放什么、报告组件名和 props、两个 Skill 各怎么用、怎么和现有组件风格统一。审核材料 `library/k<n>-plan.md`。
2. **用户审方案**:`approve k<n> ["意见"]` 进入实现;`reject k<n> "原因"` 记下原因,下次提议会读到。
3. **实现**:组件来源按顺序:先用 shadcn(源码复制进 `ui/`,和 `shadcn add` 一样,再按规范改样式:shadcn 原版带阴影、底色、规范外的字号和尺寸;结构、行为、data-slot 和 props 不变);shadcn 没有合适的,才直接调 Radix 原语,按 shadcn 的写法写(data-slot、`cn()`、token 类名)。颜色、字号、间距只用 tokens,不改 `index.css`,不改已有组件。再更新 `components.md`,用样本数据写演示页,新组件和现有组件放在同一页。
4. **程序检查组件代码**:新增的代码行不能有颜色值或非 token 颜色类、规范外的字号、不是 8 的倍数的尺寸、阴影、底色;从 shadcn 复制来的文件一样查(61 个原版组件里 47 个有这类问题)。审核材料里单独列出对 shadcn 原版改了什么。演示页也跑一遍页面的程序检查。
5. **风格一致检查**:judge 看演示页截图和 diff,逐项比较新组件和现有组件(字号字重、灰度层级、线条、间距对齐、圆角、多余装饰)。第 4、5 步有问题就打回组件 Agent 修改,最多 2 次。
6. **用户审实现**:`library/k<n>.md`(方案、Agent 的说明、各项检查、diff、演示页截图)。`approve k<n>` 合并,`reject` 记原因。
7. **合并**:组件和 `components.md` 进公共层;生成 Agent 在每个 Skill 当前的页面上按这项改动修改(`traces/<run>-k<n>/`),再从程序检查开始重新检测。

tokens 只由用户改,组件 Agent 不动。不管采用没有都记在 `library/changelog.md`。

#### 一轮(指南问题,改输出指南)

1. **Reviser** 读当前指南、归因为「指南」的意见、经验库、修改记录和训练样本数据,只改一条规则,得到候选 `guides/c<k>.md`。
2. **改页面**:生成 Agent 拿当前版的页面和这一条改动,只改和这条规则有关的地方,不从头重写。两版页面的差别就来自这条改动。没改动的页面不送 judge。
3. **把关**:功能阶段,留出样本上算数的功能意见比当前版少、且没有新的;美学阶段,先过功能,再看 rubric31:留出样本一份都不输、至少赢一半(3 轮)。
4. **Maintainer** 用训练样本的意见更新经验库;和数据类型无关的经验标「公共」。
5. **记录**:`skills/<skill>/changelog.md`,不管采用没有都写。

停止:连续 3 个候选没通过、到轮数上限、每采用 2 个版本的人工检查点。最后用最终指南从头生成留出样本,和 g0 比较,再由用户盲排。

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
| `app/` | 组件库(shadcn/ui 基础组件 + 报告组件)和构建环境 |
| `vendor/shadcn/` | shadcn/ui new-york-v4 源码的离线副本,组件 Agent 从这里取组件 |
| `library/` | 组件改动的方案、实现、diff 和修改记录 |
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
