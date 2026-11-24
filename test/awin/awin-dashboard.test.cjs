/* Dashboard Awin modules (src/lib/awinClick.ts, src/lib/verifiedAwinConversion.ts).
 * Run: bash test/awin/run.sh   A minimal DOM stand-in
 * records what the conversion code does instead of loading anything from Awin. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Transpiled by run.sh (no test framework or new dependency needed).
const OUT = process.env.AWIN_TEST_OUT || path.join(__dirname, 'out', 'lib');
// Inlined at build time in the app; read at module load here.
process.env.NEXT_PUBLIC_AWIN_ADVERTISER_ID = '131907';
const click = require(path.join(OUT, 'awinClick.js'));

const nowS = Math.floor(Date.now() / 1000);
const awc = (agoS, hash = 'a430d81e22c9e8687f423efcf024fbaa') => `131907_${nowS - agoS}_${hash}`;

describe('awinClick (middleware + server actions)', () => {
  test('click id shape', () => {
    assert.equal(click.normalizeAwc(awc(5)), awc(5));
    for (const bad of ['', 'x', '131907_1_abc', 'a_b_c', `131907_${nowS}_<x>`, null, 5, `131907_${nowS}_${'a'.repeat(200)}`]) {
      assert.equal(click.normalizeAwc(bad), null, String(bad));
    }
  });
  test("another programme's click id is refused (NEXT_PUBLIC_AWIN_ADVERTISER_ID)", () => {
    assert.equal(click.AWIN_ADVERTISER_ID, 131907);
    assert.equal(click.normalizeAwc(`1001_${nowS}_a430d81e22c9e8687f`), null);
    assert.equal(click.normalizeAwc(`1319070_${nowS}_a430d81e22c9e8687f`), null);
    assert.equal(click.normalizeAwc(awc(5)), awc(5));
    assert.equal(click.buildClickForward({ awc: `1001_${nowS}_a430d81e22c9e8687f` }), null);
  });
  test('consent tri-state and sn', () => {
    assert.equal(click.parseConsent('granted'), true);
    assert.equal(click.parseConsent('denied'), false);
    assert.equal(click.parseConsent(undefined), null);
    assert.equal(click.parseConsent('whatever'), null);
    assert.equal(click.isStrictlyNecessary('1'), true);
    assert.equal(click.isStrictlyNecessary(''), false);
    assert.equal(click.isStrictlyNecessary('0'), false);
    assert.equal(click.isStrictlyNecessary(null), false);
  });
  test('cookie lifetime counts from the click; expired = null; future time = from now', () => {
    assert.equal(click.AWIN_COOKIE_DAYS, 30);
    const fresh = click.clickMaxAgeSeconds(awc(100));
    assert.ok(fresh > 30 * 86400 - 110 && fresh <= 30 * 86400 - 100);
    assert.equal(click.clickMaxAgeSeconds(awc(31 * 86400)), null);
    const future = click.clickMaxAgeSeconds(`131907_${nowS + 99999}_abcdef`);
    assert.ok(future >= 30 * 86400 - 2);
  });
  test('cookie domain only for the shared registrable domains', () => {
    assert.equal(click.cookieDomainFor('app.stafftimetracker.org'), 'stafftimetracker.org');
    assert.equal(click.cookieDomainFor('stafftimetracker.org:443'), 'stafftimetracker.org');
    assert.equal(click.cookieDomainFor('dashboard.stafftimetrack.com'), 'stafftimetrack.com');
    assert.equal(click.cookieDomainFor('evilstafftimetracker.org'), undefined);
    assert.equal(click.cookieDomainFor('stafftimetracker.org.evil.com'), undefined);
    assert.equal(click.cookieDomainFor('localhost:3000'), undefined);
    assert.equal(click.cookieDomainFor(null), undefined);
  });
  test('forward body: consent honoured, denial forwarded alone, garbage dropped', () => {
    assert.deepEqual(click.buildClickForward({ awc: awc(1) }), { awc: awc(1) });
    assert.deepEqual(click.buildClickForward({ awc: awc(1), consent: 'granted' }), { awc: awc(1), consent: 'granted' });
    assert.deepEqual(click.buildClickForward({ awc: awc(1), consent: 'denied' }), { consent: 'denied' });
    assert.deepEqual(click.buildClickForward({ awcSn: awc(1), consent: 'denied' }), { awc_sn: awc(1), consent: 'denied' });
    assert.equal(click.buildClickForward({ awc: 'junk' }), null);
    assert.equal(click.buildClickForward({}), null);
  });
});

// ── minimal browser stand-in ─────────────────────────────────────────────────
function installDom({ path: p = '/billing/subscription-verified', search = '', hash = '', cookie = '', referrer = '', script = 'load', scriptDelay = 5, pixel = 'load' } = {}) {
  const store = new Map();
  const appended = [];
  const images = [];
  global.window = {
    location: { pathname: p, search, hash },
    sessionStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  };
  global.document = {
    cookie,
    referrer,
    createElement: () => ({}),
    body: {
      appendChild: (el) => {
        appended.push({ src: el.src, saleAtInsert: JSON.parse(JSON.stringify(global.window.AWIN?.Tracking ?? null)) });
        setTimeout(() => (script === 'load' ? el.onload?.() : script === 'error' ? el.onerror?.() : null), scriptDelay);
      },
    },
  };
  global.Image = class {
    constructor() { images.push(this); }
    set src(v) { this._src = v; setTimeout(() => (pixel === 'load' ? this.onload?.() : pixel === 'error' ? this.onerror?.() : null), 5); }
    get src() { return this._src; }
  };
  return { store, appended, images };
}

const loadSender = () => {
  delete require.cache[require.resolve(path.join(OUT, 'verifiedAwinConversion.js'))];
  return require(path.join(OUT, 'verifiedAwinConversion.js'));
};

const payload = {
  advertiser_id: 131907,
  order_ref: 'STT-0123456789ABCDEF0123456789ABCDEF',
  amount: '25.99',
  currency: 'USD',
  commission_group: 'DEFAULT',
  customer_acquisition: 'NEW',
  voucher: 'SAVE20',
  channel: 'aw',
  test: false,
};
const envelope = (data) => ({ success: true, data: { activated: true, awin_conversion: data } });

describe('verifiedAwinConversion (conversion page)', () => {
  beforeEach(() => { delete global.window; delete global.document; delete global.Image; });

  test('payload validation copies only exact shapes', () => {
    installDom();
    const s = loadSender();
    assert.deepEqual(s.readAwinConversion({ ...payload, extra: 'x' }), payload);
    for (const bad of [
      { ...payload, order_ref: 'in_1QStripeId' },
      { ...payload, amount: '25.9' },
      { ...payload, amount: '0.00' },
      { ...payload, amount: '1e3' },
      { ...payload, currency: 'usd' },
      { ...payload, commission_group: 'default' },
      { ...payload, customer_acquisition: 'new' },
      { ...payload, channel: 'AW<' },
      { ...payload, test: 'false' },
      { ...payload, advertiser_id: '131907' },
      null,
    ]) assert.equal(s.readAwinConversion(bad), null, JSON.stringify(bad)?.slice(0, 60));
    assert.equal(s.verifiedAwinConversion({ success: true, data: { activated: false, awin_conversion: payload } }), null);
    assert.deepEqual(s.verifiedAwinConversion(envelope(payload)), payload);
  });

  test('hand-off: stored once, expires, skipped when already handled', () => {
    const { store } = installDom();
    const s = loadSender();
    assert.equal(s.storeVerifiedAwinTransition(envelope(payload)), true);
    assert.deepEqual(s.readVerifiedAwinTransition(), payload);
    const raw = JSON.parse(store.get('stt:awin-transition:v1'));
    store.set('stt:awin-transition:v1', JSON.stringify({ ...raw, createdAt: Date.now() - 121_000 }));
    assert.equal(s.readVerifiedAwinTransition(), null, 'older than 2 minutes');
    assert.equal(store.has('stt:awin-transition:v1'), false, 'and cleared');
    store.set('stt:awin-conversion:' + payload.order_ref, 'handled');
    assert.equal(s.storeVerifiedAwinTransition(envelope(payload)), false);
  });

  test('fires Sale BEFORE the MasterTag, plus the pixel, once per orderRef', async () => {
    const { appended, images, store } = installDom({ cookie: 'a=1; stt_marketing_consent=granted' });
    const s = loadSender();
    const [first, second] = await Promise.all([s.sendVerifiedAwinConversion(payload), s.sendVerifiedAwinConversion(payload)]);
    assert.equal(first, true);
    assert.equal(second, true);
    assert.equal(appended.length, 1, 'one MasterTag even with two concurrent calls');
    assert.equal(appended[0].src, 'https://www.dwin1.com/131907.js');
    assert.deepEqual(appended[0].saleAtInsert, {
      AdvertiserConsent: true,
      Sale: {
        amount: '25.99', channel: 'aw', orderRef: payload.order_ref, parts: 'DEFAULT:25.99',
        currency: 'USD', voucher: 'SAVE20', test: '0', customerAcquisition: 'NEW',
      },
    });
    assert.equal(images.length, 1);
    const url = new URL(images[0].src);
    assert.equal(url.origin + url.pathname, 'https://www.awin1.com/sread.img');
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      tt: 'ns', tv: '2', merchant: '131907', amount: '25.99', ch: 'aw', parts: 'DEFAULT:25.99',
      ref: payload.order_ref, cr: 'USD', vc: 'SAVE20', testmode: '0', customeracquisition: 'NEW', cons: '1',
    });
    assert.equal(store.get('stt:awin-conversion:' + payload.order_ref), 'handled');
    assert.equal(await s.sendVerifiedAwinConversion(payload), true);
    assert.equal(appended.length, 1, 'a handled orderRef never fires again');
  });

  test('unknown consent sends no consent signal; test mode is flagged', async () => {
    const { appended, images } = installDom();
    const s = loadSender();
    await s.sendVerifiedAwinConversion({ ...payload, test: true, voucher: '' });
    assert.equal('AdvertiserConsent' in appended[0].saleAtInsert, false);
    assert.equal(appended[0].saleAtInsert.Sale.test, '1');
    const params = new URL(images[0].src).searchParams;
    assert.equal(params.has('cons'), false);
    assert.equal(params.get('testmode'), '1');
    assert.equal(params.get('vc'), '', 'vc present even when empty');
  });

  test('denied consent is passed on as false / cons=0', async () => {
    const { appended, images } = installDom({ cookie: 'stt_marketing_consent=denied' });
    const s = loadSender();
    await s.sendVerifiedAwinConversion(payload);
    assert.equal(appended[0].saleAtInsert.AdvertiserConsent, false);
    assert.equal(new URL(images[0].src).searchParams.get('cons'), '0');
  });

  test('an existing AWIN object is extended, never replaced', async () => {
    installDom();
    global.window.AWIN = { keep: 1, Tracking: { AdvertiserConsent: true, other: 'x' } };
    const s = loadSender();
    await s.sendVerifiedAwinConversion(payload);
    assert.equal(global.window.AWIN.keep, 1);
    assert.equal(global.window.AWIN.Tracking.other, 'x');
    assert.equal(global.window.AWIN.Tracking.AdvertiserConsent, true);
  });

  test('blocked tag AND pixel: not marked handled (retriable); wrong document: nothing fires', async () => {
    const dom = installDom({ script: 'error', pixel: 'error' });
    const s = loadSender();
    assert.equal(await s.sendVerifiedAwinConversion(payload), false);
    assert.equal(dom.store.has('stt:awin-conversion:' + payload.order_ref), false);

    for (const where of [
      { search: '?session_id=cs_1' },
      { hash: '#x' },
      { path: '/billing/success' },
      { referrer: 'https://app.stafftimetracker.org/billing/success?subscription_id=sub_123' },
    ]) {
      const d = installDom(where);
      const t = loadSender();
      assert.equal(await t.sendVerifiedAwinConversion(payload), false, JSON.stringify(where));
      assert.equal(d.appended.length + d.images.length, 0);
    }
  });
});

describe('verifiedAwinConversion timing', () => {
  test('a MasterTag that loads late (3 s) still counts: its load deadline stops at onload', async () => {
    const { store } = installDom({ script: 'load', scriptDelay: 3000, pixel: 'error' });
    const s = loadSender();
    const started = Date.now();
    assert.equal(await s.sendVerifiedAwinConversion(payload), true);
    assert.ok(Date.now() - started >= 4000, 'waited the grace period after a 3 s load');
    assert.equal(store.get('stt:awin-conversion:' + payload.order_ref), 'handled');
  });
});

describe('capture switch', () => {
  const load = (env) => {
    const file = path.join(OUT, 'awinClick.js');
    const saved = { e: process.env.NEXT_PUBLIC_AWIN_ENABLED, a: process.env.NEXT_PUBLIC_AWIN_ADVERTISER_ID };
    delete require.cache[require.resolve(file)];
    process.env.NEXT_PUBLIC_AWIN_ENABLED = env.enabled ?? '';
    process.env.NEXT_PUBLIC_AWIN_ADVERTISER_ID = env.mid ?? '';
    try { return require(file); } finally {
      process.env.NEXT_PUBLIC_AWIN_ENABLED = saved.e ?? '';
      process.env.NEXT_PUBLIC_AWIN_ADVERTISER_ID = saved.a ?? '';
      delete require.cache[require.resolve(file)];
    }
  };
  test('capture needs BOTH the flag and the advertiser id (as the API does)', () => {
    assert.equal(load({ enabled: 'true', mid: '131907' }).AWIN_CAPTURE_ENABLED, true);
    assert.equal(load({ enabled: 'true' }).AWIN_CAPTURE_ENABLED, false, 'no id: any programme would pass');
    assert.equal(load({ mid: '131907' }).AWIN_CAPTURE_ENABLED, false);
    assert.equal(load({ enabled: 'true', mid: 'abc' }).AWIN_CAPTURE_ENABLED, false);
  });
});
