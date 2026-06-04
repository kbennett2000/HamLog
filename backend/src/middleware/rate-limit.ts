import rateLimit, { Options } from 'express-rate-limit';
import type { Request } from 'express';

// Tunable limits (named constants so they are easy to adjust).
export const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const AUTH_MAX = 10; // F3: ~10 auth attempts / 15 min / IP
export const LOOKUP_WINDOW_MS = 60 * 1000; // 1 minute
export const LOOKUP_MAX = 20; // F8: polite HamDB cap / minute / user

// 429 body matches the app's error shape ({ error }) from middleware/error-handler.ts.
const TOO_MANY = { error: 'Too many requests, please try again later.' };

function makeLimiter(opts: Partial<Options>) {
  return rateLimit({
    standardHeaders: true, // emit RateLimit-* headers
    legacyHeaders: false, // no legacy X-RateLimit-* headers
    message: TOO_MANY,
    // Never throttle the test suite (characterization tests hammer the auth routes).
    skip: () => process.env.NODE_ENV === 'test',
    ...opts,
  });
}

// F3 — auth endpoints. Keyed by IP (default keyGenerator). No trust proxy is set on
// the app, so on a bare single-host Docker publish LAN clients may share one IP and
// thus one bucket; that is acceptable for the LAN threat model (legit logins are rare,
// 10/15min is generous, brute force is still bounded). See the PR for the tradeoff.
export const authLimiter = makeLimiter({ windowMs: AUTH_WINDOW_MS, limit: AUTH_MAX });

// F8 — manual HamDB lookup. Keyed per authenticated user (requireAuth runs first), so
// it never collapses to a shared LAN IP and each user gets their own polite budget.
export const lookupLimiter = makeLimiter({
  windowMs: LOOKUP_WINDOW_MS,
  limit: LOOKUP_MAX,
  keyGenerator: (req: Request) => `user:${req.user?.userId ?? 'anon'}`,
});
