/* Rise Above Wrestling Tracker v1.6 — public aggregate visitor analytics.
   Configure your GoatCounter site code below. No API tokens belong in client files. */
(function(){
'use strict';
const GOATCOUNTER_CODE='riseabovexp';
const configured=/^[a-z0-9][a-z0-9-]*$/i.test(GOATCOUNTER_CODE)&&!GOATCOUNTER_CODE.startsWith('REPLACE_');
const root='https://'+GOATCOUNTER_CODE+'.goatcounter.com';
const path=location.pathname;
const fmt=new Intl.NumberFormat('en-US');
function iso(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function dayOffset(n){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return iso(d)}
function counterURL(start,end){let u=root+'/counter/'+encodeURIComponent(path)+'.json';const q=new URLSearchParams();if(start)q.set('start',start);if(end)q.set('end',end);return u+'?'+q}
async function getCount(start,end){const r=await fetch(counterURL(start,end),{cache:'no-store'});if(!r.ok)throw Error('Counter unavailable ('+r.status+')');const j=await r.json();const n=Number(String(j.count||'0').replace(/,/g,''));if(!Number.isFinite(n))throw Error('Unexpected counter response');return n}
function element(tag,cl,txt){const e=document.createElement(tag);if(cl)e.className=cl;if(txt!==undefined)e.textContent=txt;return e}
function setup(){
 if(document.getElementById('ra-visitor-analytics'))return;
 const dashboard=Array.from(document.querySelectorAll('h1,h2,h3')).find(e=>/universe dashboard/i.test(e.textContent||''));
 const anchor=dashboard?.closest('section')||dashboard?.parentElement;
 if(!anchor)return;
 const panel=element('section','ra-analytics');panel.id='ra-visitor-analytics';
 const h=element('h2','', '📊 Visitor Analytics');panel.appendChild(h);
 const sub=element('p','ra-analytics-note','Public visitor counts · Updates may be delayed by up to 4 hours');panel.appendChild(sub);
 const grid=element('div','ra-analytics-grid');panel.appendChild(grid);
 const fields={};[['today','Today'],['yesterday','Yesterday'],['week','Last 7 Days'],['total','Total Visitors']].forEach(([key,label])=>{const card=element('div','ra-analytics-card');card.appendChild(element('div','ra-analytics-label',label));const value=element('strong','ra-analytics-number','—');card.appendChild(value);grid.appendChild(card);fields[key]=value});
 const chart=element('div','ra-analytics-chart');panel.appendChild(chart);
 const status=element('p','ra-analytics-note');panel.appendChild(status);
 anchor.insertAdjacentElement('afterend',panel);
 if(!configured){status.textContent='Setup required: enter your free GoatCounter site code in visitor-analytics.js.';return}
 const script=document.createElement('script');script.async=true;script.src='https://gc.zgo.at/count.js';script.dataset.goatcounter=root+'/count';document.head.appendChild(script);
 const days=Array.from({length:7},(_,i)=>dayOffset(i-6));
 const jobs=[getCount(days[6],days[6]),getCount(dayOffset(-1),dayOffset(-1)),getCount(days[0],days[6]),getCount(null,null),...days.map(d=>getCount(d,d))];
 Promise.allSettled(jobs).then(results=>{
  ['today','yesterday','week','total'].forEach((key,i)=>{const r=results[i];fields[key].textContent=r.status==='fulfilled'?fmt.format(r.value):'Unavailable'});
  const daily=results.slice(4).map((r,i)=>({date:days[i],value:r.status==='fulfilled'?r.value:null}));
  const max=Math.max(1,...daily.map(x=>x.value||0));
  daily.forEach(x=>{const col=element('div','ra-analytics-day');const bar=element('div','ra-analytics-bar');bar.style.height=Math.max(3,Math.round(72*(x.value||0)/max))+'px';bar.title=x.date+': '+(x.value===null?'Unavailable':x.value+' visits');col.appendChild(element('span','',x.value===null?'—':String(x.value)));col.appendChild(bar);col.appendChild(element('small','',x.date.slice(5)));chart.appendChild(col)});
  if(results.some(x=>x.status==='rejected'))status.textContent='Some counts are unavailable. Check GoatCounter public counter settings and your connection.';
  else status.textContent='Aggregated visits since tracking began; repeat visits may be grouped.';
 });
}
const css=document.createElement('style');css.textContent=`
.ra-analytics{background:linear-gradient(145deg,#230909,#0d0d0f);border:2px solid #e32c2c;border-radius:16px;padding:16px;margin:20px 0;color:#fff;box-shadow:0 0 14px #a00a}
.ra-analytics h2{margin:0 0 8px;font-size:clamp(19px,4vw,26px);color:#fff}
.ra-analytics-note{font-size:12px;color:#c8b7b7;margin:8px 0}
.ra-analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:15px 0}
.ra-analytics-card{border:1px solid #ba3333;border-radius:11px;padding:13px;background:#160f10}
.ra-analytics-label{color:#d6c7c7;font-size:13px}.ra-analytics-number{display:block;font-size:clamp(23px,5vw,32px);color:#ffbf45;margin-top:5px}
.ra-analytics-chart{display:flex;align-items:end;justify-content:space-around;gap:5px;min-height:125px;padding:12px 2px;border-top:1px solid #672020}
.ra-analytics-day{display:flex;flex:1;min-width:0;align-items:center;flex-direction:column;justify-content:end;gap:5px;font-size:11px}
.ra-analytics-day small{font-size:10px;color:#c7bdbd}.ra-analytics-bar{background:linear-gradient(#fa4444,#960a0a);width:80%;border-radius:5px 5px 0 0;min-height:3px}
`;document.head.appendChild(css);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
