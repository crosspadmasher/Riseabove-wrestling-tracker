/* Rise Above Wrestling Tracker v1.6.2 — public GoatCounter visitor counters.
   Uses the documented goatcounter.visit_count() embed rather than cross-origin fetch.
   No API tokens. Counts represent GoatCounter visits, not guaranteed unique people. */
(function () {
  'use strict';
  const CODE = 'riseabovexp';
  const ROOT = 'https://' + CODE + '.goatcounter.com';
  const SCRIPT_URL = 'https://gc.zgo.at/count.js';
  const COUNTER_PATH = 'TOTAL'; // Site-wide counts; GoatCounter's documented special path.
  const el = (tag, cls, content) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  function dateAt(offset) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  function mount() {
    if (document.getElementById('ra-visitor-analytics')) return;
    const heading = Array.from(document.querySelectorAll('h1,h2,h3')).find(node => /universe dashboard/i.test(node.textContent || ''));
    const anchor = heading && (heading.closest('section') || heading.parentElement);
    if (!anchor) return;
    const panel = el('section', 'ra-analytics');
    panel.id = 'ra-visitor-analytics';
    panel.appendChild(el('h2', '', '📊 Visitor Analytics'));
    panel.appendChild(el('p', 'ra-analytics-note', 'Public GoatCounter visits · Counts may be cached for up to 4 hours'));
    const grid = el('div', 'ra-analytics-grid');
    panel.appendChild(grid);
    const targets = [];
    function addCounter(parent, label, id, start, end) {
      const card = el('div', 'ra-analytics-card');
      card.appendChild(el('div', 'ra-analytics-label', label));
      const slot = el('div', 'ra-analytics-number');
      slot.id = id;
      slot.textContent = 'Loading…';
      card.appendChild(slot);
      parent.appendChild(card);
      targets.push({ id, start, end });
    }
    addCounter(grid, 'Today', 'ra-count-today', dateAt(0), dateAt(0));
    addCounter(grid, 'Yesterday', 'ra-count-yesterday', dateAt(-1), dateAt(-1));
    addCounter(grid, 'Last 7 Days', 'ra-count-week', dateAt(-6), dateAt(0));
    addCounter(grid, 'Total Visitors', 'ra-count-total', null, null);
    const chart = el('div', 'ra-analytics-chart');
    panel.appendChild(chart);
    for (let i = -6; i <= 0; i++) {
      const date = dateAt(i);
      const day = el('div', 'ra-analytics-day');
      const value = el('div', 'ra-analytics-day-value');
      value.id = 'ra-day-' + (i + 6);
      value.textContent = '…';
      day.appendChild(value);
      day.appendChild(el('small', '', date.slice(5)));
      chart.appendChild(day);
      targets.push({ id: value.id, start: date, end: date });
    }
    const status = el('p', 'ra-analytics-note', 'Loading GoatCounter public counters…');
    panel.appendChild(status);
    anchor.insertAdjacentElement('afterend', panel);

    // Official public visitor counter integration. The script inserts HTML
    // into each target; this avoids relying on browser cross-origin JSON fetch.
    const render = () => {
      if (!window.goatcounter || typeof window.goatcounter.visit_count !== 'function') {
        status.textContent = 'GoatCounter counter script did not load. Check your connection or content blocker.';
        return;
      }
      let failures = 0;
      targets.forEach(item => {
        const slot = document.getElementById(item.id);
        if (!slot) return;
        slot.textContent = '';
        try {
          const opts = { append: '#' + item.id, path: COUNTER_PATH, type: 'html', no_branding: true };
          if (item.start) opts.start = item.start;
          if (item.end) opts.end = item.end;
          window.goatcounter.visit_count(opts);
        } catch (err) {
          failures++;
          slot.textContent = 'Unavailable';
          console.warn('Rise Above visitor counter:', item.id, err);
        }
      });
      status.textContent = failures ? 'Some counters could not be displayed. Check the browser console for details.' :
        'Site-wide visit counts from GoatCounter. Updates may take up to 4 hours.';
    };
    if (window.goatcounter && typeof window.goatcounter.visit_count === 'function') {
      render();
    } else {
      let script = document.querySelector('script[data-goatcounter]');
      if (!script) {
        script = document.createElement('script');
        script.async = true;
        script.src = SCRIPT_URL;
        script.dataset.goatcounter = ROOT + '/count';
        document.head.appendChild(script);
      }
      let tries = 0;
      const poll = setInterval(() => {
        if (window.goatcounter && typeof window.goatcounter.visit_count === 'function') {
          clearInterval(poll);
          render();
        } else if (++tries >= 100) {
          clearInterval(poll);
          status.textContent = 'GoatCounter did not load within 10 seconds. Check network or content-blocking settings.';
        }
      }, 100);
    }
  }
  const style = document.createElement('style');
  style.textContent = `
.ra-analytics{background:linear-gradient(145deg,#230909,#0d0d0f);border:2px solid #e32c2c;border-radius:16px;padding:16px;margin:20px 0;color:#fff;box-shadow:0 0 14px #a00a}
.ra-analytics h2{margin:0 0 8px;font-size:clamp(19px,4vw,26px);color:#fff}
.ra-analytics-note{font-size:12px;color:#c8b7b7;margin:8px 0}
.ra-analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:15px 0}
.ra-analytics-card{border:1px solid #ba3333;border-radius:11px;padding:13px;background:#160f10;min-width:0}
.ra-analytics-label{color:#d6c7c7;font-size:13px}
.ra-analytics-number{font-size:clamp(17px,4vw,26px);color:#ffbf45;margin-top:7px;min-height:32px;overflow-wrap:anywhere}
.ra-analytics-chart{display:flex;justify-content:space-around;gap:5px;min-height:110px;padding:12px 2px;border-top:1px solid #672020;margin-top:18px}
.ra-analytics-day{display:flex;flex:1;min-width:0;align-items:center;flex-direction:column;justify-content:end;gap:7px;font-size:11px;text-align:center}
.ra-analytics-day small{font-size:10px;color:#c7bdbd}
.ra-analytics-day-value{max-width:100%;overflow:hidden;font-size:11px;color:#ffbf45}
.ra-analytics .gcvc, .ra-analytics .gcvc *{box-sizing:border-box}
.ra-analytics [id^="ra-count-"] > div, .ra-analytics [id^="ra-day-"] > div{background:transparent!important;color:#ffbf45!important;border:0!important;box-shadow:none!important;width:auto!important;height:auto!important;max-width:100%!important;padding:0!important;margin:0!important;font-size:inherit!important}
.ra-analytics #gcvc-for,.ra-analytics #gcvc-by{display:none!important}
.ra-analytics #gcvc-views{color:#ffbf45!important;font-size:inherit!important;font-weight:700!important}
`;
  document.head.appendChild(style);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
