/* Rise Above Wrestling Tracker v1.6.4 — custom dark public analytics.
   Uses GoatCounter's documented public JSON visitor counter endpoint.
   No API tokens, no modifications to ringbook-v1 saved data. */
(()=>{
'use strict';
const ROOT='https://riseabovexp.goatcounter.com';
const fmt=new Intl.NumberFormat('en-US');
const el=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e};
function dateAt(n){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function publicURL(start,end){const u=new URL(ROOT+'/counter/TOTAL.json');if(start)u.searchParams.set('start',start);if(end)u.searchParams.set('end',end);return u}
async function readCount(start,end){const u=publicURL(start,end);const r=await fetch(u.toString(),{mode:'cors',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(j.count===undefined||j.count===null)throw Error('Missing count');const n=Number(String(j.count).replace(/,/g,''));if(!Number.isFinite(n))throw Error('Invalid count');return n}
function mount(){
if(document.getElementById('ra-visitor-analytics'))return;
const heading=Array.from(document.querySelectorAll('h1,h2,h3')).find(e=>/universe dashboard/i.test(e.textContent||''));
const anchor=heading&&(heading.closest('section')||heading.parentElement);if(!anchor)return;
const panel=el('section','ra-analytics');panel.id='ra-visitor-analytics';
panel.appendChild(el('h2','','📊 Visitor Analytics'));
panel.appendChild(el('p','ra-analytics-note','Public site visits · GoatCounter may cache totals for up to 4 hours'));
const grid=el('div','ra-analytics-grid');panel.appendChild(grid);
const slots={};for(const [key,label] of [['today','Today'],['yesterday','Yesterday'],['week','Last 7 Days'],['total','Total Visitors']]){const card=el('div','ra-analytics-card');card.appendChild(el('div','ra-analytics-label',label));const val=el('strong','ra-analytics-number','…');card.appendChild(val);grid.appendChild(card);slots[key]=val}
const chart=el('div','ra-analytics-chart');panel.appendChild(chart);
const daySlots=[];for(let i=-6;i<=0;i++){const day=el('div','ra-analytics-day');const value=el('strong','ra-analytics-day-value','…');day.appendChild(value);day.appendChild(el('small','',dateAt(i).slice(5)));chart.appendChild(day);daySlots.push(value)}
const status=el('p','ra-analytics-note','Loading visitor counts…');panel.appendChild(status);
anchor.insertAdjacentElement('afterend',panel);
const dates=Array.from({length:7},(_,i)=>dateAt(i-6));
const requests=[readCount(dates[6],dates[6]),readCount(dateAt(-1),dateAt(-1)),readCount(dates[0],dates[6]),readCount(null,null),...dates.map(d=>readCount(d,d))];
Promise.allSettled(requests).then(results=>{
const keys=['today','yesterday','week','total'];keys.forEach((k,i)=>slots[k].textContent=results[i].status==='fulfilled'?fmt.format(results[i].value):'—');
results.slice(4).forEach((r,i)=>daySlots[i].textContent=r.status==='fulfilled'?fmt.format(r.value):'—');
const failures=results.filter(r=>r.status==='rejected');
if(failures.length){const reason=failures[0].reason?.message||'request failed';status.textContent='Some counters unavailable ('+reason+'). The public counter may be blocked or temporarily inaccessible.';console.warn('Rise Above public analytics errors:',failures.map(r=>r.reason))}
else status.textContent='Site-wide GoatCounter visits. Counts can be delayed up to 4 hours.';
});
}
const style=el('style');style.textContent=`
.ra-analytics{background:linear-gradient(145deg,#230909,#0d0d0f);border:2px solid #e32c2c;border-radius:16px;padding:16px;margin:20px 0;color:#fff;box-shadow:0 0 14px #a00a}
.ra-analytics h2{margin:0 0 8px;font-size:clamp(19px,4vw,26px);color:#fff}
.ra-analytics-note{font-size:12px;color:#c8b7b7;margin:8px 0}
.ra-analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:15px 0}
.ra-analytics-card{border:1px solid #ba3333;border-radius:11px;padding:13px;background:#160f10;min-width:0}
.ra-analytics-label{color:#d6c7c7;font-size:13px}
.ra-analytics-number{display:block;color:#ffbf45;font-size:clamp(23px,5vw,32px);line-height:1.3;margin-top:5px;overflow-wrap:anywhere}
.ra-analytics-chart{display:flex;justify-content:space-around;gap:5px;min-height:95px;padding:12px 2px;border-top:1px solid #672020;margin-top:18px}
.ra-analytics-day{display:flex;flex:1;min-width:0;align-items:center;flex-direction:column;justify-content:end;gap:8px;font-size:11px;text-align:center}
.ra-analytics-day small{font-size:10px;color:#c7bdbd}
.ra-analytics-day-value{color:#ffbf45;font-size:clamp(12px,3vw,18px);border-bottom:3px solid #c72222;width:85%;padding-bottom:8px}
`;document.head.appendChild(style);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
