/* Independent first-party measurement. No cookies, browser storage, or fingerprints. */
(() => {
  'use strict';
  if (window.__audienceLedgerStarted) return;
  window.__audienceLedgerStarted = true;
  const endpoint = '/_audience/';
  const optedOut = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  if (optedOut() || !crypto.randomUUID) return;
  let consent = null, regional = false, tcfGranted = false, gdprApplies, gppBlocked = false, generation = 0;
  let run = null, view = null, queue = [], sending = false, routeTimer;
  const uuid = () => crypto.randomUUID();
  const path = () => location.pathname.slice(0, 1000);
  const loaded = () => Boolean(document.body && document.body.classList.contains('mv-loaded'));
  function accountTime() {
    if (!view) return;
    const now = performance.now();
    if (view.visible) view.ms += Math.max(0, now - view.clock);
    view.clock = now;
    view.visible = document.visibilityState === 'visible';
  }
  function event(type, extra = {}) {
    if (!consent || !view || optedOut()) return;
    accountTime();
    queue.push({v: 1, event_id: uuid(), run_id: run, view_id: view.id, type,
      pathname: view.path, nav: view.nav, visible_ms: Math.min(3600000, Math.round(view.ms)),
      interactions: view.interactions, webdriver: navigator.webdriver === true, mv_loaded: loaded(), ...extra});
    if (queue.length > 64) queue.shift();
  }
  function flush(leaving = false) {
    if (!consent || optedOut()) { queue = []; return; }
    if (!queue.length || sending) return;
    const batch = queue.splice(0, 6), batchGeneration = generation;
    const payload = JSON.stringify({v: 1, consent, events: batch});
    // A queued beacon is not a receipt; the server deduplicates event IDs if a retry occurs.
    if (leaving && navigator.sendBeacon(endpoint + 'events', new Blob([payload], {type: 'application/json'}))) return;
    sending = true;
    fetch(endpoint + 'events', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: payload, credentials: 'omit', keepalive: true}).then(r => {
      if (r.status >= 500 && consent && generation === batchGeneration) queue.unshift(...batch);
    }).catch(() => { if (consent && generation === batchGeneration) queue.unshift(...batch); }).finally(() => { sending = false; });
  }
  function page(nav = 'initial') {
    if (!consent || (view && view.path === path() && nav !== 'restore')) return;
    if (view) { event('evidence'); flush(true); }
    view = {id: uuid(), path: path(), nav, ms: 0, clock: performance.now(),
      visible: document.visibilityState === 'visible', interactions: 0, milestone: 0, ads: new Set()};
    event('page');
  }
  function applyConsent() {
    const next = !optedOut() && !gppBlocked ? (tcfGranted ? 'publisher_granted' : regional && gdprApplies !== true ? 'regional_aggregate' : null) : null;
    if (next === consent) return;
    generation++; queue = []; view = null; run = null; consent = next;
    if (consent) { run = uuid(); page(); }
  }
  // No collection outside the server-approved regional cohort without publisher measurement consent.
  fetch(endpoint + 'policy', {method: 'POST', credentials: 'omit', cache: 'no-store'}).then(r => r.ok ? r.json() : null).then(p => {
    regional = Boolean(p && p.regional_aggregate_allowed && !p.opted_out); applyConsent();
  }).catch(() => {});
  let tcfAttached = false, gppAttached = false;
  function consentApis() {
    if (!tcfAttached && typeof window.__tcfapi === 'function') {
      tcfAttached = true;
      try { window.__tcfapi('addEventListener', 2, (data, success) => {
        if (!success || !data) { tcfGranted = false; gdprApplies = true; applyConsent(); return; }
        // An explicit applicable GDPR decision takes precedence over regional fallback.
        gdprApplies = data.gdprApplies;
        tcfGranted = Boolean(data.gdprApplies === true && ['tcloaded', 'useractioncomplete'].includes(data.eventStatus)
          && data.purpose && data.purpose.consents && data.purpose.consents[8]
          && data.publisher && data.publisher.consents && data.publisher.consents[8]);
        applyConsent();
      }); } catch (_) { tcfGranted = false; gdprApplies = true; applyConsent(); }
    }
    if (!gppAttached && typeof window.__gpp === 'function') {
      gppAttached = true; gppBlocked = true; applyConsent();
      const inspect = () => { try { window.__gpp('ping', (data, success) => {
        if (!success || !data || data.signalStatus !== 'ready') { gppBlocked = true; applyConsent(); return; }
        if (!Array.isArray(data.applicableSections)) { gppBlocked = true; applyConsent(); return; }
        const sections = data.applicableSections;
        if (!sections.length || sections.every(n => n === -1 || n === 0)) { gppBlocked = false; applyConsent(); return; }
        // Unknown section schemas fail closed; no inference that missing opt-out flags mean consent.
        gppBlocked = true; applyConsent();
      }); } catch (_) { gppBlocked = true; applyConsent(); } };
      try { window.__gpp('addEventListener', inspect); inspect(); } catch (_) { gppBlocked = true; applyConsent(); }
    }
  }
  consentApis();
  let probes = 0;
  const consentTimer = setInterval(() => { consentApis(); if (++probes >= 120) clearInterval(consentTimer); }, 1000);
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      clearTimeout(routeTimer); routeTimer = setTimeout(() => page('spa'), 150);
      return result;
    };
  }
  addEventListener('popstate', () => { clearTimeout(routeTimer); routeTimer = setTimeout(() => page('spa'), 150); });
  document.addEventListener('visibilitychange', () => { accountTime(); if (document.visibilityState === 'hidden') { event('evidence'); flush(true); } });
  addEventListener('pagehide', () => { event('evidence'); flush(true); });
  addEventListener('pageshow', e => { if (e.persisted) page('restore'); });
  for (const [name, bit] of [['pointerdown', 1], ['keydown', 2], ['touchstart', 4]]) {
    document.addEventListener(name, e => {
      if (!e.isTrusted || !view || !consent) return;
      const old = view.interactions; view.interactions |= bit;
      if (old !== view.interactions) event('evidence');
    }, {passive: true, capture: true});
  }
  function affiliate(e) {
    if (!e.isTrusted || !consent || (e.type === 'click' && e.button !== 0) || (e.type === 'auxclick' && e.button !== 1)) return;
    const anchor = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!anchor) return;
    try {
      const url = new URL(anchor.href, location.href), host = url.hostname.toLowerCase().replace(/^www\./, '');
      if (!/^(amazon\.com|amzn\.to|partsgeek\.com|tirerack\.com|topdon\.us)$/.test(host)) return;
      const tag = url.searchParams.get('tag') || '';
      event('affiliate', {dest_host: host, ...(/^[a-zA-Z0-9_-]{1,80}$/.test(tag) ? {affiliate_tag: tag} : {})});
      flush(true);
    } catch (_) { /* Never interfere with an outbound link. */ }
  }
  document.addEventListener('click', affiliate, {capture: true, passive: true});
  document.addEventListener('auxclick', affiliate, {capture: true, passive: true});
  // Observe existing GPT events only. This does not request ads or alter Mediavine configuration.
  window.googletag = window.googletag || {cmd: []};
  window.googletag.cmd = window.googletag.cmd || [];
  window.googletag.cmd.push(() => {
    try {
      const service = window.googletag.pubads();
      for (const [name, kind] of [['slotRequested', 'requested'], ['slotRenderEnded', 'rendered'], ['impressionViewable', 'viewable']]) {
        service.addEventListener(name, e => {
          if (!view || !consent || (kind === 'rendered' && e.isEmpty)) return;
          const unit = e.slot.getAdUnitPath();
          if (!unit.startsWith('/1030006,23375603676/') || /verification/i.test(unit)) return;
          const key = kind + ':' + e.slot.getSlotElementId();
          if (view.ads.has(key)) return;
          view.ads.add(key); event('ad', {ad_kind: kind, unit: 'mediavine'});
        });
      }
    } catch (_) { /* Ad measurement is optional and cannot break rendering. */ }
  });
  setInterval(() => {
    if (optedOut()) { applyConsent(); return; }
    accountTime();
    if (view) {
      const milestone = view.ms >= 30000 ? 2 : view.ms >= 10000 ? 1 : 0;
      if (milestone > view.milestone) { view.milestone = milestone; event('evidence'); }
    }
    flush();
  }, 2000);
})();
