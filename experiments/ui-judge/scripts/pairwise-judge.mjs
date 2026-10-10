// The stage-3 pairwise judge: prompt and API call, shared by the validation
// run (scripts/aesthetic-validate.mjs) and the eval set (scripts/evalset-judge.mjs).
import fs from "node:fs"

// Same wording as scripts/aesthetic.mjs.
export const PRINCIPLE_TEXT = `评审标准(与具体风格无关):
1. 装饰必须表达信息:卡片、边框、底色、阴影、颜色只用于区分真正独立的对象或表达状态;能用间距分组的,不必再加容器。
2. 留白要成形:空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间;大面积而规整的留白不是缺点。
3. 主次分明:同一水平带里的内容要么同类、分量相同,要么有明显的主次;分量相当的不同内容并排是问题。
4. 疏密一致:同类元素的行距和间距一致,不为凑齐高度而拉开或压缩。
5. 有系统:整页使用统一的间距层级和对齐主轴,字号种类少且层级明确。
6. 精致:图形线条克制,颜色只表达含义;中文使用全角标点,数字字体统一。

`
export const system = (principles) => `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量:整体的比例、疏密节奏、主次对比、对齐与留白、组件和字体的精致度。不比较内容。

${principles ? PRINCIPLE_TEXT : ""}
判断哪一版更好。只输出 JSON:{"better":"A" 或 "B","reason":"一两句话"}`

// Variants under test on the eval set (scripts/evalset-judge.mjs --cond):
//   principles    the prompt above (baseline)
//   principles2   PRINCIPLE_TEXT_2: crowding judged screen by screen, observations first
//   principles3   PRINCIPLE_TEXT_3: principles2 aligned on redundant decoration and emphasis
//   perprinciple3 principles3 compared principle by principle, then an overall pick
//   rubric6       RUBRIC_6, rewritten after alignment: six principles one by one, then an overall pick
//   rubric7       RUBRIC_7: rubric6 after a second alignment pass, concrete criteria and generic counterexamples
//   rubric8       RUBRIC_8: rubric7 with crowding as a bar to clear (both clear it: a tie) and no ranking of the principles
//   rubric9       RUBRIC_9: rubric8 with hierarchy as levels of type mapping levels of content, emphasis relative
//   rubric10      RUBRIC_10: rubric9 with density both ways, two or three groups of information a screen
//   rubric11      RUBRIC_11: rubric10 with crowding counted on the fullest tile, dilution as blank area on the emptiest
//   rubric12      RUBRIC_12: rubric9 with alignment judged on the content edges, not on containers
//   rubric14      RUBRIC_14: rubric11 with dilution at six tenths blank instead of more than half
//   rubric15      RUBRIC_15: rubric9 with spacing only in principle 2, as a range (two to four lines) and even
//   rubric16      RUBRIC_16: rubric9 with criterion 4 counting only size and weight as emphasis
//   rubric17      RUBRIC_17: rubric16 with criterion 4's observation prompt asking for size and weight too
//   rubric18      RUBRIC_18: rubric9 with criterion 2 asking that gaps of one level are the same everywhere
//   rubric19      RUBRIC_19: rubric9 with criterion 2's gap ratio as a range on both sides (three to four)
//   rubric20      RUBRIC_20: rubric9 with criterion 5 judging whether colours form one set, not how many
//   rubric21      RUBRIC_21: rubric9 with criterion 4 judging where emphasis lands, not how much or how loud
//   roomy         principle 2 also names crowding as a defect
//   perprinciple  the same principles, compared one by one before the verdict
//   crowd         principle 2 names both kinds of crowding as a serious defect
//   crowd-anchor  crowd, plus one crowded page shown as a reference (ANCHOR_TEXT)
//   dims          the decoupled DIMENSIONS, judged one by one in one call, then a verdict
//   dims-sep      one call per dimension (systemForDim); the verdict is the majority (scripts/evalset-judge.mjs)
//   dims2-sep     dims-sep with DIMENSIONS_V2
//   dims3-sep     dims-sep with DIMENSIONS_V3 (only alignment differs from v2)
//   dims3v-sep    dims3-sep, with space and grouping asked three times and taken by majority (scripts/evalset-judge.mjs)
//   dims4-sep     dims3-sep with DIMENSIONS_V4 (space and grouping rewritten, observations first)
export const ROOMY_2 = "2. 留白要充足且成形:内容挤满页面、各部分之间缺少明显间隔是缺点;空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间;大面积而规整的留白不是缺点。"
// Crowding of both kinds the person named: content spread over the full width
// with no room around it, and a block packed with different things that are not
// spaced apart.
export const CROWD_2 = "2. 留白充足且成形:版面要有呼吸空间。拥挤是严重缺点,有两种:一是内容铺满整个页宽、四周不留余地;二是同一区块里塞进多种不同内容,彼此没有拉开间距。不同类内容之间的间距应明显大于同类内容之间的间距。拥挤不能用「紧凑」「统一」「信息完整」来抵消。空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间;大面积而规整的留白不是缺点,只放标题的边栏留白也不是。"
// principles2: principle 1 no longer rewards taking containers away when the
// groups are then not spaced apart, principle 2 judges crowding screen by screen
// (the observation that the space dimension in dims4-sep makes), and the judge
// writes those observations down before the verdict.
export const PRINCIPLE_TEXT_2 = `评审标准(与具体风格无关):
1. 装饰必须表达信息:卡片、边框、底色、阴影、颜色只用于区分真正独立的对象或表达状态;能用间距分组的,不必再加容器。但去掉容器的前提是组与组之间真的拉开了间距(组间距明显大于组内距);去掉容器后几组内容挤在一起,比保留容器更差。
2. 不拥挤:按屏看(每张切块约为一屏),数一数每屏里有几种不同的内容(一段文字、一组数字、一张图、一张表、一个列表各算一种),看相邻两块内容之间的空白大约是正文行高的几倍。同一屏里内容种类越多、块间空白越窄,越拥挤;几块不同内容并排挤在一行比上下排开更拥挤。拥挤是严重缺点,不能用「去掉了容器」「主次分明」「紧凑」「信息完整」来抵消。页面四周的大片留白不能抵消内容区内部的拥挤。
3. 主次分明:同一水平带里的内容要么同类、分量相同,要么有明显的主次;分量相当的不同内容并排是问题。
4. 疏密一致:同类元素的行距和间距一致,不为凑齐高度而拉开或压缩。
5. 有系统:整页使用统一的间距层级和对齐主轴,字号种类少且层级明确。
6. 精致:图形线条克制,颜色只表达含义;中文使用全角标点,数字字体统一。

`
export const system2 = () => `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量:整体的比例、疏密节奏、主次对比、对齐与留白、组件和字体的精致度。不比较内容。

${PRINCIPLE_TEXT_2}先写下两版最拥挤的那一屏的观察,再判断哪一版更好。只输出 JSON:{"A":"A 版最拥挤的一屏:几种内容、块间空白约几行高","B":"B 版同上","better":"A" 或 "B","reason":"一两句话"}`
// principles3: principles2 aligned with the person's reasons on the pairs the
// judge kept getting wrong. Every piece of decoration is checked for being
// redundant (uniform cards are no merit), emphasis by a fill or colour on the
// one most important block is not redundant, whitespace should come in clean
// blocks again, emphasis needs no oversized numbers, and "uniform containers"
// do not count as a system.
export const PRINCIPLES_3 = [
  { id: "decoration", see: "列出多余的装饰,没有就写「无」", name: "不要多余的装饰", text: "卡片、边框、底色、阴影、颜色都是装饰,每一处都要检查是否多余。检查方法:把它去掉,内容的分组、含义和重点是否仍然看得出来;看得出来,它就是多余的。多余的装饰是缺点。卡片样式统一、排列整齐不算优点,统一的多余装饰仍然是多余装饰。用底色或颜色把全页最重要的一块(比如标题和核心指标)突出出来,是在表达重点,不算多余;每块都同样套上,等于什么都没突出,才是多余。区分真正独立的对象(比如一条一条的发现)或表达状态(比如告警)的装饰也有必要。" },
  { id: "crowding", see: "最拥挤的一屏:几种内容、块间空白约几行高", name: "不拥挤", text: "按屏看(每张切块约为一屏),数一数每屏里有几种不同的内容(一段文字、一组数字、一张图、一张表、一个列表各算一种),看相邻两块内容之间的空白大约是正文行高的几倍。同一屏里内容种类越多、块间空白越窄,越拥挤;几块不同内容并排挤在一行比上下排开更拥挤。拥挤是严重缺点,不能用「去掉了容器」「主次分明」「紧凑」「信息完整」来抵消。页面四周的大片留白不能抵消内容区内部的拥挤。空白应是规整、与网格对齐的整块区域,而不是零碎、不规则的剩余空间。" },
  { id: "emphasis", see: "最先看到的是什么;有没有分量相当的不同内容并排", name: "主次分明", text: "同一水平带里的内容要么同类、分量相同,要么有明显的主次;分量相当的不同内容并排是问题。主次指最重要的信息能先被看到,不需要刻意放大。" },
  { id: "rhythm", see: "同类元素的间距是否一致,哪里不一致", name: "疏密一致", text: "同类元素的行距和间距一致,不为凑齐高度而拉开或压缩。" },
  { id: "system", see: "间距层级、对齐主轴、字号种类各怎样", name: "有系统", text: "整页使用统一的间距层级和对齐主轴,字号种类少且层级明确。「统一」指间距层级、对齐和字号统一;每块都套同样的容器不算有系统。" },
  { id: "finish", see: "线条、颜色用途、标点、数字字体有什么问题", name: "精致", text: "图形线条克制,颜色只用来表达含义或突出重点;中文使用全角标点,数字字体统一。" },
]
export const PRINCIPLE_TEXT_3 = `评审标准(与具体风格无关):
${PRINCIPLES_3.map((p, i) => `${i + 1}. ${p.name}:${p.text}`).join("\n")}

`
export const system3 = () => `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量:整体的比例、疏密节奏、主次对比、对齐与留白、组件和字体的精致度。不比较内容。

${PRINCIPLE_TEXT_3}先写下两版最拥挤的那一屏和多余的装饰,再判断哪一版更好。只输出 JSON:{"A":"A 版最拥挤的一屏:几种内容、块间空白约几行高","A装饰":"A 版多余的装饰,没有就写「无」","B":"B 版最拥挤的一屏,同上","B装饰":"B 版多余的装饰,同上","better":"A" 或 "B","reason":"一两句话"}`
// perprinciple3: the principles3 text, but the judge goes through the six one
// by one (what it sees in A, in B, which is better) and then picks overall,
// with crowding and redundant decoration weighing most.
export const system3each = () => `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量,不比较内容。

${PRINCIPLE_TEXT_3}按六条标准逐条比较:每条先分别写下 A 版和 B 版的观察,再给出这一条哪版更好("A"、"B" 或 "平")。六条都比完后,综合给出总体哪一版更好,其中第 1、2 条最重要。
只输出 JSON:{${PRINCIPLES_3.map((p, i) => `"${i + 1}":{"A":"A 版:${p.see}","B":"B 版同上","better":"A|B|平"}`).join(",")},"better":"A" 或 "B","reason":"一两句话"}`
// rubric6: rewritten from scratch after the alignment pass instead of patched.
// Each principle says what good looks like and how to look for it, one thing
// each, in order of importance; finish is dropped (it hardly ever separated
// two versions) and grouping is in (the dimension that agreed with the person
// most). The judge goes through them one by one, then picks overall.
export const RUBRIC_6 = [
  { name: "疏朗", good: "每屏只放少数几种内容,内容块之间留出明显的空白,不同内容上下排开", look: "每屏有几种内容(一段文字、一组数字、一张图、一张表、一个列表各算一种),块与块之间的空白大约几行高,有没有几块不同内容并排挤在一行", see: "最拥挤的一屏有几种内容、块间空白约几行高" },
  { name: "分组清楚", good: "只凭间距就能看出哪些内容是一组", look: "先列出页面上有哪几组内容,再比较组与组之间的距离和组内元素之间的距离,组间距应明显大于组内距", see: "组内距和组间距大约多少" },
  { name: "装饰各有用处", good: "每一处卡片、边框、分隔线、底色、阴影和颜色都承担一个作用:区分独立的对象、表示状态,或突出全页最重要的那一块", look: "逐处设想把它去掉,看是否损失了什么;什么都不损失的就是多余的", see: "多余的装饰,没有就写「无」" },
  { name: "重点清楚", good: "一眼先看到最重要的信息,其余内容按重要程度依次减弱", look: "第一眼落在哪里,那是不是最重要的内容", see: "第一眼落在哪里" },
  { name: "同类一致", good: "同一类内容(几个指标、几张图、几条发现)用同样的字号、间距和呈现形式", look: "找出页面上的同类内容,逐一比较它们的处理方式", see: "哪些同类内容处理得不一样" },
  { name: "对齐,留白成形", good: "元素落在少数几条对齐线上,空白是规整的整块", look: "左右边缘和并排块的顶部是否对齐,空白是整块的还是零碎的", see: "哪里没对齐、哪里空白零碎" },
]
export const systemRubric6 = () => `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量,不比较内容。

评审标准(按重要程度排列):
${RUBRIC_6.map((p, i) => `${i + 1}. ${p.name}:${p.good}。怎么看:${p.look}。`).join("\n")}

逐条比较:每条先按「怎么看」分别写下 A 版和 B 版的观察,再给出这一条哪版更好("A"、"B" 或 "平")。六条比完后,综合给出总体哪一版更好。
只输出 JSON:{${RUBRIC_6.map((p, i) => `"${i + 1}":{"A":"A 版${p.see}","B":"B 版同上","better":"A|B|平"}`).join(",")},"better":"A" 或 "B","reason":"一两句话"}`
// rubric7: rubric6 after a second alignment pass. Each principle is one or two
// sentences with criteria that can be checked by looking, plus at most one
// counterexample that is generic (none of them describes a page in the eval
// set). Grouping now asks for rhythm, alignment became positive and negative
// shapes, and tone was added. The thresholds (three kinds of content a screen,
// two lines of space, twice the distance) are first guesses.
export const RUBRIC_7 = [
  { name: "疏朗", rule: "每屏(每张切块)不超过三种内容,一段文字、一组数字、一张图、一张表、一个列表各算一种;块与块之间的空白至少约两行正文高;不同种类的内容上下排开,不并排挤在同一行", bad: "一屏里同时塞了说明文字、一排数字、两张图和一张表,块之间只隔一行", see: "每屏最多几种内容、块间空白约几行高、有没有不同内容并排" },
  { name: "分组清楚,有节奏", rule: "间距至少分两级,组与组之间的间距约是组内间距的两倍以上;所有间距都差不多大,就等于没有分组", bad: "所有模块按同一个间距排成均匀的格子", see: "组内距和组间距大约多少" },
  { name: "装饰各有用处", rule: "每一处卡片、边框、分隔线、底色、阴影和颜色,都要说得出作用:区分独立的对象、表示状态(如告警),或突出全页最重要的那一块;说不出作用的就是多余的", bad: "每个模块都套着同样的白底圆角边框卡片", see: "说不出作用的装饰,没有就写「无」" },
  { name: "重点清楚", rule: "全页最重要的信息(通常是结论或核心指标)字号最大或颜色最重,第一眼就能看到;其余内容的分量逐级减弱", bad: "结论和次要说明用了同样的字号和颜色", see: "最重要的信息是什么、是不是字号最大或颜色最重" },
  { name: "调性统一", rule: "除黑白灰外,彩色不超过两种,饱和度接近;视觉最重的一块(实心填色面积最大的)是最重要的内容;线条粗细接近", bad: "全页是黑灰细线,唯独一个次要模块用了大面积高饱和的荧光色块", see: "用到哪些彩色、最重的一块是什么、线条粗细是否接近" },
  { name: "同类一致", rule: "同一类内容(几个指标、几张图、几条发现)用同样的字号、间距和呈现形式", bad: "三条发现,一条用卡片,两条用纯文字", see: "哪些同类内容处理得不一样" },
  { name: "正负形整齐", rule: "内容块和块之间的空白都是规整的矩形,边缘落在少数几条共同的竖线和横线上", bad: "几块内容高低不齐,之间留下 L 形或锯齿形的空白", see: "哪些内容块边缘没落在共同线上、哪些空白不成矩形" },
]
export const systemRubric7 = () => `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量,不比较内容。

评审标准(按重要程度排列):
${RUBRIC_7.map((p, i) => `${i + 1}. ${p.name}:${p.rule}。反例:${p.bad}。`).join("\n")}

逐条比较:每条先分别写下 A 版和 B 版的观察,再给出这一条哪版更好("A"、"B" 或 "平")。七条比完后,综合给出总体哪一版更好。
只输出 JSON:{${RUBRIC_7.map((p, i) => `"${i + 1}":{"A":"A 版${p.see}","B":"B 版同上","better":"A|B|平"}`).join(",")},"better":"A" 或 "B","reason":"一两句话"}`
// rubric8: rubric7 with principle 1 put back to what it was meant to be, a
// bar to clear rather than "the emptier the better". Two pages that both clear
// it tie on it, side by side placement is no longer a fault in itself, and the
// principles are no longer ranked, so the overall pick weighs them together.
export const RUBRIC_8 = [
  { name: "不拥挤", rule: "只看是否过线,不比谁更空。过线指:每屏(每张切块)不超过三种内容,一段文字、一组数字、一张图、一张表、一个列表各算一种;块与块之间的空白至少约两行正文高。两版都过线,这一条记「平」;都没过线,超出少的那版更好", bad: "一屏里同时塞了说明文字、一排数字、两张图和一张表,块之间只隔一行", see: "最挤的一屏有几种内容、块间空白约几行高、是否过线" },
  ...RUBRIC_7.slice(1),
]
// One principle after another, then an overall pick weighing them together.
export const systemRubricOf = (rubric) => `你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计质量,不比较内容。

评审标准:
${rubric.map((p, i) => `${i + 1}. ${p.name}:${p.rule}。反例:${p.bad}。`).join("\n")}

逐条比较:每条先分别写下 A 版和 B 版的观察,再给出这一条哪版更好("A"、"B" 或 "平")。${["", "一", "二", "三", "四", "五", "六", "七", "八", "九"][rubric.length]}条比完后,综合各条给出总体哪一版更好。
只输出 JSON:{${rubric.map((p, i) => `"${i + 1}":{"A":"A 版${p.see}","B":"B 版同上","better":"A|B|平"}`).join(",")},"better":"A" 或 "B","reason":"一两句话"}`
export const systemRubric8 = () => systemRubricOf(RUBRIC_8)
// rubric9: rubric8 with principle 4 rewritten. "The most important thing is
// the biggest or the heaviest" made the judge reward whichever page shouts
// loudest (a giant number, an alert box); hierarchy is rather that a few
// distinct levels of type map onto the levels of the content, and emphasis is
// relative, so the more places are emphasised the less each one weighs.
export const RUBRIC_9 = RUBRIC_8.map((p, i) => i !== 3 ? p : {
  name: "层级清楚",
  rule: "字号和字重只分少数几级(如标题、小节标题、正文、注释),每一级对应内容结构里的一层,同一层的内容用同一级,相邻两级的差别一眼可辨;内容的重要程度靠先后位置和所在层级体现。强调是相对的:放大、加粗、加色、加框的地方越多,每一处就越轻",
  bad: "页面上有五六种字号,小节标题和正文只差一点,另有几处数字和提示被各自放大、加色,分不出哪些是同一层",
  see: "分了几级字号字重、每级对应哪层内容、有几处额外强调",
})
export const systemRubric9 = () => systemRubricOf(RUBRIC_9)
// rubric10: rubric9 with principle 1 as density both ways, the person's
// measure: two or three groups of information a screen. Fewer is diluted
// (one number alone on a screen), more is crowded. A group is what is read as
// one thing; how far apart the groups sit is left to principle 2.
export const RUBRIC_10 = RUBRIC_9.map((p, i) => i !== 0 ? p : {
  name: "疏密适度",
  rule: "每屏(每张切块)放两到三个信息组。一个信息组是读的时候当作一件事的一块:一个小标题连同它下面的图、表或文字,一排并列的指标,一组并列的发现,各算一组;一组跨两张切块时,按它在这一张里露出的部分算。超过三组是拥挤,只有一组、其余是大片空白是稀疏,两种都是缺点;两版都在两到三组之内,这一条记「平」",
  bad: "一屏里挤了五六个信息组;或者一屏只放了一张小图,其余都是空白",
  see: "每张切块各有几个信息组",
})
export const systemRubric10 = () => systemRubricOf(RUBRIC_10)
// rubric11: rubric10 with principle 1 measured where it is decided instead
// of tile by tile. Counting groups on every tile was noisy, and it called the
// last tile (where a page simply ends) and a long table filling a tile sparse.
// Crowding is the group count on the fullest tile; dilution is how much of
// the emptiest tile, the last one aside, is blank.
export const RUBRIC_11 = RUBRIC_10.map((p, i) => i !== 0 ? p : {
  name: "疏密适度",
  rule: "看两头。最满的一屏(一张切块):数信息组,一个信息组是读的时候当作一件事的一块,如一个小标题连同它下面的图、表或文字、一排并列的指标、一组并列的发现;超过三组是拥挤。最空的一屏(不算页面最后一张切块):看空白占了多大面积,大半是空白是稀疏。两头都没问题,这一条记「平」",
  bad: "一屏里挤了五六个信息组;或者一屏只放了一张小图,其余都是空白",
  see: "最满的一屏有几个信息组;最空的一屏(不算最后一张)空白约占几成",
})
export const systemRubric11 = () => systemRubricOf(RUBRIC_11)
// rubric12: rubric9 with principle 7 decoupled from decoration. Its edges were
// any edges, so boxing every block in same-width cards made a page "aligned"
// by construction; when 3 (decoration) and 7 disagreed the person sided with 3
// three times out of four. Alignment now looks at the content's own edges.
export const RUBRIC_12 = RUBRIC_9.map((p, i) => i !== 6 ? p : {
  name: "正负形整齐",
  rule: "只看内容本身的边缘:文字的起止、图表和表格的边,不看卡片、边框、底色的外框(外框归第 3 条)。内容的边缘落在少数几条共同的竖线和横线上,内容块之间的空白是规整的矩形",
  bad: "几块内容高低不齐,之间留下 L 形或锯齿形的空白",
  see: "内容本身(不算外框)的边缘落在几条共同线上、哪些空白不成矩形",
})
export const systemRubric12 = () => systemRubricOf(RUBRIC_12)
// rubric13 (dropped after 7 judgements): rubric11 plus "crowding is a heavy
// defect, dilution a light one". Two adjectives the judge cannot check.
// rubric14: rubric11 with the dilution bar where the measurements put it. The
// judge reports the emptiest tile's blank share with about one tenth of noise,
// and half a tenth higher for the page shown second; "more than half blank"
// sat on that noise (ordinary pages read 3.5 to 4.5 tenths, diluted ones 6 to 7.6).
export const RUBRIC_14 = RUBRIC_11.map((p, i) => i !== 0 ? p : {
  ...p,
  rule: p.rule.replace("大半是空白是稀疏", "空白占六成以上是稀疏"),
})
export const systemRubric14 = () => systemRubricOf(RUBRIC_14)
// rubric15: rubric9 with spacing judged in one place, as a range with both
// ends and evenness. Written only as a floor ("at least twice"), principle 2
// read as "the farther apart the clearer", and diluted pages won on it: in
// pixels the person's first choices space their sections about two to four
// lines apart and evenly, the diluted second choices four to eight lines with
// one gap far larger than the rest. Principle 1 loses its own spacing clause.
export const RUBRIC_15 = RUBRIC_9.map((p, i) => {
  if (i === 0) return { ...p, rule: p.rule.replace(";块与块之间的空白至少约两行正文高", ""), bad: "一屏里同时塞了说明文字、一排数字、两张图和一张表", see: "最挤的一屏有几种内容、是否过线" }
  if (i === 1) return {
    name: "分组清楚,间距匀称",
    rule: "间距分两三级:组内紧,组与组之间约空两到四行正文高,同一级的间距处处相同。组间距不到两行,相邻的组粘在一起;超过五行,或某处忽然空出一大段,组与组就脱节,页面显得散",
    bad: "所有模块按同一个间距排成均匀的格子;或者有的节之间隔一行、有的隔八行",
    see: "组内距、组间距各约几行,各处组间距是否一样",
  }
  return p
})
export const systemRubric15 = () => systemRubricOf(RUBRIC_15)
// rubric16: criterion 4 counts only size and weight as emphasis; colour is judged
// in criterion 5 and frames in criterion 3, so neither is counted twice.
export const RUBRIC_16 = RUBRIC_9.map((p, i) => i === 3 ? { ...p, rule: p.rule.replace("放大、加粗、加色、加框的地方越多", "放大、加粗的地方越多") } : p)
export const systemRubric16 = () => systemRubricOf(RUBRIC_16)
// rubric17: rubric16 with the observation prompt asking for size and weight only,
// since the judge counts whatever the prompt calls emphasis, colour included.
export const RUBRIC_17 = RUBRIC_16.map((p, i) => i === 3 ? { ...p, see: p.see.replace("有几处额外强调", "有几处额外放大或加粗") } : p)
export const systemRubric17 = () => systemRubricOf(RUBRIC_17)
// rubric18: rubric9 with criterion 2 also asking that gaps of one level are the
// same everywhere. The ratio alone was read as "the bigger the better", so
// loose pages with gaps jumping between 60 and 300 px won; no absolute sizes.
export const RUBRIC_18 = RUBRIC_9.map((p, i) => i === 1 ? {
  ...p,
  rule: p.rule.replace("组内间距的两倍以上;", "组内间距的两倍以上,同一级的间距处处相同;"),
  see: "组内距和组间距大约多少、同一级的间距是否处处相同",
} : p)
export const systemRubric18 = () => systemRubricOf(RUBRIC_18)
// rubric19: rubric9 with criterion 2's ratio as a range on both sides. The person's
// pages peak at a ratio of three to four (as the judge itself estimates it); two
// does not separate groups, five and more pulls them apart.
export const RUBRIC_19 = RUBRIC_9.map((p, i) => i === 1 ? {
  ...p,
  rule: "间距分两级,组与组之间的间距约是组内间距的三四倍:不到两倍,组与组分不开;超过五倍,组与组之间隔得太远,页面散成一块一块",
  see: "组内距和组间距大约多少、约几倍",
} : p)
export const systemRubric19 = () => systemRubricOf(RUBRIC_19)
// rubric20: rubric9 with criterion 5 judging whether the colours form one set
// (each colour means one thing, the same thing keeps its colour, the colours sit
// together) instead of counting them. Counting made a page that is colourful but
// unified lose to a plain one.
export const RUBRIC_20 = RUBRIC_9.map((p, i) => i === 4 ? {
  ...p,
  rule: p.rule.replace("除黑白灰外,彩色不超过两种,饱和度接近", "颜色成一套:每种彩色在全页只表示一种意思,同一种意思处处用同一种颜色,各色的饱和度和明度协调;用几种颜色不论"),
  see: "每种彩色表示什么、有没有同一意思换了颜色或颜色之间不协调、最重的一块是什么、线条粗细是否接近",
} : p)
export const systemRubric20 = () => systemRubricOf(RUBRIC_20)
// rubric21: rubric9 with criterion 4 asking where each extra emphasis lands
// instead of counting them. Counting made a page lose for a badge on its own
// verdict; rubric7's "the most important thing is the biggest" rewarded the
// loudest hero number. Placement is neither: emphasis on the conclusion or a
// key figure is right however much of it there is, on anything else it is wrong.
export const RUBRIC_21 = RUBRIC_9.map((p, i) => i === 3 ? {
  ...p,
  rule: p.rule.replace("强调是相对的:放大、加粗、加色、加框的地方越多,每一处就越轻", "额外的强调(放大、加粗、加色、加框)只用在结论和核心数字上;用在编号、按钮、装饰或次要说明上,就是强调错了地方。强调用得多少、做得多醒目不论"),
  see: "分了几级字号字重、每级对应哪层内容、每处额外强调落在什么内容上",
} : p)
export const systemRubric21 = () => systemRubricOf(RUBRIC_21)
export const ANCHOR_TEXT ="参考示例(另一版页面,不参与本次比较):下图是典型的拥挤页面。内容铺满整个页宽、四周没有余地;每个区块都塞得很满,区块之间只隔一条细缝,不同内容之间没有拉开间距。它看起来紧凑、信息完整,但这是差的设计。"
// Decoupled dimensions: each looks at one thing and says what it leaves out,
// so that no two share a concept (spacing amount, spacing relations, alignment,
// emphasis, consistency, ink, finish).
export const DIMENSIONS = [
  { id: "space", name: "空间", look: "有没有呼吸空间:内容是否铺满页宽、四周有无余地;区块里是否塞得太满", skip: "空白的形状、是否对齐" },
  { id: "grouping", name: "分组", look: "间距是否表达关系:组与组之间的距离明显大于组内,一眼看出哪些内容是一组", skip: "空白的总量" },
  { id: "alignment", name: "对齐", look: "元素是否落在少数几条共用的对齐线上,留白是否成整块", skip: "间距的大小" },
  { id: "hierarchy", name: "层级", look: "最重要的信息是否最先被看到;字号、字重种类少,层级清楚", skip: "元素的位置" },
  { id: "consistency", name: "一致", look: "同类元素是否同样处理(间距、字号、组件样式)", skip: "好不好看" },
  { id: "ink", name: "装饰", look: "容器、边框、底色、阴影、线条、颜色是否必要且克制,颜色只表达含义", skip: "排版" },
  { id: "finish", name: "细节", look: "中文全角标点、数字字体统一、文字不截断不溢出", skip: "布局" },
]
// v2: every dimension but ink is judged on the content alone, with all cards,
// borders and fills taken away in the mind's eye, so a container can neither
// earn nor lose those dimensions. Space is about density, not page width.
const STRIP = "先在脑中去掉页面上所有卡片、边框、底色和阴影,只看剩下的文字、数字和图表。"
export const DIMENSIONS_V2 = [
  { id: "space", name: "空间", look: `${STRIP}同样面积里塞了多少不同的东西;块与块、行与行之间是否拉开,有呼吸感`, skip: "内容是否铺满页宽、空白的形状" },
  { id: "grouping", name: "分组", look: `${STRIP}只凭元素之间的距离,能否看出哪些内容是一组;组与组之间的距离是否明显大于组内`, skip: "卡片和边框——它们不算分组手段" },
  { id: "alignment", name: "对齐", look: `${STRIP}文字、数字、图表的边缘是否落在少数几条共用的线上,留白是否成整块`, skip: "卡片边缘是否对齐、间距的大小" },
  { id: "hierarchy", name: "层级", look: `${STRIP}只凭字号、字重和颜色深浅,最重要的信息是否最先被看到;字号种类少,层级清楚`, skip: "卡片、底色带来的突出、元素的位置" },
  { id: "consistency", name: "一致", look: `${STRIP}同一类信息(几个指标、几张图、几段说明)在字号、间距、呈现形式上是否处理相同`, skip: "是否用了同一种容器——那不算一致" },
  { id: "ink", name: "装饰", look: "容器、边框、底色、阴影、线条、颜色是否必要且克制,能用间距分组的不加容器,颜色只表达含义", skip: "排版" },
  { id: "finish", name: "细节", look: "中文全角标点、数字字体统一、文字不截断不溢出", skip: "布局" },
]

// v3: v2 with alignment judged as "are the things that should line up lined
// up", not as a count of shared lines (a single column has one line and is not
// thereby well aligned).
export const DIMENSIONS_V3 = DIMENSIONS_V2.map((d) =>
  d.id !== "alignment"
    ? d
    : {
        ...d,
        look: `${STRIP}该对齐的东西有没有对齐:同一行的数字和文字是否在同一基线上,同一列的左右边缘是否在同一条线上,并排的块顶部和底部是否齐平;有没有差几个像素的错位`,
        skip: "对齐线的数量(单栏只有一条线不等于对齐得好)、间距的大小",
      },
)

// v4: v3 with space and grouping given concrete things to observe, and the
// judge writes its observations down before the verdict. Cards packed in a
// grid can no longer read as "roomy" or "well grouped" by their tidiness:
// space counts how many kinds of content share one screen, grouping lists
// the groups first and then compares the distances.
export const DIMENSIONS_V4 = DIMENSIONS_V3.map((d) =>
  d.id === "space"
    ? {
        ...d,
        look: `${STRIP}按屏看(每张切块约为一屏):每屏里有几种不同的内容(一段文字、一组数字、一张图、一张表、一个列表各算一种),相邻两块内容之间的空白大约是正文行高的几倍。同一屏里内容种类越多、块间空白越窄,越拥挤;几块内容并排挤在一行比上下排开更拥挤`,
        skip: "内容是否铺满页宽、空白的形状、页面总长度、卡片是否排得整齐",
        out: '{"A":"A 版每屏的内容种类数和块间空白,如:3 种、约 3 行高;5 种、约 1 行高","B":"B 版同上","better":"A"、"B" 或 "平","reason":"一两句话"}',
      }
    : d.id === "grouping"
      ? {
          ...d,
          look: `${STRIP}先列出页面上有哪几组内容(比如结论、几个指标、走势、明细、发现);再估计每组内部元素之间的距离和组与组之间的距离。组间距明显大于组内距(两倍以上)才算分得清;几组不相干的内容并排放着、彼此只隔一条窄缝,算分不清`,
          skip: "卡片和边框——它们不算分组手段;分组是否合乎内容逻辑",
          out: '{"groups":"页面上的几组内容","A":"A 版组内距和组间距大约多少","B":"B 版同上","better":"A"、"B" 或 "平","reason":"一两句话"}',
        }
      : d,
)

const INTRO ="你是资深 UI 视觉设计评审。下面是同一份报告的两版页面设计 A 和 B,数据相同。只比较视觉设计,不比较内容。"
const dimLine = (d, i) => `${i + 1}. ${d.name}:只看${d.look}。不看${d.skip}。`
// One dimension per call: the judge sees no other dimension and gives no overall verdict.
export const systemForDim = (d) => `${INTRO}

这次只比较一个方面——${d.name}。
只看:${d.look}。
不看:${d.skip}。页面在其他方面再好或再差,都不影响这一项。两版在这一方面差不多时回答「平」。

${d.out ? "先写下观察,再下结论。" : ""}只输出 JSON:${d.out ?? '{"better":"A"、"B" 或 "平","reason":"一两句话"}'}`

export function systemFor(cond) {
  if (cond === "dims")
    return `${INTRO}

评审维度(每一维只看一件事):
${DIMENSIONS.map(dimLine).join("\n")}

逐维独立判断:评某一维时只看这一维,不受整体印象和其他维度的影响;两版在不同维度上互有胜负是正常的。每维给出 "A"、"B" 或 "平",再综合判断哪一版更好。
只输出 JSON:{"dims":{${DIMENSIONS.map((d) => `"${d.id}":"A|B|平"`).join(",")}},"better":"A" 或 "B","reason":"一两句话"}`
  if (cond === "principles") return system(true)
  if (cond === "principles2") return system2()
  if (cond === "principles3") return system3()
  if (cond === "perprinciple3") return system3each()
  if (cond === "rubric6") return systemRubric6()
  if (cond === "rubric7") return systemRubric7()
  if (cond === "rubric8") return systemRubric8()
  if (cond === "rubric9") return systemRubric9()
  if (cond === "rubric10") return systemRubric10()
  if (cond === "rubric11") return systemRubric11()
  if (cond === "rubric12") return systemRubric12()
  if (cond === "rubric14") return systemRubric14()
  if (cond === "rubric15") return systemRubric15()
  if (cond === "rubric16") return systemRubric16()
  if (cond === "rubric17") return systemRubric17()
  if (cond === "rubric18") return systemRubric18()
  if (cond === "rubric19") return systemRubric19()
  if (cond === "rubric20") return systemRubric20()
  if (cond === "rubric21") return systemRubric21()
  if (cond === "crowd" || cond === "crowd-anchor") return system(true).replace(/^2\. .*$/m, CROWD_2)
  if (cond === "roomy") return system(true).replace(/^2\. .*$/m, ROOMY_2)
  if (cond === "perprinciple")
    return system(true).replace(
      /判断哪一版更好。只输出 JSON:.*$/m,
      '先按六条标准逐条比较两版,每条给出 "A"、"B" 或 "平";再综合判断哪一版更好。只输出 JSON:{"principles":{"1":"A|B|平","2":"…","3":"…","4":"…","5":"…","6":"…"},"better":"A" 或 "B","reason":"一两句话"}',
    )
  throw new Error(`unknown cond ${cond}`)
}

export const img = (file) => ({ type: "image_url", image_url: { url: `data:image/png;base64,${fs.readFileSync(file).toString("base64")}` } })

// JUDGE_URL / JUDGE_MODEL switch to another OpenAI-compatible endpoint and model;
// JUDGE_EFFORT sets reasoning_effort (providers differ in how much "low" thinks).
export const JUDGE_URL = process.env.JUDGE_URL ?? "https://api.deepseek.com/chat/completions"
export const JUDGE_MODEL = process.env.JUDGE_MODEL ?? "deepseek-flash"
export const JUDGE_EFFORT = process.env.JUDGE_EFFORT ?? "low"
export async function call(sys, content, { key, model = JUDGE_MODEL, effort = JUDGE_EFFORT }) {
  const body = { model, messages: [{ role: "system", content: sys }, { role: "user", content }], response_format: { type: "json_object" }, reasoning_effort: effort, max_tokens: 32000 }
  for (let attempt = 0; ; attempt++) {
    const t0 = Date.now()
    try {
      const r = await fetch(JUDGE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(600_000),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 300)}`)
      const msg = j.choices[0].message
      return { json: JSON.parse(msg.content), raw: msg.content, usage: j.usage, latencyMs: Date.now() - t0 }
    } catch (e) {
      if (attempt >= 3) throw e
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt))
    }
  }
}
