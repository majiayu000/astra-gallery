const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(process.env.ASTRA_APP_JS || path.join(root, 'public/app.js'), 'utf8');
const translations = Object.fromEntries(['zh', 'en'].map(code =>
  [code, JSON.parse(fs.readFileSync(path.join(root, 'public/i18n', code + '.json'), 'utf8'))]));

// Inert source-level adapters: no browser, network, real storage, or media loading.
function harness({ query = '', saved = null, navigatorLanguage = 'en', storageThrows = false } = {}) {
  const selectors = new Map();
  class Element {
    constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {}; this.dataset = {}; this.value = ''; this.disabled = false; }
    set id(value) { this._id = value; selectors.set('#' + value, this); }
    get id() { return this._id; }
    set textContent(value) { this.children = []; this.text = String(value); }
    get textContent() { return (this.text || '') + this.children.map(child => child.textContent).join(''); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.text = ''; this.children = children; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    addEventListener() {}
    querySelector(tag) { return this.querySelectorAll(tag)[0] || null; }
    querySelectorAll(tag) { return this.children.flatMap(child => [child, ...child.querySelectorAll(tag)]).filter(child => child.tagName === tag.toUpperCase()); }
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  const allSelectors = ['#lang-toggle', '#github-link', '#submit-link', '#search', '#live-filter', '#live-count', '#cost-filter', '#reset', '#categories', '#featured-section', '#featured', '#results-title', '#result-grid', '#more', '#close-detail', '#detail', '#detail-body', '#total', 'meta[name="description"]', '.edition', '.eyebrow', '.intro h1', '.intro p', '.catalog-number > span', '.search-region', '.quick > span', '#featured-section .section-heading h2', '#featured-section .section-heading .quiet', '.results .section-heading .quiet', '.dialog-top > span'];
  allSelectors.forEach(selector => selectors.set(selector, new Element(selector === '#lang-toggle' ? 'button' : 'div')));
  const reading = Object.keys(translations.en).filter(key => key.startsWith('reading')).map(key => {
    const element = new Element(); element.dataset.reading = key; return element;
  });
  const footer = [new Element(), new Element(), new Element()];
  const document = {
    documentElement: { lang: 'zh-CN' }, title: '', activeElement: { tagName: 'BODY' },
    querySelector: selector => selectors.get(selector) || null,
    querySelectorAll: selector => selector === '[data-reading]' ? reading : selector === 'footer > span' ? footer : [],
    createElement: tag => new Element(tag),
    createTextNode: text => { const node = new Element('#text'); node.textContent = text; return node; },
    addEventListener() {},
  };
  let current = new URL('https://example.test/astra-gallery/' + query);
  const location = { get href() { return current.href; }, get search() { return current.search; } };
  const writes = [], requests = [], pending = [], errors = [];
  let deferTranslations = false;
  const response = data => ({ ok: true, json: async () => data });
  const entries = [{ id: 'macos-27-simulator', category: 'coding-agent', title: { en: 'Synthetic English title', zh: '合成中文标题' }, description: { en: 'Synthetic description', zh: '合成中文说明' }, author: 'Synthetic author', source_url: 'https://example.test/source' }];
  const sandbox = {
    URL, URLSearchParams, document, location, navigator: { language: navigatorLanguage },
    localStorage: {
      getItem() { if (storageThrows) throw new Error('Synthetic unavailable storage'); return saved; },
      setItem(key, value) { if (storageThrows) throw new Error('Synthetic unavailable storage'); saved = value; },
    },
    history: { replaceState(state, title, url) { current = new URL(url); writes.push(current.href); } },
    console: { error: error => errors.push(String(error)) },
    fetch: async url => {
      requests.push(url);
      if (url === './entries.json') return response({ entries });
      const match = /^\.\/i18n\/(zh|en)\.json$/.exec(url);
      assert.ok(match, 'Unexpected request: ' + url);
      if (!deferTranslations) return response(translations[match[1]]);
      return new Promise((resolve, reject) => pending.push({ code: match[1], resolve: () => resolve(response(translations[match[1]])), reject, httpError: () => resolve({ ok: false, status: 503 }), badJson: () => resolve({ ok: true, json: async () => { throw new Error('Synthetic JSON error'); } }) }));
    },
  };
  const context = vm.createContext(sandbox);
  const ready = vm.runInContext(source, context, { timeout: 1000, filename: 'public/app.js' });
  function state() {
    return {
      url: current.href, saved, lang: document.documentElement.lang, title: document.title,
      description: selectors.get('meta[name="description"]').attributes.content,
      toggle: selectors.get('#lang-toggle').textContent,
      search: selectors.get('#search').placeholder,
      reading: reading.map(element => element.textContent),
      cards: selectors.get('#result-grid').textContent,
      featured: selectors.get('#featured').textContent,
    };
  }
  return { ready, state, requests, pending, errors, writes, selectors, context,
    defer() { deferTranslations = true; },
    click() { return selectors.get('#lang-toggle').onclick(); },
  };
}

function assertLocale(app, code, { stored = true } = {}) {
  const state = app.state(), expected = translations[code];
  assert.equal(new URL(state.url).searchParams.get('lang'), code);
  if (stored) assert.equal(state.saved, code);
  assert.equal(state.lang, code === 'zh' ? 'zh-CN' : 'en');
  assert.equal(state.title, expected.documentTitle);
  assert.equal(state.description, expected.metaDescription);
  assert.equal(state.toggle, expected.langToggle);
  assert.equal(state.search, expected.searchPlaceholder);
  assert.deepEqual(state.reading, Object.keys(translations.en).filter(key => key.startsWith('reading')).map(key => expected[key]));
  const title = code === 'en' ? 'Synthetic English title' : '合成中文标题';
  assert.ok(state.cards.includes(title));
  assert.ok(state.featured.includes(title));
}

test('initial URL, saved preference, and browser fallback select a consistent locale', async () => {
  const cases = [
    [{ query: '?lang=en&source=test#reading-notes', saved: 'zh', navigatorLanguage: 'zh-CN' }, 'en'],
    [{ query: '?lang=zh&source=test#reading-notes', saved: 'en' }, 'zh'],
    [{ saved: 'en', navigatorLanguage: 'zh-CN' }, 'en'],
    [{ saved: 'zh', navigatorLanguage: 'en' }, 'zh'],
    [{ navigatorLanguage: 'zh-CN' }, 'zh'], [{ navigatorLanguage: 'fr-FR' }, 'en'],
    [{ query: '?lang=invalid', saved: 'zh' }, 'zh'],
    [{ query: '?lang=EN-us', saved: 'zh' }, 'en'],
    [{ query: '?lang=zh-CN', saved: 'en' }, 'zh'],
    [{ query: '?lang=en', navigatorLanguage: 'zh-CN', storageThrows: true }, 'en'],
    [{ navigatorLanguage: 'zh-CN', storageThrows: true }, 'zh'],
  ];
  for (const [options, code] of cases) {
    const app = harness(options); await app.ready;
    assertLocale(app, code, { stored: !options.storageThrows });
    assert.equal(app.requests.length, 2);
    assert.equal(app.errors.length, 0);
    if (options.query?.includes('source=')) {
      assert.equal(new URL(app.state().url).searchParams.get('source'), 'test');
      assert.equal(new URL(app.state().url).hash, '#reading-notes');
    }
  }
});

test('sequential switches and reload/share URLs retain the selected locale', async () => {
  const app = harness({ query: '?lang=zh&source=test#reading-notes' }); await app.ready;
  for (const code of ['en', 'zh', 'en']) { await app.click(); assertLocale(app, code); }
  const u = new URL(app.state().url);
  assert.equal(u.searchParams.get('source'), 'test'); assert.equal(u.hash, '#reading-notes');
  const shared = harness({ query: u.search + u.hash, saved: 'zh', navigatorLanguage: 'zh-CN' });
  await shared.ready; assertLocale(shared, 'en');
  const saved = harness({ saved: app.state().saved, navigatorLanguage: 'zh-CN' });
  await saved.ready; assertLocale(saved, 'en');
});

test('a pending language request leaves the current locale intact and ignores repeat clicks', async () => {
  const app = harness({ query: '?lang=zh' }); await app.ready; app.defer();
  const before = app.state(), first = app.click();
  assert.deepEqual(app.state(), before);
  assert.equal(app.selectors.get('#lang-toggle').disabled, true);
  await app.click();
  assert.equal(app.pending.length, 1);
  app.pending[0].resolve(); await first;
  assertLocale(app, 'en'); assert.equal(app.selectors.get('#lang-toggle').disabled, false);
});

test('repeated clicks cannot leave late translations paired with another locale', async () => {
  const app = harness({ query: '?lang=zh' }); await app.ready; app.defer();
  const first = app.click(), second = app.click();
  // Unchanged code creates two requests. Resolve the latest first to expose the race.
  if (app.pending[1]) { app.pending[1].resolve(); await second; }
  app.pending[0].resolve(); await Promise.all([first, second]);
  assertLocale(app, new URL(app.state().url).searchParams.get('lang'));
});

for (const failure of ['reject', 'httpError', 'badJson']) {
  test('failed translation ' + failure + ' preserves state and permits a successful retry', async () => {
    const app = harness({ query: '?lang=zh' }); await app.ready; app.defer();
    const before = app.state(), first = app.click();
    if (failure === 'reject') app.pending[0].reject(new Error('Synthetic offline'));
    else app.pending[0][failure]();
    const error = await first.then(() => null, error => error);
    assert.deepEqual(app.state(), before); assert.equal(error, null);
    assert.equal(app.errors.length, 1);
    assert.equal(app.selectors.get('#lang-toggle').disabled, false);
    const retry = app.click(); app.pending[1].resolve(); await retry;
    assertLocale(app, 'en');
  });
}

module.exports = { harness, assertLocale };
