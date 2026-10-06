# Fleet Feedback Widget (fbw)

Vanilla JS voice feedback control. One self-contained file, zero dependencies, scoped CSS (`fbw-` prefix). Works in React apps and plain static HTML.

Submit path is a **generic JSON POST** for Formspree (`https://formspree.io/f/<id>`) or FormSubmit AJAX. There is no Google Forms / `formResponse` / `entry.*` / `no-cors` code.

## Files

| Path | Purpose |
| --- | --- |
| `src/feedback-widget.js` | Readable source |
| `dist/feedback-widget.min.js` | Minified drop-in |
| `test/test-page.html` | Local demo |
| `test/feedback-widget.test.mjs` | Node tests |

## Config keys

Set via `data-*` on the script tag and/or `window.FEEDBACK_CONFIG` (object wins over data attributes when both set).

| Key | Default | Notes |
| --- | --- | --- |
| `endpointUrl` | `""` | Formspree or FormSubmit AJAX URL. Empty = not connected |
| `fieldMap.message` | `"message"` | Feedback text field name |
| `fieldMap.page` | `"page"` | Page / route / app meta field name |
| `fieldMap.screen` | `"screen"` | Screen `WxH` field name |
| `fieldMap.browser` | `"browser"` | User-Agent field name |
| `fieldMap.time` | `"time"` | ISO timestamp field name |
| `fieldMap.honeypot` | `"_gotcha"` | Honeypot field name (FormSubmit default) |
| `app` | `""` | Site id: `fleetfit`, `fmt`, `family-meals`, `kathy`, `cameron-meals` |
| `build` | `""` | Build id or JS hash string |
| `contextFn` | `""` | Global function name returning current view/step |
| `consentSelector` | `""` | CSS selector for a bottom consent/cookie bar |
| `exclude` | `""` | Comma-separated path/hash patterns; widget does not mount |

POST body is flat JSON (`message`, `page`, `screen`, `browser`, `time`, `_gotcha`) with `Content-Type: application/json` and `Accept: application/json`. Success when HTTP 2xx and JSON has Formspree `ok: true` or FormSubmit `success: true` / `"true"`. A non-empty `errors` array or non-2xx is failure: `Couldn't send, please try again`, typed text kept.

If `endpointUrl` is empty, tapping the button immediately shows only `Feedback isn't connected yet.` with an OK control. It does **not** open the compose sheet, start the mic, or request speech permission. When `endpointUrl` is set, the normal voice/type Send/Cancel flow runs.

## Drop-in snippet (copy the file into your repo)

Do **not** hotlink across sites. Copy `dist/feedback-widget.min.js` into your own tree (example: `assets/feedback-widget.min.js`), then:

```html
<script>
  window.__fbwContext = function () {
    return location.hash || location.pathname || document.title
  }
  // Optional: prefer window.FEEDBACK_CONFIG for endpoint + field names
  window.FEEDBACK_CONFIG = {
    endpointUrl: 'https://formspree.io/f/YOUR_FORM_ID',
    fieldMap: {
      message: 'message',
      page: 'page',
      screen: 'screen',
      browser: 'browser',
      time: 'time',
      honeypot: '_gotcha'
    }
  }
</script>
<script
  src="/assets/feedback-widget.min.js"
  data-app="family-meals"
  data-build="REPLACE_WITH_BUILD_OR_HASH"
  data-endpoint-url="https://formspree.io/f/YOUR_FORM_ID"
  data-field-message="message"
  data-field-page="page"
  data-field-screen="screen"
  data-field-browser="browser"
  data-field-time="time"
  data-field-honeypot="_gotcha"
  data-context-fn="__fbwContext"
  data-consent-selector="[data-consent-bar]"
  data-exclude="#/privacy,#/legal,#/terms,#/about,/privacy,/legal,/terms,/about,privacy,legal,terms,about"
></script>
```

Set the same Formspree URL on `endpointUrl` and `data-endpoint-url`. Empty endpoint shows the not-connected dialog. Never fake success.

### Inline-paste version

```html
<script>
  window.FEEDBACK_CONFIG = { endpointUrl: 'https://formspree.io/f/YOUR_FORM_ID', fieldMap: { message: 'message', page: 'page', screen: 'screen', browser: 'browser', time: 'time', honeypot: '_gotcha' } }
</script>
<script
  data-app="family-meals"
  data-build="REPLACE_WITH_BUILD_OR_HASH"
  data-endpoint-url="https://formspree.io/f/YOUR_FORM_ID"
  data-context-fn="__fbwContext"
  data-exclude="#/privacy,#/legal,#/terms,#/about,privacy,legal,terms,about"
>
  /* paste contents of feedback-widget.min.js here */
</script>
```

You can also pass the whole map as JSON: `data-field-map='{"message":"message","page":"page","screen":"screen","browser":"browser","time":"time","honeypot":"_gotcha"}'`.

## Opt-out (page level)

```html
<meta name="fbw" content="off" />
```

```html
<body data-fbw="off">
```

## SPA routes

Listens for `hashchange` and `popstate`, then unmounts or remounts so excluded static / privacy / legal routes stay clear of the control.

## Client limits (kept)

- 1000 character cap
- Hidden honeypot (filled => silent drop, no network)
- Minimum 3 seconds between open and send
- At most 5 sends per hour and 20 per day per browser (`localStorage`)
- No secrets or tokens in client code

## Build and test

```bash
node feedback-widget/scripts/minify.mjs
node feedback-widget/test/feedback-widget.test.mjs
```
