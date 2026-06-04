# 0007. Security posture is scoped to a home-LAN threat model

Date: 2026-06-04
Status: Accepted

## Context

HamLog is a personal/family QSO logger deployed via Docker Compose on a home
LAN. Open registration is intentional (any LAN device can create an account).
The frontend is a React SPA served same-origin by the same Express process on
port 8050. Auth is JWT, stored in `localStorage`, sent as an `Authorization:
Bearer` header. v1 explicitly excludes cloud or public deployment (CLAUDE.md).

A security audit (SECURITY_AUDIT.md, 2026-06-04) identified several findings.
For each finding the question was: is the textbook fix proportionate to the
realistic adversaries in a home-LAN context? The answers shaped the entire
remediation plan (PRs #37–#44).

Realistic adversaries in scope:
- A device or person on the same LAN who is not an intended user (guest, IoT,
  housemate, malware on a home PC). They can reach the app's port and the
  registration/login endpoints.
- A registered user attempting to read or modify another registered user's
  log (object-level authorization).
- Accidental internet exposure — the operator forwards port 8050 or runs it on
  a VPS. We want safe-ish degradation, not catastrophic failure.

Deliberately out of scope:
- Nation-state / targeted attackers.
- Full enterprise auth (SSO, MFA, password-complexity policies, audit logging).
- HTTPS/HSTS as a hard requirement — plain HTTP on a trusted LAN is acceptable
  for v1; operators who want TLS can front the app with a reverse proxy.
- Protecting the operator against themselves (they own the box and the data).

## Decision

Apply security fixes that are proportionate to the home-LAN threat model above.
Explicitly decline "textbook" hardening whose complexity cost exceeds its
benefit in this deployment context. The specific declined measures and their
rationales are:

**JWT stays in `localStorage`; no move to HttpOnly cookies.** Cookie auth would
introduce CSRF surface and require additional protection (SameSite policy,
CSRF tokens). The residual risk of `localStorage` is XSS exfiltrating the JWT;
the mitigation is standard React hygiene (React escapes by default — avoid
`dangerouslySetInnerHTML` on user-derived data). On a home LAN with a single
trusted origin, this tradeoff clearly favors simplicity.

**CORS defaults to same-origin, not enforced HTTPS.** The SPA is served
same-origin; the Bearer token in `localStorage` is not auto-attached by the
browser to cross-origin requests (unlike cookies), so a wildcard CORS policy
is a hygiene issue rather than an authentication bypass. The fix (drop the `||
'*'` fallback; add CORS only when `CORS_ORIGIN` is explicitly set in `.env`) is
still worth making for clarity and in case the auth mechanism ever changes. No
HTTPS enforcement is added — operators wanting TLS use a reverse proxy.

**No password-complexity policy, account lockout, or MFA.** Disproportionate
for a family logger. The proportionate control is rate limiting on the auth
endpoints (see ADR 0008).

## Alternatives considered

- **Treat HamLog as a public-internet application and apply enterprise
  hardening.** Enforce HTTPS/HSTS, move to HttpOnly-cookie auth with CSRF
  protection, add password complexity, lockout, and MFA. Rejected: this
  doubles the complexity of the auth layer for an application that explicitly
  excludes public deployment. The measures protect against threats (automated
  credential stuffing, drive-by XSS on a shared browser, MITM on a public
  network) that are not present on a trusted home LAN. Any future public
  deployment would justify revisiting.

- **Apply no security hardening at all** on the grounds that it's a hobby
  app. Rejected: several findings (hardcoded DB credentials, container running
  as root, no rate limiting) are cheap to fix and meaningfully reduce impact
  if the app is accidentally internet-exposed or a LAN-local attacker is
  present. The threat model justifies minimal hardening, not zero hardening.

## Consequences

- The codebase stays simple; no CSRF middleware, no cookie management, no
  session store, no MFA library.
- Any future operator who ports this to a public server will need to revisit
  auth (HttpOnly cookies + CSRF, or OAuth/OIDC), add HTTPS enforcement, and
  reconsider password policy. Those decisions cannot be bolted on silently;
  they require deliberate changes.
- Documenting the out-of-scope decisions here means future contributors do not
  have to guess whether these were oversights or intentional choices.
- The "accidentally internet-exposed" scenario gets reasonable fail-safe
  behavior (rate limiting, no default DB passwords, non-root container, helmet
  headers) without full hardening.

## Revisit if

- v1's scope changes: any move toward cloud hosting, public registration, or
  multi-tenant operation crosses the line where this threat model no longer
  applies. At that point, HttpOnly cookies, HTTPS enforcement, and stricter
  password policy are all warranted.
- A real XSS vulnerability is found in the application (not just a theoretical
  risk). That would change the risk calculus for JWT in `localStorage`.
- The app is bundled or distributed for use outside a trusted LAN (e.g.,
  published to a Docker registry for general use). Default-safe posture
  becomes more important when the operator is not the developer.
