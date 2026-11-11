
/* Rise Above Wrestling Tracker v1.7 Championship Prestige */
(()=>{
'use strict';
if(typeof db==='undefined'||typeof championships!=='function')return;
db.belts??=[];
const keyName=s=>String(s||'').trim().toLocaleLowerCase();
const safe=s=>esc(String(s??''));
function beltNames(){
 const names=[...db.belts.map(x=>x.name),...db.roster.map(x=>x.title),...db.titleHistory.map(x=>x.title),...(db.defenses||[]).map(x=>x.title)];
 return [...new Map(names.filter(Boolean).map(x=>[keyName(x),x])).values()];
}
function beltInfo(title){
 const k=keyName(title),hist=db.titleHistory.filter(h=>keyName(h.title)===k&&h.type!=='vacated');
 const events=(db.defenses||[]).filter(d=>keyName(d.title)===k);
 const retained=events.filter(x=>x.result==='retained').length;
 // A title transfer recorded in both lineage and defense history is ONE change.
 const lineage=hist.filter(x=>x.type==='won');
 const changes=Math.max(0,lineage.length-1);
 const recordedLosses=events.filter(x=>x.result==='lost').length;
 const transfers=Math.max(changes,recordedLosses);
 const defenses=events.length;
 const score=Math.min(100,Math.round(15+Math.min(50,retained*5)+Math.min(20,transfers*3)+Math.min(15,defenses*1.5)));
 const tier=score>=85?'Legendary':score>=65?'Elite':score>=40?'Established':'Developing';
 return {title,retained,transfers,defenses,score,tier};
}
function beltCards(){
 const names=beltNames(), ranked=names.map(beltInfo).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
 const registry=db.belts||[];
 return `<section class="panel"><h3>🏆 Create & Manage Championship Belts</h3>
 <p class="muted small">Register belts and build prestige through recorded title defenses and title changes. Existing titles are recognized automatically.</p>
 <form onsubmit="raCreateBelt(event)"><div class="fields">
 <div><label>Championship name</label><input name="name" required maxlength="90" placeholder="ECW World Heavyweight Championship"></div>
 <div><label>Division</label><select name="division"><option>World</option><option>Midcard</option><option>Tag Team</option><option>Women's</option><option>Cruiserweight</option><option>Other</option></select></div>
 <div><label>Brand / promotion</label><input name="brand" maxlength="70" value="${safe(db.brandName||'')}" placeholder="ECW"></div>
 </div><p><button type="submit">+ Create Belt</button></p></form>
 ${registry.length?`<h3>Registered Belts</h3>${registry.map(b=>`<div class="result cardrow"><div><b>${safe(b.name)}</b><div class="small muted">${safe(b.division||'Other')} · ${safe(b.brand||'Independent')}</div></div><button class="secondary small" onclick="raRemoveBelt('${safe(b.id)}')">Remove Registration</button></div>`).join('')}`:''}
 </section>
 <section class="panel"><h3>⭐ Championship Prestige Rankings</h3>
 <p class="small muted">Prestige: base 15 + successful retentions (up to 50) + title changes (up to 20) + defense activity (up to 15). Maximum 100. Historical records are never modified.</p>
 ${ranked.map((b,i)=>`<div class="ra-belt-row"><div class="cardrow"><div><b>#${i+1} · ${safe(b.title)}</b><div class="small muted">${b.defenses} defenses · ${b.retained} successful retentions · ${b.transfers} title changes</div></div><div class="ra-prestige-score">${b.score}<span class="small muted"> / 100</span><div class="small">${b.tier}</div></div></div><div class="ra-prestige-track"><div style="width:${b.score}%"></div></div></div>`).join('')||'<div class="empty">Create a championship belt to begin your rankings.</div>'}
 </section>`;
}
window.raCreateBelt=function(e){
 e.preventDefault();
 const f=new FormData(e.target),name=String(f.get('name')||'').trim();
 if(!name)return;
 if(db.belts.some(b=>keyName(b.name)===keyName(name)))return alert('This belt is already registered.');
 db.belts.push({id:id(),name,division:String(f.get('division')),brand:String(f.get('brand')||'').trim()});
 save();
};
window.raRemoveBelt=function(bid){
 if(!confirm('Remove belt registration? Existing title history and defenses will remain.'))return;
 db.belts=db.belts.filter(b=>b.id!==bid);save();
};
const original=championships;
championships=function(){return original()+beltCards()};
const originalNames=titleNames;
titleNames=function(){return [...new Map([...originalNames(),...db.belts.map(x=>x.name)].map(x=>[keyName(x),x])).values()].sort()};
const style=document.createElement('style');
style.textContent='.ra-belt-row{background:#1a1010;border:1px solid #922727;border-radius:12px;padding:14px;margin:12px 0}.ra-prestige-score{font-size:25px;color:#ffcd37;font-weight:900;text-align:right}.ra-prestige-track{background:#422020;height:9px;border-radius:20px;overflow:hidden;margin-top:12px}.ra-prestige-track>div{height:100%;background:linear-gradient(90deg,#b80e18,#ffcd37);border-radius:20px}';
document.head.appendChild(style);
})();
