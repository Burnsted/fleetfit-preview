/**
 * Node tests for the voice feedback widget (no browser required for core gates).
 */
import { createRequire } from 'module'
import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const fbw = require(path.join(__dirname, '../src/feedback-widget.js'))

let passed = 0
function test(name, fn) {
  const ret = fn()
  if (ret && typeof ret.then === 'function') {
    return ret.then(() => {
      passed++
      console.log('ok -', name)
    })
  }
  passed++
  console.log('ok -', name)
}

const tests = []

function add(name, fn) {
  tests.push(() => test(name, fn))
}

// --- rate limit ---
add('rate limit: allows under hourly and daily caps', () => {
  const now = 1_700_000_000_000
  const r = fbw.canSend([], now)
  assert.equal(r.ok, true)
})

add('rate limit: blocks at 5 per hour', () => {
  const now = 1_700_000_000_000
  const log = [now - 1000, now - 2000, now - 3000, now - 4000, now - 5000]
  assert.equal(fbw.canSend(log, now).ok, false)
})

add('rate limit: blocks at 20 per day', () => {
  const now = 1_700_000_000_000
  const log = []
  for (let i = 0; i < 20; i++) log.push(now - 2 * 60 * 60 * 1000 - i * 1000)
  assert.equal(fbw.canSend(log, now).ok, false)
})

add('rate limit: prunes entries older than 24h', () => {
  const now = 1_700_000_000_000
  const r = fbw.canSend([now - 25 * 60 * 60 * 1000, now - 1000], now)
  assert.equal(r.dayCount, 1)
  assert.equal(r.ok, true)
})

// --- length / control chars ---
add('length cap: strips to 1000 chars', () => {
  assert.equal(fbw.stripControlChars('a'.repeat(1500)).length, 1000)
})

add('control characters are stripped', () => {
  const out = fbw.stripControlChars('hi\u0000there\u0007\nok')
  assert.equal(out.includes('\u0000'), false)
  assert.equal(out.includes('\u0007'), false)
  assert.equal(out.includes('\n'), true)
})

// --- JSON body / fieldMap / no PII ---
add('buildJsonBody uses fieldMap names', () => {
  const body = fbw.buildJsonBody(
    { message: 'msg', page: 'pg', screen: 'scr', browser: 'br', time: 'tm', honeypot: '_gotcha' },
    {
      message: 'hello',
      page: '/app#/shop | app=fleetfit',
      screen: '390x844',
      browser: 'TestUA',
      time: '2026-10-06T12:00:00.000Z',
      honeypot: '',
    },
  )
  assert.deepEqual(body, {
    msg: 'hello',
    pg: '/app#/shop | app=fleetfit',
    scr: '390x844',
    br: 'TestUA',
    tm: '2026-10-06T12:00:00.000Z',
    _gotcha: '',
  })
  assert.equal(fbw.bodyHasPiiKeys(body), false)
})

add('default fieldMap names are message/page/screen/browser/time/_gotcha', () => {
  assert.deepEqual(fbw.mergeFieldMap({}), {
    message: 'message',
    page: 'page',
    screen: 'screen',
    browser: 'browser',
    time: 'time',
    honeypot: '_gotcha',
  })
})

add('bodyHasPiiKeys detects banned keys', () => {
  assert.equal(fbw.bodyHasPiiKeys({ email: 'x' }), true)
  assert.equal(fbw.bodyHasPiiKeys({ name: 'x' }), true)
  assert.equal(fbw.bodyHasPiiKeys({ message: 'x', _gotcha: '' }), false)
})

add('stripQuery keeps path and hash, drops query', () => {
  assert.equal(fbw.stripQuery('https://x.test/p/q?a=1&b=2#/hash'), '/p/q#/hash')
})

add('formatPageField joins url, context, app, build', () => {
  const page = fbw.formatPageField({
    url: 'https://x.test/app?x=1#/shop',
    context: '#/shop Shop',
    app: 'fleetfit',
    build: 'abc',
    viewport: '390x700',
    tz: 'America/New_York',
  })
  assert.equal(page.includes('/app#/shop'), true)
  assert.equal(page.includes('app=fleetfit'), true)
  assert.equal(page.includes('build=abc'), true)
  assert.equal(page.includes('?x=1'), false)
})

// --- success detection (Formspree ok + FormSubmit success) ---
add('isSubmitSuccess: FormSubmit success true/"true"', () => {
  assert.equal(fbw.isSubmitSuccess(true, { success: true }), true)
  assert.equal(fbw.isSubmitSuccess(true, { success: 'true' }), true)
  assert.equal(fbw.isSubmitSuccess(true, { success: false }), false)
  assert.equal(fbw.isSubmitSuccess(false, { success: true }), false)
  assert.equal(fbw.isSubmitSuccess(true, null), false)
})

add('isSubmitSuccess: Formspree ok === true', () => {
  assert.equal(fbw.isSubmitSuccess(true, { ok: true }), true)
  assert.equal(fbw.isSubmitSuccess(true, { ok: false }), false)
  assert.equal(fbw.isSubmitSuccess(false, { ok: true }), false)
})

add('isSubmitSuccess: Formspree errors array is failure', () => {
  assert.equal(fbw.isSubmitSuccess(true, { ok: true, errors: [{ message: 'bad' }] }), false)
  assert.equal(fbw.isSubmitSuccess(true, { errors: ['x'] }), false)
  assert.equal(fbw.isSubmitSuccess(true, { ok: true, errors: [] }), true)
})

add('send: Formspree ok true records and thanks', async () => {
  const store = memStorage()
  const { w, getStatus, setText } = makeHarness({
    endpointUrl: 'https://formspree.io/f/example',
    storage: store,
    fetch: () => Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) }),
  })
  w.openSheet()
  setText('formspree path')
  await new Promise((r) => setTimeout(r, fbw.MIN_OPEN_MS + 20))
  const result = await w.send()
  assert.equal(result.ok, true)
  assert.match(getStatus(), /Thanks, sent/)
  w.destroy()
})

add('send: Formspree errors array fails and keeps text', async () => {
  const calls = []
  const { w, getStatus, getText, setText } = makeHarness({
    endpointUrl: 'https://formspree.io/f/example',
    fetch: (...a) => {
      calls.push(a)
      return Promise.resolve({
        ok: false,
        status: 422,
        json: async () => ({ errors: [{ message: 'Validation failed' }] }),
      })
    },
  })
  w.openSheet()
  setText('keep this')
  await new Promise((r) => setTimeout(r, fbw.MIN_OPEN_MS + 20))
  const result = await w.send()
  assert.equal(result.ok, false)
  assert.equal(calls.length, 1)
  const body = JSON.parse(calls[0][1].body)
  assert.deepEqual(Object.keys(body).sort(), ['_gotcha', 'browser', 'message', 'page', 'screen', 'time'])
  assert.match(getStatus(), /Couldn't send, please try again/)
  assert.equal(getText(), 'keep this')
  w.destroy()
})

// --- resolveConfig ---
add('resolveConfig: endpointUrl empty by default; FEEDBACK_CONFIG wins', () => {
  const cfg = fbw.resolveConfig({ app: 'fleetfit', build: '1' }, {})
  assert.equal(cfg.endpointUrl, '')
  const cfg2 = fbw.resolveConfig(
    { endpointUrl: '', app: 'fleetfit' },
    { FEEDBACK_CONFIG: { endpointUrl: 'https://example.invalid/form', fieldMap: { message: 'msg' } } },
  )
  assert.equal(cfg2.endpointUrl, 'https://example.invalid/form')
  assert.equal(cfg2.fieldMap.message, 'msg')
})

// --- consent lift ---
add('consent lift: 0 when no bar', () => {
  assert.equal(fbw.consentClearancePx(0), 0)
})

add('consent lift: bar height plus at least 8px', () => {
  assert.equal(fbw.consentClearancePx(48), 56)
  assert.equal(fbw.consentClearancePx(48, 4), 56)
  assert.equal(fbw.consentClearancePx(48, 12), 60)
})

add('fab page reserve clears footer under resting button', () => {
  assert.equal(fbw.fabPageReservePx(), 44 + 14 + 12)
  assert.ok(fbw.fabPageReservePx() >= 66)
})

add('character counter uses of not slash', () => {
  const src = require('fs').readFileSync(
    path.join(__dirname, '../src/feedback-widget.js'),
    'utf8',
  )
  assert.match(src, /n \+ ' of ' \+ MAX_TEXT/)
  assert.equal(src.includes("n + ' / ' + MAX_TEXT"), false)
  // No slash in user-visible counter / status / button copy constants
  const visible = [
    "Couldn't send, please try again",
    "Feedback isn't connected yet.",
    'Thanks, sent.',
    'Typing works too.',
    'Send',
    'Cancel',
    'OK',
    "Your browser's speech service turns your voice into text. Please don't include personal details.",
  ]
  for (const s of visible) {
    assert.equal(s.includes('/'), false, 'slash in visible copy: ' + s)
  }
})

add('hideWhen: fleet plan selector blocks host UI', () => {
  const doc = {
    querySelector(sel) {
      if (sel === '[data-fleet-plan]') return { tag: 'div' }
      return null
    },
  }
  assert.equal(fbw.isHostUiBlocking(doc, '[data-fleet-plan]'), true)
  assert.equal(fbw.isHostUiBlocking(doc, ''), true) // default hideWhen
  assert.equal(fbw.isHostUiBlocking({ querySelector: () => null }, '[data-fleet-plan]'), false)
  assert.equal(fbw.DEFAULT_HIDE_WHEN, '[data-fleet-plan]')
})

add('sheet CSS uses consent clearance bottom (not hard-coded 0)', () => {
  const src = require('fs').readFileSync(
    path.join(__dirname, '../src/feedback-widget.js'),
    'utf8',
  )
  assert.match(src, /\.fbw-sheet\{[^}]*bottom:var\(--fbw-consent-clearance/)
  assert.match(src, /\.fbw-backdrop\{[^}]*bottom:var\(--fbw-consent-clearance/)
  assert.match(src, /data-fbw-pad/)
  assert.equal(/[–—]/.test(src), false)
})

// --- exclude / opt-out ---
add('exclude: hash and path patterns', () => {
  const loc = { pathname: '/fleetfit-preview/', hash: '#/privacy', href: 'https://x/#/privacy' }
  assert.equal(fbw.isExcluded(['#/privacy', '#/legal'], loc), true)
  assert.equal(fbw.isExcluded(['privacy'], loc), true)
  assert.equal(fbw.isExcluded(['#/shop'], loc), false)
})

add('exclude: legal terms about', () => {
  assert.equal(fbw.isExcluded(['#/legal'], { pathname: '/', hash: '#/legal', href: '' }), true)
  assert.equal(fbw.isExcluded(['terms', 'about'], { pathname: '/', hash: '#/about', href: '' }), true)
})

add('parseExcludeList splits comma list', () => {
  assert.deepEqual(fbw.parseExcludeList(' #/privacy, #/legal ,terms '), [
    '#/privacy',
    '#/legal',
    'terms',
  ])
})

add('opt-out via meta and body', () => {
  function makeDoc({ metaOff, bodyOff }) {
    return {
      querySelector: (sel) =>
        sel === 'meta[name="fbw"]' && metaOff ? { getAttribute: () => 'off' } : null,
      body: { getAttribute: (n) => (n === 'data-fbw' && bodyOff ? 'off' : null) },
    }
  }
  assert.equal(fbw.isOptedOut(makeDoc({ metaOff: true })), true)
  assert.equal(fbw.isOptedOut(makeDoc({ bodyOff: true })), true)
  assert.equal(fbw.isOptedOut(makeDoc({})), false)
})

add('speech fallback: null ctor means typing path', () => {
  assert.equal(fbw.getSpeechRecognitionCtor({}), null)
})

add('min open ms constant is 3000', () => {
  assert.equal(fbw.MIN_OPEN_MS, 3000)
})

add('SPA exclude remount decision flips with hash', () => {
  const exclude = ['#/privacy', '#/legal', '#/terms', '#/about']
  assert.equal(fbw.isExcluded(exclude, { pathname: '/', hash: '#/shop', href: '' }), false)
  assert.equal(fbw.isExcluded(exclude, { pathname: '/', hash: '#/privacy', href: '' }), true)
})

// --- empty endpoint: immediate not-connected dialog (no compose / mic) ---
add('empty endpointUrl: fab opens not-connected only; no textarea, no speech', async () => {
  let speechStarts = 0
  function FakeSpeech() {
    speechStarts++
  }
  FakeSpeech.prototype.start = function () {}
  FakeSpeech.prototype.stop = function () {}

  const calls = []
  const { w, getStatus, getMode, hasTextarea, hasOkOnly } = makeHarness({
    endpointUrl: '',
    SpeechRecognition: FakeSpeech,
    fetch: (...a) => {
      calls.push(a)
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    },
  })
  // openSheet must redirect to not-connected when endpoint empty
  w.openSheet()
  assert.equal(getMode(), 'not-connected')
  assert.match(getStatus(), /isn['']t connected yet/)
  assert.equal(hasTextarea(), false)
  assert.equal(hasOkOnly(), true)
  assert.equal(speechStarts, 0)
  assert.equal(calls.length, 0)
  w.destroy()
})

add('empty endpointUrl: openNotConnected never starts recognition', () => {
  let speechStarts = 0
  function FakeSpeech() {
    speechStarts++
  }
  FakeSpeech.prototype.start = function () {}
  FakeSpeech.prototype.stop = function () {}
  const { w, getStatus, hasTextarea } = makeHarness({
    endpointUrl: '',
    SpeechRecognition: FakeSpeech,
  })
  w.openNotConnected()
  assert.match(getStatus(), /isn['']t connected yet/)
  assert.equal(hasTextarea(), false)
  assert.equal(speechStarts, 0)
  w.destroy()
})

// --- connected endpoint: compose sheet + send path ---
add('with endpointUrl: openSheet shows compose UI (textarea)', () => {
  const { w, getMode, hasTextarea } = makeHarness({
    endpointUrl: 'https://example.invalid/form',
    fetch: () => Promise.resolve({ ok: true, json: async () => ({ success: true }) }),
  })
  w.openSheet()
  assert.equal(getMode(), 'compose')
  assert.equal(hasTextarea(), true)
  w.destroy()
})

add('send: HTTP/JSON failure keeps text and shows retry message', async () => {
  const calls = []
  const { w, getStatus, getText, setText } = makeHarness({
    endpointUrl: 'https://example.invalid/form',
    fetch: (...a) => {
      calls.push(a)
      return Promise.resolve({ ok: true, json: async () => ({ success: false }) })
    },
  })
  w.openSheet()
  setText('keep me')
  await new Promise((r) => setTimeout(r, fbw.MIN_OPEN_MS + 20))
  const result = await w.send()
  assert.equal(result.ok, false)
  assert.equal(calls.length, 1)
  const [url, opts] = calls[0]
  assert.equal(url, 'https://example.invalid/form')
  assert.equal(opts.method, 'POST')
  assert.equal(opts.headers['Content-Type'], 'application/json')
  assert.equal(opts.headers.Accept, 'application/json')
  assert.equal(opts.mode, undefined)
  const parsed = JSON.parse(opts.body)
  assert.equal(parsed.message, 'keep me')
  assert.equal('_gotcha' in parsed, true)
  assert.match(getStatus(), /Couldn't send, please try again/)
  assert.equal(getText(), 'keep me')
  w.destroy()
})

add('send: success true records and thanks', async () => {
  const store = memStorage()
  const { w, getStatus, setText } = makeHarness({
    endpointUrl: 'https://example.invalid/form',
    storage: store,
    fetch: () => Promise.resolve({ ok: true, json: async () => ({ success: 'true' }) }),
  })
  w.openSheet()
  setText('shipped')
  await new Promise((r) => setTimeout(r, fbw.MIN_OPEN_MS + 20))
  const result = await w.send()
  assert.equal(result.ok, true)
  assert.match(getStatus(), /Thanks, sent/)
  const log = fbw.readSendLog(store)
  assert.equal(log.length, 1)
  w.destroy()
})

add('honeypot filled: silent drop, no fetch', async () => {
  const calls = []
  const { w, setText, setHoneypot } = makeHarness({
    endpointUrl: 'https://example.invalid/form',
    fetch: (...a) => {
      calls.push(a)
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    },
  })
  w.openSheet()
  setText('spam')
  setHoneypot('http://bots.example')
  await new Promise((r) => setTimeout(r, fbw.MIN_OPEN_MS + 20))
  const result = await w.send()
  assert.equal(result.reason, 'honeypot')
  assert.equal(calls.length, 0)
  w.destroy()
})

add('no Google Forms leftovers in exported API', () => {
  assert.equal(typeof fbw.buildPayload, 'undefined')
  assert.equal(typeof fbw.buildJsonBody, 'function')
  assert.equal(typeof fbw.isSubmitSuccess, 'function')
})

function memStorage() {
  const d = {}
  return {
    getItem: (k) => (k in d ? d[k] : null),
    setItem: (k, v) => {
      d[k] = String(v)
    },
  }
}

function makeHarness({ endpointUrl, fetch, storage, SpeechRecognition }) {
  const store = storage || memStorage()
  const listeners = {}
  const fakeWin = {
    location: { href: 'https://example.com/#/shop', pathname: '/', hash: '#/shop' },
    screen: { width: 390, height: 844 },
    innerWidth: 390,
    innerHeight: 700,
    navigator: { userAgent: 'Test' },
    localStorage: store,
    fetch,
    addEventListener(type, fn) {
      listeners[type] = listeners[type] || []
      listeners[type].push(fn)
    },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] || []).filter((f) => f !== fn)
    },
    setTimeout: (fn) => {
      fn()
      return 1
    },
  }

  let statusText = ''
  let taValue = ''
  let hpValue = ''
  let mode = ''
  const created = []

  const fakeDoc = {
    head: { appendChild() {} },
    body: {
      appendChild() {},
      getAttribute() {
        return null
      },
    },
    documentElement: {},
    readyState: 'complete',
    getElementById() {
      return null
    },
    querySelector(sel) {
      if (sel === 'meta[name="fbw"]') return null
      if (sel && String(sel).includes('data-fbw-root')) return null
      return null
    },
    querySelectorAll() {
      return []
    },
    createElement(tag) {
      const attrs = {}
      const el = {
        tagName: String(tag).toUpperCase(),
        style: { setProperty() {} },
        className: '',
        children: [],
        get value() {
          if (String(this.className).includes('fbw-ta')) return taValue
          if (String(this.className).includes('fbw-hp')) return hpValue
          return this._value || ''
        },
        set value(v) {
          if (String(this.className).includes('fbw-ta')) taValue = v
          else if (String(this.className).includes('fbw-hp')) hpValue = v
          else this._value = v
        },
        get textContent() {
          return String(this.className).includes('fbw-status') ? statusText : this._text || ''
        },
        set textContent(v) {
          if (String(this.className).includes('fbw-status')) statusText = v
          else this._text = v
        },
        innerHTML: '',
        parentNode: { removeChild() {} },
        setAttribute(k, v) {
          attrs[k] = String(v)
          if (k === 'data-fbw-mode') mode = String(v)
        },
        getAttribute(k) {
          return attrs[k] || null
        },
        addEventListener() {},
        appendChild(child) {
          this.children.push(child)
        },
        focus() {},
        removeChild() {},
      }
      created.push(el)
      return el
    },
    addEventListener() {},
    removeEventListener() {},
    activeElement: null,
    defaultView: fakeWin,
  }
  fakeWin.document = fakeDoc

  const w = fbw.createWidget({
    document: fakeDoc,
    window: fakeWin,
    storage: store,
    fetch,
    app: 'fleetfit',
    build: 'test',
    endpointUrl,
    fieldMap: {},
    exclude: '',
    SpeechRecognition: SpeechRecognition === undefined ? null : SpeechRecognition,
  })

  return {
    w,
    getStatus: () => statusText,
    getText: () => taValue,
    setText: (t) => {
      taValue = t
    },
    setHoneypot: (t) => {
      hpValue = t
    },
    getMode: () => mode,
    hasTextarea: () => created.some((el) => String(el.className).includes('fbw-ta')),
    hasOkOnly: () => {
      const buttons = created.filter((el) => el.tagName === 'BUTTON' && String(el.className).includes('fbw-btn'))
      // After openNotConnected: one OK send-styled button, no Cancel
      const labels = buttons.map((b) => b._text || b.textContent || '')
      return labels.includes('OK') && !labels.includes('Cancel') && !labels.includes('Send')
    },
  }
}

async function run() {
  for (const t of tests) {
    await t()
  }
  console.log('\n' + passed + ' tests passed')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
