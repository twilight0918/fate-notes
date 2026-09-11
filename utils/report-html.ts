// ─── 產生單檔 HTML 報告 ──────────────────────────────────────────────────────
// 樣式與分頁腳本全部內嵌：離線打開、轉寄、列印都不缺東西。
// 原始資料以 JSON 一併附在檔尾（<script type="application/json">），日後要匯回或重算不必重跑 AI。

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReportDocument, { type ReportData } from "@/components/report/ReportDocument";

const REPORT_CSS = `
:root{
  --paper:#f6f1e7;--card:#fffdf8;--ink:#2a2520;--muted:#6f665b;--line:#e2d9c8;
  --accent:#a3402c;--accent-soft:#f3e3d8;--gold:#9a7424;
  --wood:#4e7a46;--fire:#b0452f;--earth:#98712a;--metal:#6d6d72;--water:#2f5c87;
  --serif:"Noto Serif TC","Songti TC","PMingLiU","MingLiU",serif;
  --sans:"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif;
}
@media (prefers-color-scheme:dark){
  :root{--paper:#191712;--card:#221f19;--ink:#ece5d8;--muted:#a89f90;--line:#38322a;
    --accent:#e08a6c;--accent-soft:#3a2720;--gold:#d2ad5e;
    --wood:#8fbf85;--fire:#ec8a72;--earth:#d6b06a;--metal:#b3b3b8;--water:#86b3dc;
    --hdg-open:#221f19;--hdg-stroke:#4a443b;--hdg-channel:#322d26;--hdg-active:#ece5d8;--hdg-num:#7d7568;--hdg-num-on:#191712;}
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.85 var(--sans);letter-spacing:.02em}
.page{max-width:46rem;margin:0 auto;padding:0 1.25rem 4rem;overflow-wrap:anywhere}
h1,h2,h3,h4,.tagline,.eyebrow{font-family:var(--serif);font-weight:700;letter-spacing:.04em}
h2{font-size:1.45rem;margin:0 0 .6rem}
h3{font-size:1.08rem;margin:2.2rem 0 .7rem;color:var(--accent)}
h4{font-size:1rem;margin:0 0 .25rem}
p{margin:0 0 .8rem}
.muted{color:var(--muted)}
.note{color:var(--muted);font-size:.86rem;line-height:1.7;margin:.2rem 0 0}
.pre{white-space:pre-line}

/* 封面 */
.cover{padding:3.5rem 0 2rem;border-bottom:1px solid var(--line)}
.eyebrow{color:var(--accent);font-size:.85rem;letter-spacing:.3em;margin:0 0 1rem}
.cover h1{font-size:clamp(1.7rem,5vw,2.3rem);line-height:1.35;margin:0 0 .6rem}
.birth{color:var(--muted);font-size:.92rem}
.tagline{font-size:clamp(1.25rem,4vw,1.6rem);line-height:1.5;margin:1.6rem 0;padding-left:1rem;border-left:3px solid var(--accent)}
.keyfacts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(18rem,100%),1fr));gap:.1rem 1.5rem;margin:1.5rem 0 0}
.keyfacts div{display:flex;gap:.8rem;padding:.45rem 0;border-top:1px dashed var(--line)}
.keyfacts dt{flex:0 0 4.2em;color:var(--muted);font-size:.85rem;padding-top:.1rem}
.keyfacts dd{margin:0;font-size:.95rem}

/* 分頁籤 */
.tabs{position:sticky;top:0;z-index:5;display:flex;gap:.2rem;overflow-x:auto;scrollbar-width:none;
  background:var(--paper);border-bottom:1px solid var(--line);margin:0 -1.25rem;padding:0 1.25rem}
.tabs::-webkit-scrollbar{display:none}
.tabs a{flex:0 0 auto;padding:.85rem .8rem .75rem;color:var(--muted);text-decoration:none;font-size:.95rem;
  border-bottom:2px solid transparent;transition:color .2s,border-color .2s}
.tabs a:hover{color:var(--ink)}
.tabs a[aria-selected=true]{color:var(--ink);border-bottom-color:var(--accent);font-weight:600}
.panel{padding:2rem 0 0}
.js .panel{display:none}
.js .panel.active{display:block;animation:fade .25s ease}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.lead{font-size:1.06rem}

/* 條列與提示框 */
.items{list-style:none;padding:0;margin:0;counter-reset:i}
.items li{position:relative;padding:0 0 0 2.2rem;margin:0 0 1.4rem;counter-increment:i}
.items li::before{content:counter(i);position:absolute;left:0;top:.1rem;width:1.5rem;height:1.5rem;border-radius:50%;
  background:var(--accent-soft);color:var(--accent);font:600 .8rem/1.5rem var(--sans);text-align:center}
.items.tension li::before{content:"△";background:none;font-size:.95rem}
.item-title{font-weight:600;margin:0 0 .3rem}
.tags{display:inline-flex;flex-wrap:wrap;gap:.3rem;margin-left:.5rem;vertical-align:.1em}
.tag{font-size:.72rem;font-weight:400;color:var(--muted);border:1px solid var(--line);border-radius:99px;padding:0 .5rem;line-height:1.6}
.callout{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:6px;padding:1rem 1.2rem;margin:2rem 0 0}
.callout.soft{border-left-color:var(--gold)}
.callout-label{font-size:.8rem;color:var(--muted);margin:0 0 .3rem}
.callout p:last-child{margin:0}
.chips{display:flex;flex-wrap:wrap;gap:.4rem}
.chip{background:var(--card);border:1px solid var(--line);border-radius:99px;padding:.1rem .75rem;font-size:.9rem}

/* 欄位 */
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr));gap:1rem;margin:1.5rem 0}
.facts.single{grid-template-columns:1fr}
.fact{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:.8rem 1rem}
.fact dt{font-size:.8rem;color:var(--muted)}
.fact dd{margin:.1rem 0 0;font-weight:600}

/* 人生面向 */
.aspects{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(18rem,100%),1fr));gap:1.2rem 2rem}
.aspect h3{margin:0 0 .35rem}

/* 八字四柱 */
.scroll-x{overflow-x:auto;margin:1.5rem 0}
.pillars{border-collapse:collapse;min-width:20rem;width:100%}
.pillars th{font:400 .8rem var(--sans);color:var(--muted);padding:.3rem;border-bottom:1px solid var(--line)}
.pillars td{text-align:center;padding:.6rem .3rem;vertical-align:top}
.gz{display:block;font:700 1.7rem/1.25 var(--serif)}
.gz small{display:block;font:400 .72rem var(--sans);opacity:.8;margin-bottom:.35rem}
.e-wood{color:var(--wood)}.e-fire{color:var(--fire)}.e-earth{color:var(--earth)}.e-metal{color:var(--metal)}.e-water{color:var(--water)}

/* 紫微命盤 */
.zw{display:grid;grid-template-columns:repeat(4,minmax(7.2rem,1fr));min-width:31rem;border:1px solid var(--line);background:var(--line);gap:1px}
.zw-cell{background:var(--card);padding:.45rem .5rem;min-height:6.6rem;font-size:.8rem;line-height:1.45}
.zw-cell.is-soul{box-shadow:inset 0 0 0 2px var(--accent)}
.zw-cell.is-body{box-shadow:inset 0 0 0 2px var(--gold)}
.zw-cell.is-soul.is-body{box-shadow:inset 0 0 0 2px var(--accent),inset 0 0 0 4px var(--gold)}
.zw-head{display:flex;gap:.3rem;align-items:baseline;margin:0 0 .2rem}
.zw-head span{margin-left:auto;color:var(--muted);font-size:.72rem}
.zw-head em,.palaces em{font-style:normal;font-size:.68rem;color:#fff;background:var(--accent);border-radius:3px;padding:0 .25rem}
.zw-head em.body,.palaces em.body{background:var(--gold)}
.zw-major{color:var(--accent);font-weight:600;margin:0}
.zw-minor{color:var(--muted);font-size:.7rem;margin:.2rem 0 0}
.zw-center{background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:.8rem;color:var(--muted)}
.zw-center p{margin:0}
.zw-title{font:700 1.1rem var(--serif);color:var(--ink);margin-bottom:.4rem!important}

/* 展開區 */
details{margin:2rem 0 0;border-top:1px solid var(--line);padding-top:.4rem}
summary{cursor:pointer;padding:.6rem 0;color:var(--accent);font-weight:600;list-style:none}
summary::-webkit-details-marker{display:none}
summary::before{content:"＋";display:inline-block;width:1.4em;transition:transform .2s}
details[open] summary::before{content:"－"}
.palaces section{padding:.9rem 0;border-bottom:1px dashed var(--line)}
.palaces h4 .muted{font:400 .85rem var(--sans);margin-left:.5rem}
.palaces h4 em{margin-left:.3rem}
.palaces.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(17rem,100%),1fr));gap:0 2rem}
.glossary dt{font-weight:600;margin-top:.8rem}
.glossary dd{margin:0;color:var(--muted);font-size:.92rem}

/* 流年四化 */
.mutagen{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(9.5rem,100%),1fr));gap:.8rem}
.mutagen div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:.7rem .9rem}
.mutagen dt{font-size:.82rem;font-weight:600}
.mutagen dd{margin:0;font:700 1.15rem var(--serif);color:var(--ink)}
.m-lu dt,p.m-lu b{color:var(--wood)}.m-quan dt,p.m-quan b{color:var(--gold)}.m-ke dt,p.m-ke b{color:var(--water)}.m-ji dt,p.m-ji b{color:var(--fire)}

/* 人類圖 */
.hd-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;margin-top:1.5rem}
@media (min-width:44rem){.hd-layout{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);align-items:start}}
.hd-graph{margin:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.5rem}
.hd-graph svg{display:block;width:100%;height:auto}
.hd-graph svg text{font-family:var(--sans)}
.hd-layout .facts{margin:0}
.centers{list-style:none;padding:0;margin:0}
.centers li{padding:.7rem 0;border-bottom:1px dashed var(--line)}
.centers li b{margin-right:.5rem}
.centers li.defined b{color:var(--accent)}
.centers li p{margin:.2rem 0 0;font-size:.92rem}

.colophon{margin-top:4rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--muted);font-size:.78rem;line-height:1.7}
.colophon p{margin:0}

@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media print{
  body{background:#fff;font-size:12pt}
  .tabs{display:none}
  .js .panel{display:block!important;break-before:page}
  details>*:not(summary){display:block}
  details summary::before{content:""}
}
`;

// 分頁：沒有 JavaScript 時所有分頁依序展開（仍可讀）；有的話一次只顯示一頁，網址 #hash 記住位置。
const REPORT_JS = `
(function(){
  var root=document.documentElement;root.classList.add('js');
  var tabs=[].slice.call(document.querySelectorAll('.tabs a'));
  var panels=[].slice.call(document.querySelectorAll('.panel'));
  function show(id,push){
    if(!document.getElementById(id))id=panels[0].id;
    panels.forEach(function(p){p.classList.toggle('active',p.id===id)});
    tabs.forEach(function(t){var on=t.getAttribute('href')==='#'+id;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;
      if(on&&t.scrollIntoView)t.scrollIntoView({block:'nearest',inline:'nearest'})});
    if(push&&history.replaceState)history.replaceState(null,'','#'+id);
    var nav=document.querySelector('.tabs');if(push&&nav&&window.scrollY>nav.offsetTop)window.scrollTo({top:nav.offsetTop});
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(e){e.preventDefault();show(t.getAttribute('href').slice(1),true)});
    t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;
      e.preventDefault();var n=tabs[(i+d+tabs.length)%tabs.length];n.focus();show(n.getAttribute('href').slice(1),true)});
  });
  window.addEventListener('beforeprint',function(){[].forEach.call(document.querySelectorAll('details'),function(d){d.open=true})});
  show(location.hash.slice(1),false);
})();
`;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

/** JSON 放進 <script> 時要防止內容裡的 </script> 提早結束標籤 */
function safeJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildReportHtml(d: ReportData): string {
  const body = renderToStaticMarkup(createElement(ReportDocument, { d }));
  const name = d.birthData.name?.trim();
  const title = name ? `${name} 的命運手記` : "命運手記";
  return `<!doctype html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700&display=swap">
<style>${REPORT_CSS}</style>
</head>
<body>
${body}
<script type="application/json" id="fate-notes-data">${safeJson({ version: 2, ...d })}</script>
<script>${REPORT_JS}</script>
</body>
</html>`;
}

/** 下載用檔名，例：「Edward_命運手記_2026-09-11.html」 */
export function reportFileName(d: ReportData): string {
  const date = d.generatedAt.slice(0, 10);
  const name = d.birthData.name?.trim().replace(/[\\/:*?"<>|]/g, "") || "未命名";
  return `${name}_命運手記_${date}.html`;
}
