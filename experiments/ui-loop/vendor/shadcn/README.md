# shadcn/ui new-york-v4(只读副本)

2026-10-11 从 https://ui.shadcn.com/r/styles/new-york-v4/ 下载的全部 ui 组件源码(`ui/`,61 个)和 sidebar 用到的 hook(`hooks/use-mobile.ts`),`import { cn } from "cn"` 换成了 `@/lib/utils`,`@/registry/new-york-v4/ui/` 换成了 `@/components/ui/`,`@/registry/new-york-v4/hooks/` 换成了 `@/hooks/`(和 `shadcn add` 安装时一样)。现有 `app/src/components/ui/` 的 8 个文件和这里的同名文件完全一致。shadcn/ui 是 MIT 许可。

组件 Agent 不能联网,新增组件时从这里原样复制(`ui/` → `app/src/components/ui/`,`hooks/` → `app/src/hooks/`)。`index.json` 列出每个组件的文件和依赖。所有依赖的 npm 包都已装进 `package.json`(calendar、carousel、combobox、command、drawer、form、input-otp、resizable、sonner、message-scroller 用到的 react-day-picker、date-fns、embla-carousel-react、@base-ui/react、cmdk、vaul、react-hook-form、@hookform/resolvers、zod、input-otp、react-resizable-panels、sonner、next-themes、@shadcn/react),61 个组件全部在沙箱里构建、渲染通过;`missing` 都为空。
