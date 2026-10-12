import { Fragment } from "react";
import data from "./data.json";

const severityClass: Record<string, string> = {
  "高": "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  "中": "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  "低": "bg-slate-200 text-slate-600 ring-1 ring-slate-300",
};

function SectionHeading({ no, title, sub }: { no: string; title: string; sub?: string }) {
  return (
    <div className="mb-6 flex items-end gap-3 border-b border-slate-200 pb-3">
      <span className="font-mono text-xs font-semibold text-indigo-500">{no}</span>
      <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
      {sub ? <span className="pb-0.5 text-xs text-slate-400">{sub}</span> : null}
    </div>
  );
}

export default function Page() {
  return (
    <div className="mx-auto w-[1152px] bg-white font-sans text-slate-900 antialiased">
      {/* 头部 */}
      <header className="relative border-b border-slate-200 px-12 py-10">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-indigo-500 via-sky-400 to-emerald-400" />
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.35em] text-indigo-500">UX FLOW MINING REPORT</p>
            <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-slate-900">{data.title}</h1>
            <p className="mt-3 text-sm text-slate-500">
              任务:{data.task}
              <span className="mx-2 text-slate-300">|</span>
              范围:{data.scope}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-right">
            <p className="text-[11px] text-slate-400">报告日期</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-700">{data.date}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-slate-900 px-6 py-5">
          <p className="text-[11px] font-semibold tracking-widest text-indigo-300">结论摘要</p>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-100">{data.summary}</p>
        </div>
      </header>

      {/* KPI */}
      <section className="border-b border-slate-200 px-12 py-10">
        <div className="grid grid-cols-4 gap-4">
          {data.kpis.map((k) => (
            <div
              key={k.key}
              className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5"
            >
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-[32px] font-bold leading-none tabular-nums text-slate-900">{k.value}</span>
                <span className="text-xs text-slate-400">{k.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 对比产品 */}
      <section className="border-b border-slate-200 px-12 py-10">
        <SectionHeading no="01" title="对比产品" sub={`共 ${data.products.length} 款`} />
        <div className="grid grid-cols-2 gap-4">
          {data.products.map((p) => (
            <div key={p.name} className="flex items-center gap-5 rounded-xl border border-slate-200 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                {p.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">{p.name}</h3>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                    {p.steps} 步
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    输入 {p.inputs}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm text-slate-600">{p.verdict}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 交互流程 */}
      <section className="border-b border-slate-200 px-12 py-10">
        <SectionHeading no="02" title="交互流程" sub="按屏拆解每一步的内容与动作" />
        <div className="space-y-10">
          {data.chains.map((chain) => {
            const flagged = data.issues.filter((i) => i.product === chain.product);
            return (
              <div key={chain.product}>
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-xl font-bold">{chain.product}</h3>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                    v{chain.version}
                  </span>
                  <span className="text-sm text-slate-500">{chain.verdict}</span>
                  <span className="ml-auto text-xs text-slate-400">{chain.steps.length} 屏</span>
                </div>

                <div className="flex items-stretch">
                  {chain.steps.map((step, i) => {
                    const hits = flagged.filter((f) => f.step === step.no);
                    return (
                      <Fragment key={step.no}>
                        {i > 0 ? (
                          <div className="flex w-5 shrink-0 items-center justify-center text-lg text-slate-300">
                            →
                          </div>
                        ) : null}
                        <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                              {step.no}
                            </span>
                            <span className="truncate text-sm font-semibold text-slate-800">{step.screen}</span>
                            {hits.length > 0 ? (
                              <span className="ml-auto shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                                {hits.map((h) => h.id).join(" ")}
                              </span>
                            ) : null}
                          </div>

                          <img
                            src={step.image}
                            alt={step.screen}
                            className="mt-3 h-[300px] w-full rounded-lg bg-slate-100 object-cover object-top ring-1 ring-slate-200"
                          />

                          <p className="mt-3 text-xs leading-relaxed text-slate-600">{step.content}</p>

                          <div className="mt-3 flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400">动作</span>
                            <span className="font-semibold text-indigo-600">→ {step.action}</span>
                          </div>

                          {step.note ? (
                            <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] leading-relaxed text-amber-800">
                              {step.note}
                            </p>
                          ) : null}
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 发现问题 */}
      <section className="border-b border-slate-200 px-12 py-10">
        <SectionHeading no="03" title="发现问题" sub={`共 ${data.issues.length} 个`} />
        <div className="space-y-3">
          {data.issues.map((issue) => (
            <div key={issue.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                {issue.id}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-[15px] font-bold">{issue.title}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      severityClass[issue.severity] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">
                    {issue.product} · 第 {issue.step} 步
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{issue.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 优化建议 */}
      <section className="px-12 py-10">
        <SectionHeading no="04" title="优化建议" sub={`共 ${data.suggestions.length} 条`} />
        <div className="grid grid-cols-2 gap-4">
          {data.suggestions.map((s) => (
            <div key={s.id} className="flex flex-col rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white">
                  {s.id}
                </span>
                <h3 className="text-[15px] font-bold text-slate-900">{s.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{s.detail}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400">依据</span>
                {s.basis.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-indigo-600"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 px-12 py-6 text-center text-xs text-slate-400">
        {data.title} · {data.scope} · {data.date}
      </footer>
    </div>
  );
}
