# shadcn/ui new-york-v4(只读副本)

2026-10-11 从 https://ui.shadcn.com/r/styles/new-york-v4/ 下载的全部 ui 组件源码,`import { cn } from "cn"` 换成了 `@/lib/utils`,`@/registry/new-york-v4/ui/` 换成了 `@/components/ui/`(和 `shadcn add` 安装时一样)。现有 `app/src/components/ui/` 的 8 个文件和这里的同名文件完全一致。shadcn/ui 是 MIT 许可。

组件 Agent 不能联网,新增组件时从这里复制到 `app/src/components/ui/`,再按规范改样式(shadcn 原版带阴影、底色和规范外的字号、尺寸)。`index.json` 列出每个组件的文件和依赖;`missing` 不为空的组件依赖的包没有安装,不能用。
