# Fleet Feedback Widget (fbw)

Vanilla JS voice feedback control. One self-contained file, zero dependencies, scoped CSS (`fbw-` prefix). Works in React apps and plain static HTML.

Submit path is a **generic JSON POST** (FormSubmit.co AJAX style). There is no Google Forms / `formResponse` / `entry.*` / `no-cors` code.

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
| `endpointUrl` | `""` | FormSubmit (or compatible) AJAX URL. Empty = not connected |
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

POST body is JSON with `Content-Type: application/json` and `Accept: application/json`. Success only when the HTTP response is OK **and** the JSON has `success: true` or `success: "true"`. On failure the widget shows `Couldn't send, please try again` and keeps the typed text.

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
    endpointUrl: '',
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
  data-endpoint-url=""
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

Leave `endpointUrl` empty until Ted confirms the FormSubmit alias. Never fake success.

### Inline-paste version

```html
<script>
  window.FEEDBACK_CONFIG = { endpointUrl: '', fieldMap: { message: 'message', page: 'page', screen: 'screen', browser: 'browser', time: 'time', honeypot: '_gotcha' } }
</script>
<script
  data-app="family-meals"
  data-build="REPLACE_WITH_BUILD_OR_HASH"
  data-endpoint-url=""
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
