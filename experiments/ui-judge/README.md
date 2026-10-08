# UI judge 实验(mock)

测出 LLM judge 能准确识别并定位哪些 UI 设计问题,再决定每个检查项交给 judge、程序还是人工。与网站构建隔离:独立的 `package.json`,根目录 `tsconfig.json` 已排除本目录。全部使用非真实数据。

## 流程

```
data/<report>.json            业务 JSON(mock,非真实数据)
  → scripts/build-clean.mjs   手写的“好”界面 spec → specs/<report>.clean.json
  → scripts/inject.mjs        每个样本注入一个已知缺陷(明显 / 轻微两档)→ samples/ + manifest.json(真值)
  → scripts/render.mjs        Chromium 渲染(shadcn/ui 新版组件),给节点编号,测量 → out/render/<sample>/
  → scripts/judge.mjs         DeepSeek judge 标出问题节点 → out/judge/<run>/
  → scripts/score.mjs         对照真值计分 → out/judge/<run>/report.md
```

- **界面 spec**:生成器输出的是一棵组件树(page / section / group / grid / card 及内容组件),每个节点带 `id`,渲染后成为 DOM 上的 `data-spec`。生成器写的类名放在 `className`,只用 Tailwind 标准刻度。
- **组件**:`src/components/ui/` 复制自 shadcn/ui 新版(new-york-v4),只改了 `cn` 的导入路径。`src/render.tsx` 里的 `custom-*` 是由组件库零件拼成的自封装组件。
- **节点编号**:渲染后按文档顺序给带 `data-slot`、`data-spec` 或有文字的元素编号 `n1, n2…`;尺寸取实际可见部分(被父元素裁切的部分不算)。
- **judge 输入**(JSON 数据始终给):
  - `shot` 只给带编号的截图(整页切成 640px 高的图块,整页一张会被模型压缩到看不清编号)
  - `dom` 只给 DOM 清单(编号、组件、父节点、位置尺寸、字号、对齐、文字)
  - `both` 截图 + DOM 清单
  - `geo` 截图 + DOM 清单 + 程序算好的几何(每个容器内相邻子节点的间距、字号层级)
- **judge 输出**:`{"findings":[{"check","nodes","reason"}]}`;编号必须真实存在,只截图模式下只认截图上标出的编号。
- **计分**:标出的节点落在真值节点上或其内部算定位成功。好样本上的任何标记都算误报。

## 运行

```sh
npm install
node scripts/build-clean.mjs
node scripts/inject.mjs
node scripts/render.mjs            # 会先 vite build,Tailwind 需要扫描样本里的类名
DEEPSEEK_API_KEY=... node scripts/judge.mjs --run pilot [--modes shot,dom,both,geo] [--repeats 3] [--effort low]
node scripts/score.mjs --run pilot
```

密钥只通过环境变量传入,不写入仓库。Chromium 默认用 `/opt/pw-browsers/chromium`,可用 `CHROMIUM_PATH` 覆盖。

## 已知局限

- 目前只有一份报告(体验走查),好样本只有一个,误报率的样本量很小。
- 生成与判定同属 DeepSeek,可能偏向自家输出(自然样本阶段再看)。
- 缺陷是单独注入的,真实生成里多个问题会同时出现、互相影响。
