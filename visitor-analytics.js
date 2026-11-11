/* Rise Above Wrestling Tracker v1.6.5 — date-range diagnostics.
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
const jobs=[readCount(dateAt(0),dateAt(1)),readCount(dateAt(-1),dateAt(0)),readCount(dateAt(-6),dateAt(1)),readCount(),...Array.from({length:7},(_,i)=>readCount(dateAt(i-6),dateAt(i-5)))];
Promise.allSettled(jobs).then(async results=>{
const get=i=>results[i].status==='fulfilled'?results[i].value:null;const total=get(3);
const weekly=get(2);const today=get(0),yesterday=get(1);
// If a bounded request yields zero but lifetime visits exist, try the documented
// relative "week" start as a diagnostic. Do not silently replace seven days with
// a different period if the numbers disagree.
let alternate=null;if(weekly===0&&total>0){try{alternate=await readCount('week')}catch(e){console.warn('GoatCounter relative week counter:',e)}}
let suspect=weekly===0&&total>0&&alternate>0;
for(const [key,i] of [['today',0],['yesterday',1],['week',2],['total',3]]){const v=get(i);slots[key].textContent=v===null?'—':(key==='week'&&suspect?'—':fmt.format(v))}
for(let i=0;i<7;i++){const v=get(i+4);days[i].textContent=v===null?'—':(suspect&&v===0?'—':fmt.format(v))}
const failures=results.filter(r=>r.status==='rejected');if(failures.length){status.textContent='Some dates could not be loaded. Please compare with your GoatCounter dashboard.';console.warn('Visitor counter errors',failures.map(x=>x.reason))}
else if(suspect){status.textContent='Date filters disagree with GoatCounter’s weekly counter. Daily and weekly figures are hidden until verified.'}
else if(weekly===0&&total>0){status.textContent='Lifetime visits exist, but the selected 7-day range returned zero. Compare dates with GoatCounter before relying on daily totals.'}
else status.textContent='Site-wide GoatCounter visits · Daily figures use local calendar dates. Counts may be delayed.';
});}
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
