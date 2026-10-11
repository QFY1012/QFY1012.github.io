# 输出层自迭代(ui-loop)

上游 Skill 输出报告数据(JSON),生成 Agent 按设计规范和组件库写出页面。loop 根据 judge 对页面的两两比较,一次改一条规则。

## 两层:公共层和 Skill 输出指南

| 层 | 文件 | 谁改 | 改了要重测什么 |
|---|---|---|---|
| 公共层 | `design.md`(公共规范)、`components.md` 和 `app/`(组件库) | 设计系统负责人;loop 不改 | 所有 Skill |
| Skill 输出指南 | `skills/<skill>/guides/g<N>.md` | 这个 Skill 的 loop | 只有这个 Skill 的样本 |

输出指南只写这个 Skill 的数据怎么呈现(哪个字段用哪个组件、放在哪一节),不重复公共规范。生成时两者一起给生成 Agent。

一开始先只修改 design.md,所有 Skill 共用,结果一处修改要重测所有报告:a 发现的问题改了规则,b 的页面变差,说不清是改动造成的还是生成本身的随机差异。按 Skill 拆开后,改动只影响这个 Skill 的页面。下面「整份规范的 loop」保留作对照。

### UI loop:每个 Skill 的页面输出(`scripts/ui-loop.mjs`)

试点两个 Skill:交互流程挖掘(同一任务、几个产品的界面链路对比)和色觉无障碍分析(界面对色盲是否友好)。每个 Skill 6 份样本(`skills/make_data.py` 生成,数据是编的),4 份训练、2 份留出验证(`skills/split.json`)。

- **训练样本**:生成、比较,judge 的观察交给 Maintainer 和 Reviser,用来找问题、写修改。
- **留出的验证样本**:Maintainer 和 Reviser 看不到,只用来决定这次修改是否采用。修改是照着训练样本写的,在训练样本上变好说明不了什么;在没参与找问题的样本上也变好,才说明这条规则对这个 Skill 普遍有效。

样本数据带图:交互流程挖掘每一步有界面截图,色觉无障碍分析有原界面和三种色盲眼中的样子(`skills/make_images.mjs`、`skills/simulate_cvd.py`,图是画的)。

#### 两步检测:程序检查 → 审美 judge

| 步骤 | 看什么 | 怎么判 |
|---|---|---|
| 程序检查(`scripts/shoot.mjs`) | 构建、只用组件库(页面上任何不是组件库画的图片、画布等元素都算违规,不管代码怎么写)、数据和图片是否都显示、统一刻度、越界 | 确定的,每条都算 |
| 审美 judge(rubric31) | 哪版设计更好 | 两版两两比较 |

审美 judge 的方法(`scripts/compare.mjs`):每次按两种顺序各比一次,两种顺序都选同一版才算;同时列出更好那版还剩的问题,两种顺序都提到的才算数。检测从「当前版对按同一指南再生成的一版」开始,之后每轮比「当前版对候选」。

原来在两步之间还有一步需求 judge(哪版更方便操作),已经去掉:它和人的判断不一致,比如 flow 的 c3 解决了它被要求核对的问题,它就判改后更方便,可在人看来页面明显变差了。代码还留在 `compare.mjs`(`--kind function`),loop 不再调用。

前一步不过不跑下一步。程序检查通过 = 所有页面没有报错。审美阶段的候选也要程序检查不退步。

#### Maintainer:归纳问题,分成「组件不够」和「布局问题」

每一步检测完,Maintainer(`scripts/maintainer.mjs`)读这一步在训练样本每一页上的原始意见,**归纳**成问题清单,不是罗列:同一个问题出现在很多页、很多次检查里,合并成一条,带上出现的页和证据。judge 阶段只记当前版的问题:两种顺序都提到的剩余问题,以及当前版两种顺序都输时输在哪里。清单每一步更新:再次出现的补证据,不再出现的标「已解决」。清单在 `skills/<skill>/experience.json` 和 `experience.md`。

每个问题只分两类,标准是「现有组件够不够用」:

| 类别 | 意思 | 谁来改 | 影响 | 把关 |
|---|---|---|---|---|
| 组件不够 | 组件库里没有能做到的组件,怎么排都解决不了 | 组件 Agent 更新组件库(下面「组件分支」) | 所有 Skill | 人工审批示例,可以提意见或直接改 |
| 布局问题 | 组件够用,页面选的组件、组合和排法有问题 | Reviser 改这个 Skill 的输出指南,loop 自己迭代(下面「一轮」) | 只有这个 Skill | 留出样本 |

#### 组件分支(`scripts/component-loop.mjs`)

1. **做组件**(`propose`):读各 Skill 问题清单里「组件不够」的问题,交给组件 Agent。它在组件库的副本(`traces/_components/k<n>/`)里工作,规则:
   - 只改需要的地方:可以新增组件,也可以修改已有组件(改了要说明改了什么、为什么),和需求无关的地方不动,tokens 不改;
   - 写法和 shadcn 一样:几个可以组合的小部件(data-slot、className、`cn()`),不加配置 props,怎么组合由页面决定;
   - 先找 shadcn 里能用的部件(`vendor/shadcn/`,离线副本),复制过来再按规范改样式;没有合适的,才用 Radix 原语写;
   - 风格和现有组件一致:字号、灰度、线条、间距照现有组件,只用 token,不加卡片、底色、阴影。

   它更新 `components.md`,用真实样本数据画演示页,新部件和现有组件放在同一页。
2. **程序检查**:演示页跑页面的程序检查;组件代码查已有代码和 tokens 有没有被改,新增代码有没有颜色值、规范外的字号、阴影、底色;从 shadcn 复制来的部件一样查。有问题自动打回给 Agent,最多 2 次。
3. **人工审批**:`library/k<n>.md`,最上面是示例效果(`library/k<n>-demo.png`),后面是 Agent 的说明、需求、检查、diff。
   - 通过:`approve k<n>`
   - 提意见让 Agent 再改一版:`revise k<n> "意见"`
   - 自己改:直接改 `traces/_components/k<n>/app/`,改完 `approve`
   - 不采用:`reject k<n> "原因"`,下次做组件时 Agent 会读到
4. **合并**:组件和 `components.md` 进组件库;两个 Skill 当前的页面按新组件改一遍(只改相关的地方),再从程序检查开始。

一次只有一个组件改动在等审批。不管采用没有都记在 `library/changelog.md`。

#### 一轮(布局问题,改输出指南)

1. **Reviser** 读当前指南、问题清单里的「布局问题」、修改记录和训练样本数据,只改一条规则,得到候选 `guides/c<k>.md`。
2. **改页面**:生成 Agent 拿当前版的页面和这一条改动,只改和这条规则有关的地方,不从头重写。两版页面的差别就来自这条改动。没改动的页面不送 judge,沿用之前的比较。
3. **把关**(只看留出样本):
   - 程序检查阶段:报错比当前版少,没有哪页变多;
   - 审美阶段:审美 judge 一份都不输、至少赢一半(3 轮),程序检查不退步。
4. **修改记录员**(`scripts/recorder.mjs`)在训练页上比一轮改动前后两版,给这个候选写一条记录:做法(一句话)、结论(成功 / 失败 / 没效果)、解决了什么、带出了什么问题、教训。只算两种顺序都这么说的效果。采用和没采用的都写,门禁结果由代码另记,验证样本只透露把关结论。下一轮 Reviser 先读修改记录:失败和没效果的做法不再试,成功的做法保留。记录在 `skills/<skill>/record.json`,渲染成 `changelog.md`。
5. **Maintainer** 只维护当前的问题清单:候选被采用时,按这次比较更新;没采用的不改(当前版没变)。只解决了一部分的问题,原问题标「已解决」,剩下的部分记成新问题。

程序检查:所有页面都通过,就进入审美阶段;跑满 4 轮或连续 3 个候选没通过,也进入审美阶段,剩下的问题记在修改记录里。只剩「组件不够」的问题时,loop 停下等组件分支;组件合并后,从这一步重新检测。

停止:审美阶段的问题全部解决才停(没采用的候选不算停的理由,下一轮 Reviser 读修改记录换做法再试)。另外可以用 `--max-rounds` 设轮数上限(默认 0,不限),`--checkpoint` 设每采用几个版本停下人工检查(默认 2,0 不停)。最后用最终指南从头生成留出样本,和 g0 比较,再由用户盲排。

```sh
node scripts/ui-loop.mjs --skill flow [--max-rounds 0] [--stage-rounds 4]
```

| 文件 | 作用 |
|---|---|
| `skills/<skill>/data/` | 样本数据 |
| `skills/<skill>/guides/` | 输出指南各版本和候选 |
| `skills/<skill>/changes/` | 每个候选的那一条改动 |
| `skills/<skill>/experience.md` | 这个 Skill 的问题清单(Maintainer 归纳,分组件库和指南) |
| `skills/<skill>/changelog.md` | 修改记录(修改记录员写,`record.json` 渲染):每个候选的做法、成功 / 失败 / 没效果、教训、门禁结果 |
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
