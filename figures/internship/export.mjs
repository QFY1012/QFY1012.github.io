// 把定稿的配图 HTML 导出成 Astro 页面可以内嵌的片段:node figures/internship/export.mjs
// 每个 <figure> 一个片段(bg-flow 有两个),样式限定在 .fig-<名字> 之内,不影响页面其他部分。
// 输出 src/figures/internship/<名字>.html,项目页用 ?raw 导入后 set:html 内嵌(文字随页面字体渲染)。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, '..', '..', 'src', 'figures', 'internship');
const FIGURES = { 'bg-flow': ['bg-before', 'bg-split'], 'skill-flow': ['skill-flow'], 'output-flow': ['output-flow'] };

// 给一组 CSS 规则的选择器加前缀;body 规则去掉(页面自己有),:root 换成容器本身。
function scope(css, root) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const sel = css.slice(i, open).trim();
    if (sel.startsWith('@media')) {
      let depth = 1, j = open + 1;
      while (depth) { if (css[j] === '{') depth++; if (css[j] === '}') depth--; j++; }
      const inner = scope(css.slice(open + 1, j - 1), root);
      if (inner) rules.push(`${sel} { ${inner} }`);
      i = j;
      continue;
    }
    const close = css.indexOf('}', open);
    const body = css.slice(open + 1, close).trim();
    i = close + 1;
    const sels = sel.split(',').map((s) => s.trim()).filter((s) => s !== 'body');
    if (!sels.length) continue;
    rules.push(`${sels.map((s) => (s === ':root' ? root : s === '*' ? `${root} *` : `${root} ${s}`)).join(', ')} { ${body} }`);
  }
  return rules.join('\n');
}

fs.mkdirSync(out, { recursive: true });
for (const [src, names] of Object.entries(FIGURES)) {
  const html = fs.readFileSync(path.join(dir, `${src}.html`), 'utf8');
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const figures = [...html.matchAll(/<figure>([\s\S]*?)<\/figure>/g)].map((m) => m[1].trim());
  if (figures.length !== names.length) throw new Error(`${src}.html 里有 ${figures.length} 张图,预期 ${names.length} 张`);
  names.forEach((name, k) => {
    const root = `.fig-${name}`;
    // figure 自带的上下外边距留给页面排版。
    const style = (scope(css, root) + `\n${root} figure { margin: 0 auto; }`).replace(/url\(#([^)]+)\)/g, `url(#${name}-$1)`);
    // 几张图的箭头、底纹用了同样的 id,同一页里会互相引用错:id 前面加上图名。
    const body = figures[k]
      .replace(/\bid="([^"]+)"/g, `id="${name}-$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${name}-$1)`)
      .replace(/href="#([^"]+)"/g, `href="#${name}-$1"`);
    fs.writeFileSync(path.join(out, `${name}.html`), `<style>\n${style}\n</style>\n<figure>\n${body}\n</figure>\n`);
    console.log(`写出 src/figures/internship/${name}.html(来自 ${src}.html 第 ${k + 1} 张)`);
  });
}
