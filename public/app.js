const BASE = new URL('./', location.href).href;
const $ = (s) => document.querySelector(s);
const LANG_KEY = 'astra-gallery-lang';
const CAT_ORDER = ['all', '3d-spatial', 'coding-agent', 'computer-use', 'docs-office', 'math-science', 'cost-economics', 'cyber', 'safety-monitorability'];
const ICONS = ['▦', '◇', '⌘', '▣', '▤', '∿', '◷', '⌁', '◎'];
const FEATURED_IDS = ['x-2095596175705399482', 'macos-27-simulator', 'x-2095609734845927525'];

let i18n = {};
let lang = 'zh';
let entries = [];
let active = 'all';
let live = false;
let cost = false;
let limit = 12;

function detectLang() {
  const params = new URLSearchParams(location.search);
  const q = (params.get('lang') || '').toLowerCase();
  if (q.startsWith('zh')) return 'zh';
  if (q.startsWith('en')) return 'en';
  try {
    const saved = (localStorage.getItem(LANG_KEY) || '').toLowerCase();
    if (saved.startsWith('zh')) return 'zh';
    if (saved.startsWith('en')) return 'en';
  } catch (_) {}
  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
}

function t(key, vars) {
  let s = i18n[key];
  if (s == null) return key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      s = String(s).replaceAll('{' + k + '}', String(vars[k]));
    });
  }
  return s;
}

function catLabel(key) {
  return (i18n.categories && i18n.categories[key]) || key;
}

function field(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    return v[lang] || v.en || v.zh || '';
  }
  return String(v);
}

function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function url(v) {
  try {
    const u = new URL(v, BASE);
    return ['https:', 'http:'].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

function compactNum(n) {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  const locale = lang === 'zh' ? 'zh-CN' : 'en';
  try {
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  } catch {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
}

function attentionLine(e) {
  const m = e.attention && e.attention.metrics;
  if (!m) return null;
  const parts = [];
  const views = compactNum(m.impressions);
  const likes = compactNum(m.likes);
  if (views) parts.push(views + ' ' + t('sigViews'));
  if (likes) parts.push(likes + ' ' + t('sigLikes'));
  if (!parts.length) return null;
  return parts.join(' · ');
}

function setLang(next, { persist = true, pushUrl = true } = {}) {
  lang = next === 'en' ? 'en' : 'zh';
  if (persist) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
  }
  if (pushUrl) {
    const u = new URL(location.href);
    u.searchParams.set('lang', lang);
    history.replaceState(null, '', u);
  }
}

async function loadI18n(code) {
  const response = await fetch('./i18n/' + code + '.json');
  if (!response.ok) throw new Error('i18n ' + code + ' ' + response.status);
  return response.json();
}

function ensureLangToggle() {
  let btn = $('#lang-toggle');
  if (btn) return btn;
  const links = $('.toplinks');
  if (!links) return null;
  btn = node('button', 'lang-toggle');
  btn.id = 'lang-toggle';
  btn.type = 'button';
  links.insertBefore(btn, links.firstChild);
  btn.addEventListener('click', async () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    i18n = await loadI18n(lang);
    applyChrome();
    categories();
    featured();
    render();
  });
  return btn;
}

function applyChrome() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('documentTitle');
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t('metaDescription'));

  const edition = document.querySelector('.edition');
  if (edition) edition.textContent = t('edition');

  const github = $('#github-link');
  if (github) github.textContent = t('github');
  const submit = $('#submit-link');
  if (submit) submit.textContent = t('submit');

  const toggle = ensureLangToggle();
  if (toggle) {
    toggle.textContent = t('langToggle');
    toggle.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
  }

  const eyebrow = document.querySelector('.eyebrow');
  if (eyebrow) {
    const dot = eyebrow.querySelector('span') || node('span');
    eyebrow.replaceChildren(dot, document.createTextNode(' ' + t('eyebrow')));
  }

  const h1 = document.querySelector('.intro h1');
  if (h1) {
    h1.replaceChildren(
      document.createTextNode(t('heroTitleBefore')),
      node('span', '', t('heroTitleAccent'))
    );
  }

  const lead = document.querySelector('.intro p');
  if (lead) lead.innerHTML = t('lead');

  const catalogSpan = document.querySelector('.catalog-number > span');
  if (catalogSpan) catalogSpan.textContent = t('catalogLabel');

  const searchRegion = document.querySelector('.search-region');
  if (searchRegion) searchRegion.setAttribute('aria-label', t('searchRegionAria'));

  const search = $('#search');
  if (search) {
    search.placeholder = t('searchPlaceholder');
    search.setAttribute('aria-label', t('searchAria'));
  }

  const quickOnly = document.querySelector('.quick > span');
  if (quickOnly) quickOnly.textContent = t('quickOnly');

  const liveBtn = $('#live-filter');
  if (liveBtn) {
    const count = $('#live-count');
    const countText = count ? count.textContent : '';
    liveBtn.replaceChildren(document.createTextNode(t('filterLive') + ' '));
    const span = node('span', '', countText);
    span.id = 'live-count';
    liveBtn.append(span);
  }

  const costBtn = $('#cost-filter');
  if (costBtn) costBtn.textContent = t('filterCost');

  const reset = $('#reset');
  if (reset) reset.textContent = t('reset');

  const cats = $('#categories');
  if (cats) cats.setAttribute('aria-label', t('categoriesAria'));

  const featHeading = document.querySelector('#featured-section .section-heading h2');
  if (featHeading) {
    featHeading.replaceChildren(
      document.createTextNode(t('featuredHeading') + ' '),
      node('span', '', t('featuredSub'))
    );
  }
  const featQuiet = document.querySelector('#featured-section .section-heading .quiet');
  if (featQuiet) featQuiet.textContent = t('featuredQuiet');

  const resultsQuiet = document.querySelector('.results .section-heading .quiet');
  if (resultsQuiet) resultsQuiet.textContent = t('resultsQuiet');

  const dialogTop = document.querySelector('.dialog-top > span');
  if (dialogTop) dialogTop.textContent = t('dialogLabel');
  const closeBtn = $('#close-detail');
  if (closeBtn) {
    closeBtn.setAttribute('aria-label', t('closeDetail'));
    closeBtn.textContent = t('close');
  }

  const footerSpans = document.querySelectorAll('footer > span');
  if (footerSpans[0]) footerSpans[0].textContent = t('footerBrand');
  if (footerSpans[1]) footerSpans[1].textContent = t('footerNote');
  if (footerSpans[2]) footerSpans[2].textContent = t('footerSnapshot');

  const loading = document.querySelector('#result-grid > p');
  if (loading && !entries.length) loading.textContent = t('loading');
}

function picture(e, container) {
  const src = e.media?.thumb || e.media?.poster;
  if (!src) {
    container.append(node('span', 'text-cover', '↗'));
    return;
  }
  const img = node('img');
  img.src = url(src);
  img.alt = '';
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    img.remove();
    container.append(node('span', 'image-error', t('imageError')));
  });
  container.append(img);
}

function categories() {
  const nav = $('#categories');
  if (!nav) return;
  nav.replaceChildren();
  CAT_ORDER.forEach((key, i) => {
    const count = key === 'all' ? entries.length : entries.filter((e) => e.category === key).length;
    if (!count) return;
    const b = node('button', 'nav-item' + (active === key ? ' active' : ''));
    b.setAttribute('aria-pressed', String(active === key));
    b.append(node('span', 'nav-icon', ICONS[i]), node('span', '', catLabel(key)), node('span', 'nav-count', count));
    b.onclick = () => {
      active = key;
      limit = 12;
      categories();
      render();
    };
    nav.append(b);
  });
}

function badges(e) {
  const b = node('div', 'badges');
  b.append(node('span', '', catLabel(e.category) || e.category));
  if (e.live_url) b.append(node('span', 'badge-live', t('badgeLive')));
  if (e.cost_note) b.append(node('span', 'badge-cost', t('badgeCost')));
  return b;
}

function featured() {
  const box = $('#featured');
  if (!box) return;
  box.replaceChildren();
  FEATURED_IDS.map((id) => entries.find((e) => e.id === id))
    .filter(Boolean)
    .forEach((e, i) => {
      const b = node('button', 'feature-card');
      const m = node('div', 'feature-media');
      picture(e, m);
      m.append(node('span', 'pick-index', 'PICK / 0' + (i + 1)));
      const copy = node('div', 'feature-copy');
      copy.append(node('h3', 'feature-title', field(e.title)), node('p', 'feature-desc', field(e.description)));
      const attn = attentionLine(e);
      if (attn) copy.append(node('p', 'attention-line', attn));
      const foot = node('div', 'feature-foot');
      foot.append(node('span', '', catLabel(e.category) || t('communityCase')), node('span', 'arrow', '↗'));
      copy.append(foot);
      b.append(m, copy);
      b.onclick = () => openDetail(e);
      box.append(b);
    });
}

function render() {
  const q = ($('#search')?.value || '').trim().toLowerCase();
  const filtered = entries.filter((e) => {
    if (active !== 'all' && e.category !== active) return false;
    if (live && !e.live_url) return false;
    if (cost && !e.cost_note) return false;
    if (!q) return true;
    const hay = [field(e.title), field(e.description), e.author, catLabel(e.category)].join(' ').toLowerCase();
    return hay.includes(q);
  });

  const featuredSection = $('#featured-section');
  if (featuredSection) featuredSection.hidden = !!q || active !== 'all' || live || cost;

  const resultsTitle = $('#results-title');
  if (resultsTitle) {
    resultsTitle.replaceChildren(
      document.createTextNode(catLabel(active) + ' '),
      node('span', '', t('resultsCount', { n: filtered.length }))
    );
  }

  const reset = $('#reset');
  if (reset) reset.hidden = !q && active === 'all' && !live && !cost;

  const grid = $('#result-grid');
  grid.replaceChildren();
  filtered.slice(0, limit).forEach((e) => {
    const b = node('button', 'resource');
    const media = node('div', 'resource-media');
    picture(e, media);
    const copy = node('div', 'resource-copy');
    copy.append(node('h3', '', field(e.title)), node('p', '', field(e.description)));
    const attn = attentionLine(e);
    if (attn) copy.append(node('p', 'attention-line', attn));
    copy.append(badges(e));
    b.append(media, copy);
    b.onclick = () => openDetail(e);
    grid.append(b);
  });
  if (!filtered.length) grid.append(node('p', 'empty', t('empty')));

  const more = $('#more');
  if (more) {
    more.hidden = filtered.length <= limit;
    more.textContent = t('moreTemplate', { n: Math.max(0, filtered.length - limit) });
  }

  $('#live-filter')?.setAttribute('aria-pressed', String(live));
  $('#cost-filter')?.setAttribute('aria-pressed', String(cost));
}

function openDetail(e) {
  const body = $('#detail-body');
  body.replaceChildren();
  const m = e.media || {};
  if (m.video && url(m.video)) {
    const video = node('video');
    video.src = url(m.video);
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    if (m.thumb || m.poster) video.poster = url(m.poster || m.thumb);
    body.append(video);
  } else if (m.thumb || m.poster) {
    const div = node('div');
    picture(e, div);
    body.append(div);
  }
  body.append(
    node('h2', '', field(e.title)),
    node('div', 'detail-label', (catLabel(e.category) || e.category) + ' · ' + (e.author || t('authorFallback'))),
    node('p', '', field(e.description))
  );
  const attn = attentionLine(e);
  if (attn) body.append(node('p', 'attention-line', attn));
  if (e.cost_note) {
    body.append(node('h3', '', t('costHeading')), node('p', '', field(e.cost_note)));
  }
  body.append(node('p', 'evidence', t('evidence')));
  const links = node('div', 'detail-links');
  [
    [t('openLive'), e.live_url],
    [t('openSource'), e.source_url],
    [t('watch'), m.embed],
  ].forEach(([label, href]) => {
    if (!href || !url(href)) return;
    const a = node('a', '', label);
    a.href = url(href);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    links.append(a);
  });
  body.append(links);
  $('#detail').showModal();
}

function wireEvents() {
  $('#close-detail').onclick = () => $('#detail').close();
  $('#detail').addEventListener('close', () => {
    $('#detail').querySelectorAll('video').forEach((v) => v.pause());
  });
  $('#detail').addEventListener('click', (e) => {
    if (e.target === $('#detail')) {
      const r = e.target.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close();
    }
  });
  $('#search').oninput = () => {
    limit = 12;
    render();
  };
  $('#live-filter').onclick = () => {
    live = !live;
    limit = 12;
    render();
  };
  $('#cost-filter').onclick = () => {
    cost = !cost;
    limit = 12;
    render();
  };
  $('#reset').onclick = () => {
    active = 'all';
    live = cost = false;
    limit = 12;
    $('#search').value = '';
    categories();
    render();
  };
  $('#more').onclick = () => {
    limit += 12;
    render();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !$('#detail').open) {
      e.preventDefault();
      $('#search').focus();
    }
  });
}

async function load() {
  try {
    const response = await fetch('./entries.json');
    if (!response.ok) throw new Error(t('loadRequestFailed', { status: response.status }));
    const data = await response.json();
    if (!Array.isArray(data.entries)) throw new Error(t('loadBadFormat'));
    entries = data.entries;
    const total = $('#total');
    if (total) total.textContent = entries.length;
    const liveCount = $('#live-count');
    if (liveCount) liveCount.textContent = entries.filter((e) => e.live_url).length;
    categories();
    featured();
    render();
  } catch (error) {
    $('#result-grid').replaceChildren(node('p', 'empty', t('loadFailed', { error: error.message })));
    const featuredSection = $('#featured-section');
    if (featuredSection) featuredSection.hidden = true;
    console.error(error);
  }
}

(async function boot() {
  setLang(detectLang(), { persist: true, pushUrl: true });
  try {
    i18n = await loadI18n(lang);
  } catch (err) {
    console.error(err);
    i18n = {
      documentTitle: 'Astra Gallery',
      langToggle: lang === 'zh' ? 'EN' : '中文',
      categories: {},
      empty: 'No cases',
      loading: 'Loading…',
      loadFailed: 'Failed: {error}',
      loadRequestFailed: 'Request failed: {status}',
      loadBadFormat: 'Bad catalog',
      moreTemplate: 'More · {n}',
      imageError: 'Preview unavailable',
      resultsCount: '{n}',
      badgeLive: 'Live',
      badgeCost: 'Cost',
      communityCase: 'Case',
      openLive: 'Open',
      openSource: 'Source',
      watch: 'Watch',
      costHeading: 'Cost',
      evidence: '',
      authorFallback: 'Author',
      sigViews: 'views',
      sigLikes: 'likes',
      filterLive: 'Playable',
      filterCost: 'Cost notes',
      reset: 'Reset',
      featuredHeading: 'Featured',
      featuredSub: '',
      featuredQuiet: '',
      resultsQuiet: '',
      catalogLabel: 'items',
      footerBrand: 'Astra Gallery',
      footerNote: '',
      footerSnapshot: '',
      dialogLabel: 'Notes',
      closeDetail: 'Close',
      close: '×',
      heroTitleBefore: 'Astra Gallery',
      heroTitleAccent: '',
      lead: '',
      eyebrow: '',
      edition: '',
      github: 'GitHub',
      submit: 'Submit',
      searchPlaceholder: 'Search…',
      searchAria: 'Search',
      searchRegionAria: 'Search',
      quickOnly: '',
      categoriesAria: 'Categories',
    };
  }
  applyChrome();
  wireEvents();
  await load();
})();
