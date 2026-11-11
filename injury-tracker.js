/* Rise Above Wrestling Tracker v1.8 — Injury Modes */
(()=>{
'use strict';
if(typeof injuries!=='function'||typeof db==='undefined')return;
const oldInjuries=injuries;
const oldAddMatch=addMatch;
const catalog=[
 ['Sprained ankle','Minor',7,21],['Bruised ribs','Minor',5,14],['Wrist sprain','Minor',7,28],
 ['Back strain','Moderate',14,42],['Shoulder sprain','Moderate',21,56],['Knee sprain','Moderate',14,56],
 ['Separated shoulder','Severe',42,112],['Torn ligament','Severe',84,252],
 ['Broken arm','Severe',42,98],['Concussion (storyline)','Moderate',14,42],
 ['Torn triceps','Severe',84,196],['Neck strain','Moderate',14,42]
];
let mode='manual', generated=null;
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
function addDays(date,days){const [y,m,d]=date.split('-').map(Number);const v=new Date(y,m-1,d,12);v.setDate(v.getDate()+days);return [v.getFullYear(),String(v.getMonth()+1).padStart(2,'0'),String(v.getDate()).padStart(2,'0')].join('-')}
function daysFrom(q,unit){const n=Number(q);return unit==='months'?Math.round(n*30):unit==='weeks'?n*7:n}
function durationText(days){return days>=28?`${Math.round(days/7)} weeks (${days} days)`:`${days} days`}
function selector(){return `<label>Wrestler</label><select name="wrestler" required>${opt()}</select>`}
function injuryForm(){
 const manual=mode==='manual';
 return `<section class="panel"><h3>🏥 Log a Wrestling Injury</h3><p class="small muted">Choose a custom injury and time out, or generate a fictional injury and recovery duration.</p>
 <div class="ra-injury-tabs"><button type="button" class="${manual?'':'secondary'}" onclick="raInjuryMode('manual')">✍️ Manual Injury</button><button type="button" class="${manual?'secondary':''}" onclick="raInjuryMode('random')">🎲 Random Injury</button></div>
 <form onsubmit="raSaveInjury(event)">
 <div class="fields"><div>${selector()}</div><div><label>Date injured</label><input name="start" type="date" value="${today()}" required></div></div>
 ${manual?`<div class="fields"><div><label>Injury description</label><input name="type" required maxlength="120" placeholder="Shoulder injury, knee sprain..."></div><div><label>Severity</label><select name="severity"><option>Minor</option><option>Moderate</option><option>Severe</option></select></div><div><label>Time out</label><input name="duration" type="number" min="1" max="3650" value="4" required></div><div><label>Time unit</label><select name="unit"><option value="weeks">Weeks</option><option value="days">Days</option><option value="months">Months</option></select></div></div>`:
 `<p><button type="button" class="secondary" onclick="raGenerateInjury()">🎲 Generate Injury & Time Out</button></p><div id="ra-generated-injury" class="ra-generated">${generated?`<b>${esc(generated.type)}</b> · ${esc(generated.severity)}<p>Time out: ${durationText(generated.days)}</p>`:'Generate an injury to preview it before saving.'}</div>`}
 <label>Notes (optional)</label><textarea name="notes" placeholder="How it happened, booking implications..."></textarea>
 <p><button type="submit" ${db.roster.length?'':'disabled'}>Save Injury</button></p>
 </form><p class="small muted">Recovery periods are fictional gameplay estimates, not medical guidance. Injuries remain active until you clear them.</p></section>`;
}
injuries=function(){
 const existing=oldInjuries();
 const listStart=existing.indexOf('<section class="panel"><h3>Injury List</h3>');
 const list=listStart>=0?existing.slice(listStart):'';
 return '<h2>Injury Tracker</h2>'+injuryForm()+list;
};
window.raInjuryMode=function(next){mode=next;generated=null;render()};
window.raGenerateInjury=function(){
 const pick=catalog[Math.floor(Math.random()*catalog.length)];
 const days=pick[2]+Math.floor(Math.random()*(pick[3]-pick[2]+1));
 generated={type:pick[0],severity:pick[1],days};
 const slot=document.getElementById('ra-generated-injury');
 if(slot)slot.innerHTML=`<b>${esc(generated.type)}</b> · ${esc(generated.severity)}<p>Time out: ${durationText(days)}</p>`;
};
window.raSaveInjury=function(e){
 e.preventDefault();
 const f=new FormData(e.target), wrestler=String(f.get('wrestler')||'');
 if(!db.roster.some(w=>w.id===wrestler))return alert('Select a wrestler.');
 const start=String(f.get('start')||today());
 let type,severity,days;
 if(mode==='random'){
  if(!generated)return alert('Generate a random injury first.');
  ({type,severity,days}=generated);
 }else{
  type=String(f.get('type')||'').trim();severity=String(f.get('severity')||'Moderate');
  days=daysFrom(f.get('duration'),String(f.get('unit')||'weeks'));
 }
 if(!type||!Number.isFinite(days)||days<1||days>3650)return alert('Enter a valid injury and time out.');
 db.injuries.unshift({id:id(),wrestler,type,severity,start,return:addDays(start,Math.round(days)),
  durationDays:Math.round(days),injuryMode:mode,notes:String(f.get('notes')||''),cleared:false});
 generated=null;save();
};
addMatch=function(){
 const a=document.getElementById('ma')?.value,b=document.getElementById('mb')?.value;
 const injured=db.injuries.filter(i=>!i.cleared&&(i.wrestler===a||i.wrestler===b));
 if(injured.length&&!confirm(`Booking warning: ${injured.map(i=>name(i.wrestler)).join(' and ')} ${injured.length===1?'has':'have'} an active injury. Add this match anyway?`))return;
 return oldAddMatch();
};
const style=document.createElement('style');
style.textContent='.ra-injury-tabs{display:flex;gap:9px;flex-wrap:wrap;margin:16px 0}.ra-injury-tabs button{flex:1;min-width:130px}.ra-generated{padding:15px;border:1px solid #b83232;border-radius:10px;background:#1b1010;color:#ffbf45;margin:12px 0}.ra-generated p{margin:7px 0 0;color:#e6d5d5}';
document.head.appendChild(style);
})();
