/* Rise Above Wrestling Tracker v1.7 — cumulative daily count diagnostics.
   Public GoatCounter data only. No access to saved wrestling data. */
(()=>{'use strict';
const ROOT='https://riseabovexp.goatcounter.com',fmt=new Intl.NumberFormat('en-US');
const el=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e};
function dateAt(n){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
async function readCount(start,end){const url=new URL(ROOT+'/counter/TOTAL.json');if(start)url.searchParams.set('start',start);if(end)url.searchParams.set('end',end);const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('GoatCounter HTTP '+r.status);const j=await r.json();const count=Number(String(j.count).replace(/,/g,''));if(!Number.isFinite(count))throw Error('Unexpected counter response');return count}
function mount(){if(document.getElementById('ra-visitor-analytics'))return;
const heading=[...document.querySelectorAll('h1,h2,h3')].find(e=>/universe dashboard/i.test(e.textContent||''));const anchor=heading&&(heading.closest('section')||heading.parentElement);if(!anchor)return;
const panel=el('section','ra-analytics');panel.id='ra-visitor-analytics';panel.appendChild(el('h2','','📊 Visitor Analytics'));panel.appendChild(el('p','ra-analytics-note','Public GoatCounter visits · Counts may be cached for up to 4 hours'));
const grid=el('div','ra-analytics-grid');panel.appendChild(grid);const slots={};for(const [key,label] of [['today','Today'],['yesterday','Yesterday'],['week','Last 7 Days'],['total','Total Visitors']]){const card=el('div','ra-analytics-card');card.appendChild(el('div','ra-analytics-label',label));slots[key]=el('strong','ra-analytics-number','…');card.appendChild(slots[key]);grid.appendChild(card)}
const chart=el('div','ra-analytics-chart');panel.appendChild(chart);const days=[];for(let i=-6;i<=0;i++){const day=el('div','ra-analytics-day'),value=el('strong','ra-analytics-day-value','…');day.appendChild(value);day.appendChild(el('small','',dateAt(i).slice(5)));chart.appendChild(day);days.push(value)}
const status=el('p','ra-analytics-note','Loading visitor counts…');panel.appendChild(status);anchor.insertAdjacentElement('afterend',panel);
// GoatCounter dates are day boundaries; use the following day as the end to
// avoid a same-day start/end range that may cover zero time.
// GoatCounter's public counter supports a start date with no end date.
 // Use cumulative snapshots and subtract adjacent dates to obtain day counts.
 const dates=Array.from({length:8},(_,i)=>dateAt(i-6));
 const jobs=[...dates.map(d=>readCount(d)),readCount()];
 Promise.allSettled(jobs).then(results=>{
   const values=results.map(r=>r.status==='fulfilled'?r.value:null);
   const total=values[8];
   const daily=Array.from({length:7},(_,i)=>values[i]===null||values[i+1]===null?null:values[i]-values[i+1]);
   const valid=daily.every(v=>v!==null&&v>=0)&&values[0]!==null&&total!==null&&values[0]<=total;
   slots.total.textContent=total===null?'—':fmt.format(total);
   slots.today.textContent=valid?fmt.format(daily[6]):'—';
   slots.yesterday.textContent=valid?fmt.format(daily[5]):'—';
   slots.week.textContent=valid?fmt.format(daily.reduce((a,b)=>a+b,0)):'—';
   days.forEach((node,i)=>node.textContent=valid?fmt.format(daily[i]):'—');
   status.textContent=valid?
     'Daily counts are calculated from GoatCounter cumulative counters. Compare with your GoatCounter dashboard; public counts may be cached.':
     'Daily and weekly counters could not be verified. Lifetime total is shown where available.';
   if(!valid)console.warn('GoatCounter cumulative counter diagnostics',results);
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
`;document.head.appendChild(style);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();})();
