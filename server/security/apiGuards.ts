import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { normalizeTargetUrl, UnsafeUrlError } from './safeFetch';

/**
 * Rejects requests whose `url` / `competitorUrls` body fields point at internal
 * or otherwise disallowed targets, before any handler runs. The handlers still use
 * `safeFetch`, which re-checks every hop (redirects, crawled links) at connect time.
 */
export function validateTargetUrls(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST' || !req.body || typeof req.body !== 'object') return next();
  try {
    const body = req.body as { url?: unknown; targetUrl?: unknown; competitorUrls?: unknown };
    const { competitorUrls } = body;
    // Normalize bare domains ("example.com") so every handler receives an absolute URL
    if (typeof body.url === 'string' && body.url.trim()) body.url = normalizeTargetUrl(body.url).toString();
    if (typeof body.targetUrl === 'string' && body.targetUrl.trim()) {
      body.targetUrl = normalizeTargetUrl(body.targetUrl).toString();
    }
    if (competitorUrls !== undefined) {
      if (!Array.isArray(competitorUrls) || competitorUrls.length > 5) {
        return res.status(400).json({ error: 'competitorUrls must be an array of at most 5 URLs.' });
      }
      for (const c of competitorUrls) {
        if (typeof c !== 'string') return res.status(400).json({ error: 'competitorUrls must contain strings.' });
        if (c.trim()) normalizeTargetUrl(c);
      }
    }
    return next();
  } catch (err) {
    if (err instanceof UnsafeUrlError) {
      return res.status(400).json({ error: `Target not allowed: ${err.message}` });
    }
    return next(err);
  }
}

/** Minimal fixed-window in-memory rate limiter, keyed by client IP. */
export function rateLimit({ windowMs, max, name }: { windowMs: number; max: number; name: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;
    res.setHeader('RateLimit-Policy', `${max};w=${Math.round(windowMs / 1000)};name="${name}"`);
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }
    return next();
  };
}

function tokenMatches(provided: unknown, expected: string): boolean {
  if (typeof provided !== 'string' || !provided) return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function bearer(req: Request): string | undefined {
  const auth = req.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : undefined;
}

/**
 * Active scanners (Nikto probes, DAST payloads, WAF evasion tests) send attack-like
 * traffic to third-party hosts. They are off unless ENABLE_ACTIVE_SCANS=true, and when
 * SECSCAN_TOKEN is set the caller must send `Authorization: Bearer <token>`.
 */
export function requireActiveScanAccess(req: Request, res: Response, next: NextFunction) {
  if (process.env.ENABLE_ACTIVE_SCANS !== 'true') {
    return res.status(403).json({
      error:
        'Active security scans are disabled on this server. Set ENABLE_ACTIVE_SCANS=true and only scan hosts you own or are authorized to test.',
    });
  }
  const token = process.env.SECSCAN_TOKEN;
  if (token && !tokenMatches(bearer(req), token)) {
    return res.status(401).json({ error: 'A valid SecScan token is required for active scans.' });
  }
  return next();
}

/** Admin-only endpoints: require `Authorization: Bearer <ADMIN_TOKEN>`; disabled if unset. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return res.status(403).json({ error: 'This endpoint is disabled (ADMIN_TOKEN not configured).' });
  if (!tokenMatches(bearer(req), token)) return res.status(401).json({ error: 'Unauthorized.' });
  return next();
}

export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Maps handler errors to HTTP status: bad input → 400, target site unreachable → 502,
 * anything else → 500.
 */
export function sendError(res: Response, err: unknown, fallbackMessage: string) {
  const e = err as { name?: string; message?: string; cause?: { code?: string } } | undefined;
  const message = e?.message || fallbackMessage;
  if (e?.name === 'UnsafeUrlError' || e?.name === 'ContentGapInputError') {
    return res.status(400).json({ error: message });
  }
  const unreachable =
    /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|timeout|aborted|Could not load|Unable to fetch|Failed to load|None of the competitor pages/i;
  if (unreachable.test(message) || (e?.cause?.code && unreachable.test(e.cause.code))) {
    return res.status(502).json({ error: message });
  }
  return res.status(500).json({ error: message });
}
