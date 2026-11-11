/* Rise Above Wrestling Tracker v1.9 — Career Statistics and Fan Attendance */
(()=>{
'use strict';
if(typeof db==='undefined'||typeof tabs==='undefined'||typeof render!=='function')return;
const safe=x=>esc(String(x??''));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const integer=n=>Math.round(Number(n)||0).toLocaleString();
const validCapacity=n=>clamp(Math.round(Number(n)||2500),100,150000);
const pairMatch=(m,w)=>[...(m.teamA||[m.a]),...(m.teamB||[m.b])].includes(w.id);
const participantIds=m=>[...(m.teamA||[m.a]),...(m.teamB||[m.b])].filter(Boolean);
function allMatches(){return db.shows.flatMap(s=>(s.matches||[]).map(m=>({m,show:s})));}
function career(w){
 const matches=allMatches().filter(({m})=>pairMatch(m,w));
 const r=record(w),total=r.wins+r.losses+r.draws;
 const titleEvents=(db.titleHistory||[]).filter(h=>h.wrestler===w.id&&h.type!=='vacated');
 const wins=titleEvents.filter(h=>h.type==='won');
 const unique=[...new Set(wins.map(h=>String(h.title||'').toLowerCase()))].length;
 const defenses=(db.defenses||[]).filter(d=>d.wrestler===w.id||d.champion===w.id||d.holder===w.id);
 const retained=defenses.filter(d=>d.result==='retained').length;
 let streak=0,best=0;
 for(const {m} of matches.sort((a,b)=>String(a.show.date||'').localeCompare(String(b.show.date||'')))){
  const sideA=m.teamA||[m.a],sideB=m.teamB||[m.b];
  const win=(sideA.includes(w.id)&&m.winner===m.a)||(sideB.includes(w.id)&&m.winner===m.b);
  streak=win?streak+1:0;best=Math.max(best,streak);
 }
 return {r,total,winPct:total?Math.round(100*r.wins/total):0,matches,wins:wins.length,unique,retained,best,latest:matches.at(-1)?.show?.date||'—'};
}
function storyBoost(a,b){
 const na=String(name(a)||'').toLowerCase(),nb=String(name(b)||'').toLowerCase();
 return (db.stories||[]).some(s=>s.status==='Active'&&[s.text,s.title].some(t=>{const v=String(t||'').toLowerCase();return v.includes(na)&&v.includes(nb)}))?25:0;
}
function starPower(i){const w=db.roster.find(w=>w.id===i);if(!w)return 0;const r=record(w);return clamp(Math.round(r.wins*2+Math.min(12,r.wins+r.losses+r.draws)),0,22)}
function hype(m){
 const a=m.a,b=m.b;
 const rival=storyBoost(a,b),power=Math.round((starPower(a)+starPower(b))/2);
 const title=/champion|title|belt/i.test(String(m.type||'')+' '+String(m.notes||''))?14:0;
 const matchRating=clamp(Number(m.rating)||3,0,5);
 return clamp(Math.round(30+rival+power+title+matchRating*3),0,100);
}
function showProjection(matches,capacity){
 const prior=db.shows.slice(-3);
 const form=prior.length?prior.reduce((s,x)=>s+clamp(Number(x.rating)||5,1,10),0)/prior.length:6;
 const cardHype=matches.length?matches.reduce((s,m)=>s+hype(m),0)/matches.length:35;
 const titleMatches=matches.filter(m=>/champion|title|belt/i.test(String(m.type||'')+' '+String(m.notes||''))).length;
 const excitement=clamp(Math.round(cardHype*.7+form*2.5+Math.min(10,titleMatches*4)),10,100);
 const ratio=clamp(.22+excitement*.007,0.15,.98);
 return {excitement,attendance:Math.round(validCapacity(capacity)*ratio),capacity:validCapacity(capacity),previousForm:form.toFixed(1),cardHype:Math.round(cardHype)};
}
let currentCapacity=2500,manualAttendance='',manualHype='';
const previousBook=book;
book=function(){
 const body=previousBook();
 const proj=showProjection(draft,currentCapacity);
 return body+`<section class="panel"><h3>🎟️ Fan Excitement & Attendance Forecast</h3><p class="small muted">Fictional attendance projection based on the current card, active rivalries, wrestler records, and previous show ratings. Add matches, then revisit this section to refresh the forecast.</p><div class="fields"><div><label>Arena capacity</label><input id="ra-capacity" type="number" min="100" max="150000" value="${currentCapacity}" onchange="raUpdateCapacity(this.value)"></div><div><label>Actual attendance (optional)</label><input id="ra-actual-attendance" type="number" min="0" max="150000" value="${safe(manualAttendance)}" placeholder="Leave blank to use simulation" oninput="raSetActualAttendance(this.value)"></div></div><div class="ra-mini-grid"><div class="ra-mini"><span>Projected Attendance</span><b>${integer(proj.attendance)}</b></div><div class="ra-mini"><span>Fan Excitement</span><b>${proj.excitement}/100</b></div><div class="ra-mini"><span>Previous Show Form</span><b>${proj.previousForm}/10</b></div></div><h4>🔥 Match Excitement</h4>${draft.map(m=>`<div class="ra-hype-line"><span>${safe(name(m.a))} vs ${safe(name(m.b))}</span><strong>${hype(m)}/100</strong></div>`).join('')||'<p class="muted">Add a match to see fan excitement.</p>'}</section>`;
};
window.raUpdateCapacity=function(n){currentCapacity=validCapacity(n);render()};
window.raSetActualAttendance=function(n){manualAttendance=n};
const oldFinish=finishShow;
finishShow=function(){
 const previousCount=db.shows.length;
 const proj=showProjection(draft,currentCapacity);
 const actual=manualAttendance===''?null:Number(manualAttendance);
 if(actual!==null&&(!Number.isInteger(actual)||actual<0||actual>150000))return alert('Enter a valid actual attendance or leave it blank.');
 oldFinish();
 if(db.shows.length===previousCount+1){
  const show=db.shows.at(-1);
  show.fanMetrics={...proj,attendance:actual===null?proj.attendance:actual,attendanceType:actual===null?'simulated':'manual',matchExcitement:show.matches.map(m=>({matchId:m.id,score:hype(m)}))};
  currentCapacity=2500;manualAttendance='';save();
 }
};
const oldHistory=history;
history=function(){
 let body=oldHistory();
 // Add summary cards without changing the existing show history or result records.
 const reports=db.shows.filter(s=>s.fanMetrics);
 if(!reports.length)return body;
 const total=reports.reduce((n,s)=>n+(s.fanMetrics.attendance||0),0);
 const top=[...reports].sort((a,b)=>b.fanMetrics.attendance-a.fanMetrics.attendance)[0];
 body+=`<section class="panel"><h3>🎟️ Attendance Records</h3><div class="ra-mini-grid"><div class="ra-mini"><span>Recorded Shows</span><b>${reports.length}</b></div><div class="ra-mini"><span>Total Attendance</span><b>${integer(total)}</b></div><div class="ra-mini"><span>Highest Attendance</span><b>${integer(top.fanMetrics.attendance)}</b></div></div>${[...reports].reverse().map(s=>`<div class="ra-hype-line"><span>${safe(s.title)} · ${safe(s.date)} <small class="muted">(${s.fanMetrics.attendanceType})</small></span><strong>${integer(s.fanMetrics.attendance)} · ${s.fanMetrics.excitement}/100 hype</strong></div>`).join('')}</section>`;
 return body;
};
function careersPage(){
 return `<h2>🏆 Wrestler Career Statistics</h2><p class="muted">Statistics are calculated from saved show results and championship history. They update as you book new shows.</p>${db.roster.map(w=>{const c=career(w);return `<section class="panel"><h3>${safe(w.name)} <span class="pill">${safe(w.brand||'Independent')}</span></h3><div class="ra-mini-grid"><div class="ra-mini"><span>Career Record</span><b>${c.r.wins}W · ${c.r.losses}L · ${c.r.draws}D</b></div><div class="ra-mini"><span>Win Percentage</span><b>${c.winPct}%</b></div><div class="ra-mini"><span>Matches</span><b>${c.total}</b></div><div class="ra-mini"><span>Title Wins</span><b>${c.wins}</b></div><div class="ra-mini"><span>Different Titles</span><b>${c.unique}</b></div><div class="ra-mini"><span>Best Win Streak</span><b>${c.best}</b></div></div><p class="small muted">Recorded successful title defenses: ${c.retained}. Current listed title: ${safe(w.title||'None')}.</p></section>`}).join('')||'<div class="empty">Add wrestlers to build career profiles.</div>'}`;
}
function fansPage(){
 const reports=db.shows.filter(s=>s.fanMetrics);
 const total=reports.reduce((n,s)=>n+s.fanMetrics.attendance,0);
 return `<h2>🎟️ Fan Excitement & Attendance</h2><section class="panel"><h3>Attendance Record Book</h3><p class="small muted">Attendance is simulated unless you entered an actual figure. Previous shows are not backfilled with invented attendance.</p><div class="ra-mini-grid"><div class="ra-mini"><span>Tracked Events</span><b>${reports.length}</b></div><div class="ra-mini"><span>Total Attendance</span><b>${integer(total)}</b></div><div class="ra-mini"><span>Average Attendance</span><b>${integer(reports.length?total/reports.length:0)}</b></div></div>${[...reports].reverse().map(s=>`<div class="ra-hype-line"><span>${safe(s.title)} · ${safe(s.date)} <small class="muted">${s.fanMetrics.attendanceType}</small></span><strong>${integer(s.fanMetrics.attendance)} · 🔥${s.fanMetrics.excitement}/100</strong></div>`).join('')||'<p class="muted">Save your next show to start collecting attendance records.</p>'}</section><section class="panel"><h3>How fan excitement is calculated</h3><p>Match hype reflects active rivalries, wrestler performance, and championship match indicators. Show excitement also considers your last three show ratings. This is a fictional simulation, not real audience analytics.</p></section>`;
}
for(const t of ['Career Stats','Fan & Attendance'])if(!tabs.includes(t))tabs.splice(tabs.indexOf('Backup'),0,t);
const oldRender=render;
render=function(){oldRender();const app=document.getElementById('app');if(tab==='Career Stats')app.innerHTML=careersPage();if(tab==='Fan & Attendance')app.innerHTML=fansPage()};
const style=document.createElement('style');style.textContent='.ra-mini-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:10px;margin:14px 0}.ra-mini{background:#1c1010;border:1px solid #a32b2b;border-radius:10px;padding:13px}.ra-mini span{display:block;color:#c6b6b6;font-size:13px}.ra-mini b{display:block;color:#ffc04a;font-size:22px;margin-top:5px}.ra-hype-line{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:11px 2px;border-bottom:1px solid #532020}.ra-hype-line strong{color:#ffbf45;text-align:right}@media(max-width:520px){.ra-hype-line{flex-wrap:wrap}}';document.head.appendChild(style);
render();
})();
