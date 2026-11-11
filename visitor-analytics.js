/* Rise Above Wrestling Tracker v1.6.1 — public GoatCounter analytics.
   Public counter only. Never place API tokens in a GitHub Pages file. */
(function () {
  'use strict';
  const GOATCOUNTER_CODE = 'riseabovexp';
  const root = 'https://' + GOATCOUNTER_CODE + '.goatcounter.com';
  const fmt = new Intl.NumberFormat('en-US');
  const configured = /^[a-z0-9][a-z0-9-]*$/i.test(GOATCOUNTER_CODE);
  function el(tag, cls, value) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function dateISO(offset) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  // GoatCounter public counters are for a single recorded path, not an entire site.
  // GitHub Pages can record the same page with or without a trailing slash or index.html.
  function candidatePaths() {
    const path = location.pathname;
    const trimmed = path.replace(/\/+$/, '');
    const paths = [path, trimmed, trimmed + '/', trimmed + '/index.html'];
    return [...new Set(paths.filter(Boolean))];
  }
  function urlFor(path, start, end) {
    const url = new URL(root + '/counter/' + encodeURIComponent(path) + '.json');
    if (start) url.searchParams.set('start', start);
    if (end) url.searchParams.set('end', end);
    return url.toString();
  }
  async function fetchCounter(path, start, end) {
    const url = urlFor(path, start, end);
    let response;
    try {
      response = await fetch(url, { cache: 'no-store' });
    } catch (error) {
      throw new Error('Network/CORS error: ' + error.message);
    }
    if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + path);
    const data = await response.json();
    if (!data || data.count === undefined || data.count === null) throw new Error('Missing count in JSON response');
    const count = Number(String(data.count).replace(/,/g, '').trim());
    if (!Number.isFinite(count)) throw new Error('Invalid count returned');
    return count;
  }
  async function choosePath() {
    const failures = [];
    for (const path of candidatePaths()) {
      try {
        await fetchCounter(path, null, null);
        return path;
      } catch (error) {
        failures.push(error.message);
      }
    }
    throw new Error(failures.join(' | '));
  }
  function setup() {
    if (document.getElementById('ra-visitor-analytics')) return;
    const dashboard = [...document.querySelectorAll('h1,h2,h3')].find(n => /universe dashboard/i.test(n.textContent || ''));
    const anchor = dashboard && (dashboard.closest('section') || dashboard.parentElement);
    if (!anchor) return;
    const panel = el('section', 'ra-analytics');
    panel.id = 'ra-visitor-analytics';
    panel.appendChild(el('h2', '', '📊 Visitor Analytics'));
    panel.appendChild(el('p', 'ra-analytics-note', 'Public page-view counts · GoatCounter statistics may be delayed'));
    const grid = el('div', 'ra-analytics-grid');
    panel.appendChild(grid);
    const fields = {};
    [['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'Last 7 Days'], ['total', 'Total Visitors']].forEach(([key, label]) => {
      const card = el('div', 'ra-analytics-card');
      card.appendChild(el('div', 'ra-analytics-label', label));
      fields[key] = el('strong', 'ra-analytics-number', 'Loading…');
      card.appendChild(fields[key]);
      grid.appendChild(card);
    });
    const chart = el('div', 'ra-analytics-chart');
    panel.appendChild(chart);
    const status = el('p', 'ra-analytics-note', 'Connecting to GoatCounter…');
    panel.appendChild(status);
    anchor.insertAdjacentElement('afterend', panel);
    if (!configured) {
      status.textContent = 'Invalid GoatCounter site code.';
      return;
    }
    // Keep tracking independently from whether public statistics can be fetched.
    if (!document.querySelector('script[data-goatcounter]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://gc.zgo.at/count.js';
      script.dataset.goatcounter = root + '/count';
      document.head.appendChild(script);
    }
    choosePath().then(async path => {
      const days = Array.from({ length: 7 }, (_, i) => dateISO(i - 6));
      const queries = [
        [days[6], days[6]],
        [dateISO(-1), dateISO(-1)],
        [days[0], days[6]],
        [null, null],
        ...days.map(day => [day, day])
      ];
      const results = await Promise.allSettled(queries.map(([start, end]) => fetchCounter(path, start, end)));
      ['today', 'yesterday', 'week', 'total'].forEach((key, i) => {
        fields[key].textContent = results[i].status === 'fulfilled' ? fmt.format(results[i].value) : 'Unavailable';
      });
      const daily = results.slice(4).map((r, i) => ({ date: days[i], count: r.status === 'fulfilled' ? r.value : null }));
      const max = Math.max(1, ...daily.map(d => d.count || 0));
      daily.forEach(d => {
        const col = el('div', 'ra-analytics-day');
        col.appendChild(el('span', '', d.count === null ? '—' : String(d.count)));
        const bar = el('div', 'ra-analytics-bar');
        bar.style.height = Math.max(3, Math.round(72 * (d.count || 0) / max)) + 'px';
        bar.title = d.date + ': ' + (d.count === null ? 'Unavailable' : d.count + ' page views');
        col.appendChild(bar);
        col.appendChild(el('small', '', d.date.slice(5)));
        chart.appendChild(col);
      });
      const failures = results.filter(r => r.status === 'rejected');
      status.textContent = failures.length
        ? 'Counter connected for ' + path + ', but ' + failures.length + ' date queries failed: ' + failures[0].reason.message
        : 'Showing public page views for ' + path + '. Repeat visits may be included.';
    }).catch(error => {
      Object.values(fields).forEach(field => { field.textContent = 'Unavailable'; });
      status.textContent = 'Could not read public counters: ' + error.message + '. Check the path in GoatCounter and public counter permissions.';
    });
  }
  const css = document.createElement('style');
  css.textContent = `
.ra-analytics{background:linear-gradient(145deg,#230909,#0d0d0f);border:2px solid #e32c2c;border-radius:16px;padding:16px;margin:20px 0;color:#fff;box-shadow:0 0 14px #a00a}
.ra-analytics h2{margin:0 0 8px;font-size:clamp(19px,4vw,26px);color:#fff}
.ra-analytics-note{font-size:12px;color:#c8b7b7;margin:8px 0;overflow-wrap:anywhere}
.ra-analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:15px 0}
.ra-analytics-card{border:1px solid #ba3333;border-radius:11px;padding:13px;background:#160f10;min-width:0}
.ra-analytics-label{color:#d6c7c7;font-size:13px}.ra-analytics-number{display:block;font-size:clamp(18px,4.5vw,32px);color:#ffbf45;margin-top:5px;overflow-wrap:anywhere}
.ra-analytics-chart{display:flex;align-items:end;justify-content:space-around;gap:5px;min-height:125px;padding:12px 2px;border-top:1px solid #672020}
.ra-analytics-day{display:flex;flex:1;min-width:0;align-items:center;flex-direction:column;justify-content:end;gap:5px;font-size:11px}
.ra-analytics-day small{font-size:10px;color:#c7bdbd}.ra-analytics-bar{background:linear-gradient(#fa4444,#960a0a);width:80%;border-radius:5px 5px 0 0;min-height:3px}
`;
  document.head.appendChild(css);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
