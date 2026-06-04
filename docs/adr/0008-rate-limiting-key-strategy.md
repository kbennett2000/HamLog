# 0008. Rate-limit auth endpoints by IP and HamDB lookups by authenticated user; leave trust-proxy unset

Date: 2026-06-04
Status: Accepted

## Context

Two endpoints needed throttling (SECURITY_AUDIT.md findings F3 and F8, PRs
#37–#44):

- `POST /api/auth/login` and `POST /api/auth/register` — open to any LAN
  device; no prior rate limiting; `bcrypt` cost 12 slows individual guesses but
  does not bound attempt volume.
- `POST /api/contact-info/lookup` — calls HamDB's free API on behalf of the
  logged-in user; no limit meant a single user could fan out many requests and
  abuse the third-party API (see ADR 0001 for the HamDB polite-consumer
  commitment).

`express-rate-limit` was the chosen library (lightweight, no external state
store needed at LAN scale). The decision had two non-obvious design choices:
the key used to bucket requests, and whether to enable Express's `trust proxy`
setting.

**IP as key for auth** is straightforward: the attacker at the auth endpoint is
not yet authenticated, so there is no user identity to key on. IP is the only
available signal.

**IP vs. authenticated user as key for HamDB lookups** required a choice. The
HamDB route sits behind `requireAuth` middleware, so the real user ID is
available in `req.user`. Keying by user is more precise and sidesteps the
problem of multiple LAN clients sharing a NAT address.

**`trust proxy`** is an Express setting that controls whether `X-Forwarded-For`
headers are trusted when computing the client IP. If left unset (the Express
default), `req.ip` is always the direct TCP peer address and cannot be spoofed.
If set to `true` or a hop count, Express trusts the `X-Forwarded-For` value,
which can be forged by a client that connects directly (i.e., without a
reverse proxy).

HamLog is deployed either bare (Docker `ports:` mapping, direct client TCP
connection) or behind a reverse proxy. In the bare case, enabling `trust proxy`
would allow any LAN client to set `X-Forwarded-For: 127.0.0.1` and bypass the
IP-based rate limit entirely.

## Decision

- **Auth limiter** (`/api/auth`): 10 requests per 15 minutes, keyed by `req.ip`.
- **HamDB lookup limiter** (`/api/contact-info/lookup`): 20 requests per
  minute, keyed by the authenticated user ID (`req.user.id`), with `req.ip` as
  a fallback (defensive, should not be reached in practice since the route
  requires auth).
- **`trust proxy` is left unset** (Express default). `req.ip` is always the
  direct TCP peer. This means the auth rate limiter may share a single bucket
  across all LAN clients that NAT through one address, but that is an accepted
  tradeoff given the threat model (see ADR 0007): a LAN attacker who controls
  multiple devices is outside the realistic adversary set we're designing for.
- A comment in the rate-limit middleware documents the `trust proxy`
  follow-up: operators who front the app with a reverse proxy should set
  `TRUST_PROXY=1` in `.env` (already scaffolded; not enabled by default).

## Alternatives considered

- **Key the auth limiter by user identity too.** Rejected: at the login
  endpoint, the user identity is what the attacker is trying to discover —
  keying by the claimed username would let an attacker spray attempts across
  many usernames and never hit a single bucket's limit. IP is the correct key
  for unauthenticated endpoints.

- **Enable `trust proxy` unconditionally** so that the IP reflects the real
  client when behind a reverse proxy. Rejected: in a bare Docker-publish
  deployment (the default), enabling `trust proxy` lets any client forge
  `X-Forwarded-For` and make all rate-limiting IP-keyed requests look like they
  come from a different address. Opt-in via `TRUST_PROXY` env var is the
  correct pattern; unconditional trust is unsound.

- **Use a shared Redis store for rate-limit state** to handle multi-instance
  deployments. Rejected: HamLog is a single-container, single-instance LAN
  app; in-memory state is sufficient and eliminates an operational dependency.

- **Key HamDB lookups by IP** (consistent with the auth limiter). Rejected:
  the more precise user-ID key is available here (the route requires auth) and
  avoids the NAT-collapse problem entirely. A single bucket per user is a
  fairer and harder-to-collide boundary than per-IP on a shared LAN.

## Consequences

- On a LAN where multiple devices share one IP (NAT, or all traffic routes
  through a single gateway), the auth limiter's 10-attempt/15-min budget is
  shared across all of them. A legitimate user who is locked out by another
  device's activity would need to wait. This is accepted as proportionate to
  the home-LAN threat model.
- The per-user HamDB key does not have the NAT-collapse problem, but it does
  mean a single user who opens the UI in many tabs or runs a script can hit
  their own limit without affecting other users.
- The `trust proxy` default means rate limits are IP-accurate in bare deploys
  and inaccurate (all traffic appears as the proxy's loopback address) in
  reverse-proxy deploys until `TRUST_PROXY` is set. This is documented and
  expected, not a silent bug.

## Revisit if

- An operator reports that a legitimate user was rate-limited because multiple
  family members share a NAT IP, and the 10/15-min limit is too tight. Raise
  the limit or move to a per-user-account key even for auth (keying by claimed
  username with a separate global IP failsafe).
- A reverse-proxy deploy becomes the documented default setup. At that point
  `TRUST_PROXY` should become the default-on setting and the current bare-deploy
  default should be reconsidered.
- The app is scaled to more than one Node process or container. The in-memory
  rate-limit store would need to be replaced with Redis or a shared backing
  store.
