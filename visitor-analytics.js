/* Rise Above Wrestling Tracker v1.6.3 — dark visitor counter theme.
   GoatCounter's public embeds are preserved. No changes to saved universe data. */
(function () {
  'use strict';
  const ROOT='https://riseabovexp.goatcounter.com';
  const dateAt = offset => {
    const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+offset);
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  };
  const el=(tag,cls,text)=>{
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(text!==undefined)e.textContent=text;
    return e;
  };
  const css=`
.ra-analytics{background:linear-gradient(145deg,#230909,#0d0d0f);border:2px solid #e32c2c;border-radius:16px;padding:16px;margin:20px 0;color:#fff;box-shadow:0 0 14px #a00a}
.ra-analytics h2{margin:0 0 8px;font-size:clamp(19px,4vw,26px);color:#fff}
.ra-analytics-note{font-size:12px;color:#c8b7b7;margin:8px 0}
.ra-analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:15px 0}
.ra-analytics-card{border:1px solid #ba3333;border-radius:11px;padding:13px;background:#160f10;min-width:0;overflow:hidden}
.ra-analytics-label{color:#d6c7c7;font-size:13px}
.ra-analytics-number{font-size:clamp(17px,4vw,26px);color:#ffbf45;margin-top:7px;min-height:32px;overflow:hidden}
.ra-analytics-chart{display:flex;justify-content:space-around;gap:5px;min-height:110px;padding:12px 2px;border-top:1px solid #672020;margin-top:18px}
.ra-analytics-day{display:flex;flex:1;min-width:0;align-items:center;flex-direction:column;justify-content:end;gap:7px;font-size:11px;text-align:center;overflow:hidden}
.ra-analytics-day small{font-size:10px;color:#c7bdbd}
.ra-analytics-day-value{width:100%;overflow:hidden;font-size:11px;color:#ffbf45}
.ra-analytics iframe{display:block!important;width:100%!important;max-width:100%!important;border:0!important;background:#160f10!important;filter:invert(1) grayscale(1) sepia(1) saturate(3) hue-rotate(345deg)!important}
.ra-analytics .ra-analytics-day-value iframe{height:46px!important;min-height:46px!important}
.ra-analytics .ra-analytics-number iframe{height:105px!important;min-height:105px!important}
.ra-analytics .gcvc,.ra-analytics .gcvc *{box-sizing:border-box}
.ra-analytics [id^="ra-count-"] > div,.ra-analytics [id^="ra-day-"] > div{background:transparent!important;color:#ffbf45!important;border:0!important;box-shadow:none!important;max-width:100%!important;padding:0!important;margin:0!important}
.ra-analytics #gcvc-for,.ra-analytics #gcvc-by{display:none!important}
.ra-analytics #gcvc-views{color:#ffbf45!important;font-weight:700!important}
`;
  const style=el('style');style.textContent=css;document.head.appendChild(style);
  function mount(){
    if(document.getElementById('ra-visitor-analytics'))return;
    const heading=Array.from(document.querySelectorAll('h1,h2,h3')).find(x=>/universe dashboard/i.test(x.textContent||''));
    const anchor=heading&&(heading.closest('section')||heading.parentElement);
    if(!anchor)return;
    const panel=el('section','ra-analytics');panel.id='ra-visitor-analytics';
    panel.appendChild(el('h2','','📊 Visitor Analytics'));
    panel.appendChild(el('p','ra-analytics-note','Public GoatCounter visits · Counts may be cached for up to 4 hours'));
    const grid=el('div','ra-analytics-grid');panel.appendChild(grid);
    const targets=[];
    function add(parent,label,id,start,end,small=false){
      const card=small?parent:el('div','ra-analytics-card');
      if(!small)card.appendChild(el('div','ra-analytics-label',label));
      const slot=el('div',small?'ra-analytics-day-value':'ra-analytics-number','Loading…');
      slot.id=id;card.appendChild(slot);
      if(!small)parent.appendChild(card);
      targets.push({id,start,end});
    }
    add(grid,'Today','ra-count-today',dateAt(0),dateAt(0));
    add(grid,'Yesterday','ra-count-yesterday',dateAt(-1),dateAt(-1));
    add(grid,'Last 7 Days','ra-count-week',dateAt(-6),dateAt(0));
    add(grid,'Total Visitors','ra-count-total',null,null);
    const chart=el('div','ra-analytics-chart');panel.appendChild(chart);
    for(let i=-6;i<=0;i++){
      const day=el('div','ra-analytics-day');
      add(day,'','ra-day-'+(i+6),dateAt(i),dateAt(i),true);
      day.appendChild(el('small','',dateAt(i).slice(5)));
      chart.appendChild(day);
    }
    const status=el('p','ra-analytics-note','Loading public counters…');panel.appendChild(status);
    anchor.insertAdjacentElement('afterend',panel);
    const render=()=>{
      if(!window.goatcounter||typeof window.goatcounter.visit_count!=='function'){
        status.textContent='GoatCounter script unavailable.';return;
      }
      let errors=0;
      for(const item of targets){
        const slot=document.getElementById(item.id);if(!slot)continue;
        slot.textContent='';
        try{
          const options={append:'#'+item.id,path:'TOTAL',type:'html',no_branding:true};
          if(item.start)options.start=item.start;
          if(item.end)options.end=item.end;
          window.goatcounter.visit_count(options);
        }catch(e){errors++;slot.textContent='Unavailable';console.warn('Visitor counter',item.id,e);}
      }
      status.textContent=errors?'Some public counters could not load.':
        'Site-wide visit counts from GoatCounter. Updates may take up to 4 hours.';
    };
    if(window.goatcounter&&typeof window.goatcounter.visit_count==='function'){render();return;}
    let script=document.querySelector('script[data-goatcounter]');
    if(!script){
      script=document.createElement('script');script.async=true;
      script.src='https://gc.zgo.at/count.js';script.dataset.goatcounter=ROOT+'/count';
      document.head.appendChild(script);
    }
    let tries=0;
    const timer=setInterval(()=>{
      if(window.goatcounter&&typeof window.goatcounter.visit_count==='function'){
        clearInterval(timer);render();
      }else if(++tries>=100){
        clearInterval(timer);
        status.textContent='GoatCounter did not load. Check your network or content blocker.';
      }
    },100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  else mount();
})();
