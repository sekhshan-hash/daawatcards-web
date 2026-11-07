() => {
  const roots = Array.from(document.querySelectorAll('.gc-root'));
  const out = [];
  const figs = Array.from(document.querySelectorAll('.gc-photo')).filter(f => !f.closest('[role="dialog"]'));
  const all = Array.from(document.querySelectorAll('[data-testid]'));
  for (const f of figs) {
    const r = f.getBoundingClientRect();
    const img = f.querySelector('img');
    const ir = img ? img.getBoundingClientRect() : r;
    const scope = f.closest('.gc-welcome') || f.closest('.gc-root') || document.body;
    const texts = Array.from(scope.querySelectorAll('p,h1,h2,h3,blockquote,a,button')).filter(el => !f.contains(el) && !el.closest('.gc-photo') && !(el.className + '').includes('watermark') && !el.closest('[class*="watermark"]') && el.getBoundingClientRect().height > 0 && (el.textContent || '').trim().length > 0);
    const overlaps = [];
    for (const el of texts) {
      const t = el.getBoundingClientRect();
      const ix = Math.min(ir.right, t.right) - Math.max(ir.left, t.left);
      const iy = Math.min(ir.bottom, t.bottom) - Math.max(ir.top, t.top);
      if (ix > 0 && iy > 7) overlaps.push({ tid: el.getAttribute('data-testid') || el.tagName + '.' + (el.className + '').slice(0, 25), dy: Math.round(iy), txt: el.textContent.trim().slice(0, 40) });
    }
    // DOM neighbours with testids
    let prev = null, next = null;
    for (const el of all) {
      if (el === f || f.contains(el) || el.contains(f) || el.closest('.gc-photo')) continue;
      if (!scope.contains(el)) continue;
      const pos = f.compareDocumentPosition(el);
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) prev = el.getAttribute('data-testid');
      else if ((pos & Node.DOCUMENT_POSITION_FOLLOWING) && !next) next = el.getAttribute('data-testid');
    }
    const card = (f.closest('.gc-welcome') || f.closest('.gc-root') || document.body).getBoundingClientRect();
    out.push({ tid: f.getAttribute('data-testid'), cls: (f.className + '').slice(0, 70), fig: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], img: [Math.round(ir.left), Math.round(ir.top), Math.round(ir.width), Math.round(ir.height)], container: [Math.round(card.left), Math.round(card.right)], centreOff: Math.round((ir.left + ir.right) / 2 - (card.left + card.right) / 2), clippedRight: Math.round(ir.right - card.right), prev, next, overlaps });
  }
  const tops = {};
  for (const id of ['card-invitation-text', 'card-blessing', 'card-event-title', 'card-event-name', 'card-event-closing', 'welcome-greeting', 'welcome-salutation', 'welcome-continue-button']) {
    const e = document.querySelector(`.gc-root [data-testid="${id}"]`) || document.querySelector(`[data-testid="${id}"]`);
    if (e) tops[id] = Math.round(e.getBoundingClientRect().top);
  }
  return { n: figs.length, roots: roots.length, figs: out, tops };
}
