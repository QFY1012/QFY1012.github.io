# 实习项目页配图

项目页《自迭代的中台设计 Agent:框架设计与实践》的配图。每张图由 Python 脚本生成单个 HTML(内联 SVG,桌面与竖屏各一版),不参与网站构建;定稿后再接入 Astro 页面。

| 图 | 生成脚本 | 输出 |
|---|---|---|
| 背景(原有 Skill)与关键决策(拆解与分层) | `gen_bg.py` | `bg-flow.html` |
| Skill 层自迭代 | `gen_flow.py` | `skill-flow.html` |

```sh
python3 figures/internship/gen_bg.py      # 重新生成 HTML
node figures/internship/shot.mjs bg-flow  # 截图检查(png 不提交)
```
