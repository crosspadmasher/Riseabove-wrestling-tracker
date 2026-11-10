/* Rise Above Wrestling Tracker v1.2 add-on. Load after the original inline app scripts. */
(() => {
  'use strict';
  const VERSION = '1.2';
  const newsEsc = s => esc(String(s ?? ''));
  const pct = value => Math.max(1, Math.min(100, Math.round(Number(value) || 1)));
  const matchPct = m => pct(m.rating);
  const reportDate = s => s?.date || '';

  // Migrate historical 1–5-star ratings once, without discarding saved universe data.
  if (!db.ratingScaleV12) {
    db.shows.forEach(s => (s.matches || []).forEach(m => {
      if (Number.isFinite(Number(m.rating))) m.rating = pct(Number(m.rating) * 20);
    }));
    db.ratingScaleV12 = 'percent';
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  autoRating = function(matches) {
    if (!matches.length) return '0';
    return (Math.round(matches.reduce((n,m)=>n+Number(m.rating||0),0)/matches.length)/10).toFixed(1);
  };

  const originalBook = book;
  book = function () {
    return originalBook()
      .replace('Match rating (1–5 stars)', 'Match rating (1–100%)')
      .replace(/id="mrating" type="number" min="1" max="5" step="0\.5" value="3\.5"/, 'id="mrating" type="number" min="1" max="100" step="1" value="75"')
      .replace(/★ (\d+(?:\.\d+)?)\/5/g, (_, n) => `${pct(n)}%`);
  };

  // Preserve the existing singles/tag booking and all other match information.
  addMatch = function () {
    captureShowDraft();
    const ids = [document.getElementById('ma')?.value,
      ...(matchMode === 'tag' ? [document.getElementById('ma2')?.value] : []),
      document.getElementById('mb')?.value,
      ...(matchMode === 'tag' ? [document.getElementById('mb2')?.value] : [])];
    if (ids.some(v => !v) || new Set(ids).size !== ids.length) {
      return alert(`Choose ${ids.length} different wrestlers.`);
    }
    const rating = Number(document.getElementById('mrating')?.value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 100) {
      return alert('Enter a whole-number match rating from 1 to 100%.');
    }
    const split = matchMode === 'tag' ? 2 : 1;
    const teamA = ids.slice(0, split), teamB = ids.slice(split);
    const choice = document.getElementById('mw').value;
    draft.push({id:id(), a:teamA[0], b:teamB[0], teamA, teamB,
      winner:choice === 'draw' ? 'draw' : choice === 'a' ? teamA[0] : teamB[0],
      type:document.getElementById('mtype').value.trim() || (matchMode === 'tag' ? 'Tag Team' : 'Singles'),
      rating, notes:document.getElementById('mnotes').value.trim()});
    render();
  };

  const originalHistory = history;
  history = function () {
    return originalHistory()
      .replace(/Avg match ★ (\d+(?:\.\d+)?)\/5/g, (_, n) => `Avg match ${Math.round(Number(n))}%`)
      .replace(/★ (\d+(?:\.\d+)?)\/5/g, (_, n) => `${pct(n)}%`)
      .replace('five stars = 10/10', '100% match quality = 10/10 show score');
  };

  // All news is calculated from saved shows; it automatically updates on show 3, 6, 9, etc.
  function newsReports() {
    const reports = [];
    for (let i = 0; i + 3 <= db.shows.length; i += 3) {
      const group = db.shows.slice(i, i + 3);
      const matches = group.flatMap(s => s.matches || []);
      const rated = matches.filter(m => Number.isFinite(Number(m.rating)));
      const best = [...rated].sort((a,b) => matchPct(b)-matchPct(a))[0];
      const wins = new Map();
      matches.forEach(m => {
        if (!m.winner || m.winner === 'draw') return;
        const winners = (m.teamA || [m.a]).includes(m.winner) ? (m.teamA || [m.a]) : (m.teamB || [m.b]);
        winners.forEach(w => wins.set(w, (wins.get(w) || 0) + 1));
      });
      const leader = [...wins].sort((a,b)=>b[1]-a[1])[0];
      const topShow = [...group].sort((a,b)=>Number(b.rating)-Number(a.rating))[0];
      reports.push({number:i/3+1, group, matches, best, leader, topShow,
        avg:rated.length ? Math.round(rated.reduce((n,m)=>n+matchPct(m),0)/rated.length) : null});
    }
    return reports.reverse();
  }
  function wrestlingNews() {
    const reports = newsReports();
    const untilNext = 3 - (db.shows.length % 3);
    return `<h2>📰 Wrestling Universe News</h2>
      <section class="panel"><h3>Rise Above Newsroom</h3>
        <p class="muted">Your own promotion's news is automatically compiled after every 3 completed shows. All headlines are based on your saved results.</p>
        <div class="grid"><div class="stat"><span>Completed shows</span><strong>${db.shows.length}</strong></div>
        <div class="stat"><span>News editions</span><strong>${reports.length}</strong></div>
        <div class="stat"><span>Shows until next edition</span><strong>${untilNext}</strong></div></div>
      </section>
      ${reports.map(r => `<section class="panel"><h3>🗞️ Edition #${r.number}: Three-Show Roundup</h3>
        <p class="muted small">${newsEsc(reportDate(r.group[0]))} – ${newsEsc(reportDate(r.group[2]))} · ${r.matches.length} matches</p>
        <div class="result"><b>🔥 Main headline: ${newsEsc(r.topShow.title)} leads the ratings</b>
          <p>Top-rated show of this edition: ${newsEsc(r.topShow.title)} (${newsEsc(r.topShow.rating)}/10).</p></div>
        ${r.best ? `<div class="result"><b>🏅 Match of the edition</b><p>${newsEsc(matchLabel(r.best))} earned ${matchPct(r.best)}%.</p></div>` : ''}
        ${r.leader ? `<div class="result"><b>📈 Winning momentum</b><p>${newsEsc(name(r.leader[0]))} recorded ${r.leader[1]} win${r.leader[1]===1?'':'s'} across these three shows.</p></div>` : ''}
        <div class="result"><b>📊 Three-show statistics</b><p>${r.matches.length} matches booked${r.avg===null?'':` · Average match rating ${r.avg}%`}.</p></div>
        <p class="small muted">Featured shows: ${r.group.map(s=>newsEsc(s.title)).join(' · ')}</p>
      </section>`).join('') || '<div class="empty">Your first news edition unlocks when you complete 3 shows.</div>'}`;
  }

  function brandLogo() {
    return `<h2>🎨 Wrestling Brand Logo</h2><section class="panel">
      <p class="muted">Upload a PNG for your wrestling promotion. The logo is saved locally with your universe and included in JSON backups.</p>
      ${db.brandLogoV12 ? `<p><img alt="Uploaded wrestling brand logo" src="${db.brandLogoV12}" style="display:block;max-width:240px;max-height:180px;object-fit:contain;border:1px solid #6a3b2a;padding:12px;border-radius:8px;background:#161616"></p>` : '<div class="empty">No custom logo uploaded yet.</div>'}
      <label for="brandLogoFile">Choose PNG image (maximum 350 KB)</label>
      <input id="brandLogoFile" type="file" accept="image/png,.png" onchange="uploadBrandLogoV12(event)">
      ${db.brandLogoV12 ? '<p><button class="danger" onclick="removeBrandLogoV12()">Remove Logo</button></p>' : ''}
      <p class="small muted">Tip: Use a square PNG with a transparent background. Large files may exceed browser storage limits.</p>
    </section>`;
  }

  window.uploadBrandLogoV12 = async function(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/png' || !file.name.toLowerCase().endsWith('.png')) return alert('Please select a PNG image.');
    if (file.size > 350 * 1024) return alert('PNG is too large. Please use an image smaller than 350 KB.');
    const bytes = new Uint8Array(await file.slice(0,8).arrayBuffer());
    if ([137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v)) return alert('This file is not a valid PNG.');
    const reader = new FileReader();
    reader.onload = () => {
      const previous = db.brandLogoV12;
      db.brandLogoV12 = reader.result;
      try { save(); } catch(err) {
        db.brandLogoV12 = previous;
        alert('Not enough device storage for this logo. Try a smaller PNG and export a backup.');
        render();
      }
    };
    reader.readAsDataURL(file);
  };
  window.removeBrandLogoV12 = function() {
    if (!confirm('Remove your wrestling brand logo?')) return;
    delete db.brandLogoV12;
    save();
  };

  // Keep backup/restore and factory reset compatible with the new fields.
  const oldImport = importData;
  importData = async function () {
    await oldImport();
    if (!db.ratingScaleV12) {
      db.shows.forEach(s => (s.matches || []).forEach(m => m.rating = pct(Number(m.rating)*20)));
      db.ratingScaleV12 = 'percent';
      save();
    }
  };

  tabs.splice(tabs.indexOf('Backup'), 0, 'Wrestling News', 'Brand Logo');
  const oldRender = render;
  render = function () {
    if (tab === 'Wrestling News' || tab === 'Brand Logo') {
      document.getElementById('nav').innerHTML = tabs.map(t=>`<button class="${t===tab?'active':''}" onclick="go('${t}')">${t}</button>`).join('');
      document.getElementById('app').innerHTML = tab === 'Wrestling News' ? wrestlingNews() : brandLogo();
    } else {
      oldRender();
      if (db.brandLogoV12 && tab === 'Dashboard') {
        const dashboardTitle = document.querySelector('#app h2');
        if (dashboardTitle) dashboardTitle.insertAdjacentHTML('afterend', `<div style="margin:12px 0"><img alt="Wrestling brand logo" src="${db.brandLogoV12}" style="max-width:150px;max-height:110px;object-fit:contain"></div>`);
      }
    }
  };
  const footer = document.querySelector('footer');
  if (footer) footer.append(document.createTextNode(` · Features v${VERSION}`));
  render();
})();
