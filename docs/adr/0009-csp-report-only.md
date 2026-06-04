# 0009. Content-Security-Policy shipped in report-only mode pending SPA verification

Date: 2026-06-04
Status: Accepted

## Context

SECURITY_AUDIT.md finding F5 (PRs #37–#44) called for adding `helmet` to
provide standard protective headers. Most of `helmet`'s defaults are safe to
enforce immediately: `X-Content-Type-Options: nosniff`, `X-Frame-Options:
SAMEORIGIN`, `Referrer-Policy`, and the rest set static response headers that
do not interact with the SPA's runtime behavior.

Content-Security-Policy (CSP) is different. The correct value depends on what
resources the SPA loads at runtime, and two aspects of HamLog's frontend make
a strict enforcing CSP non-trivial:

1. **Create React App inlines its webpack runtime as an inline `<script>` tag.**
   A strict `script-src 'self'` policy without `'unsafe-inline'` or a nonce
   blocks this script and breaks the SPA completely. CRA provides no
   build-time mechanism to inject a nonce.

2. **The QSO map (Leaflet + react-leaflet) loads tiles from
   `*.tile.openstreetmap.org`** and uses `data:` URIs for marker icons. It also
   relies on inline styles (Leaflet sets positioning and dimensions via
   `element.style`). These require `img-src *.tile.openstreetmap.org data:` and
   `style-src 'unsafe-inline'` respectively.

During the remediation sprint, the development environment did not include a
browser-accessible instance of the map, so the CSP directive set could not be
verified end-to-end. Shipping an untested enforcing CSP risked silently breaking
the map — an already-shipping feature — with no immediate way to confirm.

`helmet` supports `reportOnly: true`, which delivers the CSP as
`Content-Security-Policy-Report-Only` rather than `Content-Security-Policy`.
The browser reports violations to the console (or a `report-uri` endpoint if
configured) but does not block anything. This provides zero active protection
but also zero regression risk.

## Decision

Ship `helmet` with all headers enforcing except CSP, which is set to
`reportOnly: true` with directives tuned for the known requirements:

```
default-src 'self'
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
img-src 'self' *.tile.openstreetmap.org data:
connect-src 'self'
font-src 'self'
object-src 'none'
frame-ancestors 'none'
```

The other `helmet` headers (nosniff, X-Frame-Options, referrer policy, etc.)
are enforced immediately since they require no SPA-specific tuning.

The follow-up task — verify the directives in a real browser against the live
map, then flip `reportOnly` to `false` — is explicitly documented in the
middleware source and tracked as a known pending item.

## Alternatives considered

- **Ship an enforcing CSP immediately without browser verification.** The
  directives above are reasonable educated guesses based on reading the Leaflet
  and CRA source. Rejected: CRA's inline script behavior and Leaflet's exact
  resource origins are internal implementation details that can shift across
  minor versions. An unverified enforcing CSP that breaks the map is worse than
  a report-only CSP that provides no active protection — the map is a
  user-visible feature, and the protective value of CSP on a home-LAN app
  against the realistic threat model (ADR 0007) is modest.

- **Disable CSP entirely** (omit the header). This is what `helmet`'s CSP
  middleware does if you exclude the `contentSecurityPolicy` option. Rejected:
  report-only mode at least validates that the directives are correct before
  enforcement. It also signals intent — the policy is in place and will be
  enforced once verified, rather than being indefinitely deferred.

- **Replace CRA with a build tool that supports CSP nonces** (Vite, Next.js).
  A nonce-based CSP eliminates the need for `'unsafe-inline'` in `script-src`
  and is the proper long-term solution. Rejected as out of scope for the
  security sprint; migrating off CRA is a separate track already noted in
  SECURITY_AUDIT.md (F4 commentary).

## Consequences

- All `helmet` headers other than CSP are active. Clickjacking, MIME sniffing,
  and referrer leakage are mitigated.
- The `Content-Security-Policy-Report-Only` header is present in every response
  and its directives are visible in browser devtools. A developer opening the
  app in a browser can verify compliance immediately by checking the console for
  violations.
- Until the CSP is flipped to enforcing, it provides no active protection
  against XSS. Given the LAN threat model and React's default output escaping,
  this residual risk is accepted (see ADR 0007).
- `'unsafe-inline'` in `style-src` is unavoidable with Leaflet until Leaflet
  moves to CSS variables or a different positioning strategy. Even after
  enforcement, this directive remains in effect for styles.

## Revisit if

- A developer verifies the map and other SPA features in a real browser and
  sees no CSP violations in the console. At that point flip `reportOnly: false`
  in `backend/src/app.ts` — this is the intended follow-up.
- CRA is replaced with a build tool that supports nonces (Vite, etc.). At that
  point `'unsafe-inline'` in `script-src` can be removed and the CSP tightened
  meaningfully.
- A CSP violation is reported that reveals a resource the current directives
  missed. Update the directive set before enforcing.
