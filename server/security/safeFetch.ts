/**
 * SSRF-safe outbound HTTP client.
 *
 * Every request the server makes on behalf of a user-supplied URL must go through
 * `safeFetch`. It:
 *  - only allows http/https and common web ports;
 *  - resolves DNS itself and refuses private, loopback, link-local (cloud metadata),
 *    CGNAT, multicast and other reserved addresses — checked at connect time, so a
 *    DNS-rebinding answer cannot slip a private IP in after validation;
 *  - follows redirects manually, re-validating every hop;
 *  - caps response size and total time.
 *
 * Set ALLOW_PRIVATE_TARGETS=true only for local development against intranet hosts.
 */
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import zlib from 'node:zlib';
import type { LookupFunction } from 'node:net';

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

const MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOW_PORTS = new Set([80, 443]);

function privateTargetsAllowed(): boolean {
  return process.env.ALLOW_PRIVATE_TARGETS === 'true';
}

const blockList = new net.BlockList();
// IPv4 special-purpose ranges (RFC 6890 and friends)
for (const [addr, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockList.addSubnet(addr, prefix, 'ipv4');
}
// IPv6 special-purpose ranges
for (const [addr, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['100::', 64],
  ['2001::', 23],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
] as const) {
  blockList.addSubnet(addr, prefix, 'ipv6');
}

function ipv6ToBytes(ip: string): number[] | null {
  let addr = ip.split('%')[0];
  // Embedded dotted IPv4 tail (e.g. ::ffff:1.2.3.4)
  const v4Tail = addr.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Tail) {
    const parts = v4Tail[1].split('.').map(Number);
    const hex = `${((parts[0] << 8) | parts[1]).toString(16)}:${((parts[2] << 8) | parts[3]).toString(16)}`;
    addr = addr.slice(0, -v4Tail[1].length) + hex;
  }
  const [head, tail] = addr.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail !== undefined && tail !== '' ? tail.split(':') : [];
  const missing = 8 - headParts.length - tailParts.length;
  if (addr.includes('::') ? missing < 0 : headParts.length !== 8) return null;
  const groups = [...headParts, ...Array(addr.includes('::') ? missing : 0).fill('0'), ...tailParts];
  const bytes: number[] = [];
  for (const g of groups) {
    const n = parseInt(g, 16);
    if (Number.isNaN(n)) return null;
    bytes.push((n >> 8) & 0xff, n & 0xff);
  }
  return bytes;
}

/** IPv6 forms that embed an IPv4 address the kernel may route to: mapped, compat, NAT64. */
function embeddedIpv4(ip: string): string | null {
  const b = ipv6ToBytes(ip);
  if (!b) return null;
  const v4 = b.slice(12).join('.');
  const zeros = (from: number, to: number) => b.slice(from, to).every((x) => x === 0);
  if (zeros(0, 10) && b[10] === 0xff && b[11] === 0xff) return v4; // ::ffff:a.b.c.d
  if (zeros(0, 12)) return v4; // ::a.b.c.d (deprecated compat)
  if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b && zeros(4, 12)) return v4; // 64:ff9b::/96
  return null;
}

export function isBlockedAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return blockList.check(ip, 'ipv4');
  if (family === 6) {
    const v4 = embeddedIpv4(ip);
    if (v4 && v4 !== '0.0.0.0' && blockList.check(v4, 'ipv4')) return true;
    if (v4 === '0.0.0.0') return true;
    return blockList.check(ip.split('%')[0], 'ipv6');
  }
  return true; // not an IP at all → refuse
}

/**
 * Normalizes and validates a user-supplied URL (scheme, credentials, port, literal IPs).
 * DNS-based checks happen at connect time inside `safeFetch`.
 */
export function assertSafeUrl(raw: string | URL): URL {
  let url: URL;
  try {
    url = raw instanceof URL ? raw : new URL(raw);
  } catch {
    throw new UnsafeUrlError('Invalid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only http and https URLs are allowed.');
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('URLs with embedded credentials are not allowed.');
  }
  if (url.port) {
    const port = Number(url.port);
    if (port < 1024 && !ALLOWED_LOW_PORTS.has(port)) {
      throw new UnsafeUrlError(`Port ${port} is not allowed.`);
    }
  }
  if (privateTargetsAllowed()) return url;

  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new UnsafeUrlError('Internal hostnames are not allowed.');
  }
  if (net.isIP(host) && isBlockedAddress(host)) {
    throw new UnsafeUrlError('Private or reserved IP addresses are not allowed.');
  }
  return url;
}

/** Accepts bare domains ("example.com") the way the UI does, then validates. */
export function normalizeTargetUrl(raw: string): URL {
  const trimmed = raw.trim();
  return assertSafeUrl(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
}

const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return (callback as any)(err);
    const list = addresses as dns.LookupAddress[];
    if (!privateTargetsAllowed()) {
      // Refuse if ANY record is private, so mixed answers cannot be raced.
      const bad = list.find((a) => isBlockedAddress(a.address));
      if (bad) {
        return (callback as any)(
          new UnsafeUrlError(`Host ${hostname} resolves to a private or reserved address.`)
        );
      }
    }
    if (list.length === 0) {
      return (callback as any)(new Error(`No DNS records for ${hostname}`));
    }
    if ((options as dns.LookupOptions).all) return (callback as any)(null, list);
    return (callback as any)(null, list[0].address, list[0].family);
  });
};

export interface SafeFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  redirect?: 'follow' | 'manual' | 'error';
  signal?: AbortSignal;
  /** Overall timeout in ms (default 15s), applied in addition to `signal`. */
  timeoutMs?: number;
  /** Max decompressed body bytes kept (default 5 MB); larger bodies are truncated. */
  maxBytes?: number;
}

interface RawResponse {
  status: number;
  statusText: string;
  headers: Headers;
  body: Buffer | null;
}

const NULL_BODY_STATUS = new Set([101, 103, 204, 205, 304]);

function requestOnce(url: URL, init: SafeFetchInit, signal: AbortSignal): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason ?? new Error('Aborted'));

    const mod = url.protocol === 'https:' ? https : http;
    const method = (init.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      'accept-encoding': 'gzip, deflate, br',
      ...Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v])),
    };
    if (init.body !== undefined) headers['content-length'] = String(Buffer.byteLength(init.body));

    const req = mod.request(
      url,
      {
        method,
        headers,
        lookup: guardedLookup,
        // A fresh agent per request: never reuse a socket validated for another host.
        agent: false,
      },
      (res) => {
        const status = res.statusCode || 0;
        const respHeaders = new Headers();
        for (const [k, v] of Object.entries(res.headers)) {
          if (v === undefined) continue;
          for (const item of Array.isArray(v) ? v : [v]) respHeaders.append(k, item);
        }

        if (method === 'HEAD' || NULL_BODY_STATUS.has(status) || (status >= 300 && status < 400)) {
          res.resume();
          return resolve({ status, statusText: res.statusMessage || '', headers: respHeaders, body: null });
        }

        const encoding = (res.headers['content-encoding'] || '').toLowerCase().trim();
        let stream: NodeJS.ReadableStream = res;
        if (encoding === 'gzip' || encoding === 'x-gzip') stream = res.pipe(zlib.createGunzip());
        else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (encoding === 'br') stream = res.pipe(zlib.createBrotliDecompress());

        const maxBytes = init.maxBytes ?? DEFAULT_MAX_BYTES;
        const chunks: Buffer[] = [];
        let size = 0;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve({ status, statusText: res.statusMessage || '', headers: respHeaders, body: Buffer.concat(chunks) });
        };
        stream.on('data', (chunk: Buffer) => {
          if (done) return;
          const remaining = maxBytes - size;
          if (chunk.length >= remaining) {
            chunks.push(chunk.subarray(0, remaining));
            size = maxBytes;
            finish();
            req.destroy();
            return;
          }
          chunks.push(chunk);
          size += chunk.length;
        });
        stream.on('end', finish);
        stream.on('error', (e) => {
          if (done) return;
          // Corrupt compression: keep whatever was decoded so far.
          if (chunks.length > 0) finish();
          else reject(e);
        });
      }
    );

    const onAbort = () => req.destroy(signal.reason instanceof Error ? signal.reason : new Error('Aborted'));
    signal.addEventListener('abort', onAbort, { once: true });
    req.on('close', () => signal.removeEventListener('abort', onAbort));
    req.on('error', reject);
    if (init.body !== undefined) req.write(init.body);
    req.end();
  });
}

/**
 * Drop-in replacement for `fetch` for server-side requests to user-controlled URLs.
 * Returns a standard `Response` whose `url` and `redirected` reflect the final hop.
 */
export async function safeFetch(input: string | URL, init: SafeFetchInit = {}): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(init.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const signal = init.signal ? anySignal([init.signal, timeoutSignal]) : timeoutSignal;
  const redirectMode = init.redirect ?? 'follow';

  let url = assertSafeUrl(typeof input === 'string' ? input : new URL(input.toString()));
  let method = (init.method || 'GET').toUpperCase();
  let body = init.body;
  let redirected = false;

  for (let hop = 0; ; hop++) {
    const raw = await requestOnce(url, { ...init, method, body }, signal);
    const location = raw.headers.get('location');
    const isRedirect = [301, 302, 303, 307, 308].includes(raw.status) && location;

    if (isRedirect && redirectMode === 'error') {
      throw new TypeError(`Redirect to ${location} refused (redirect: "error").`);
    }
    if (isRedirect && redirectMode === 'follow') {
      if (hop >= MAX_REDIRECTS) throw new Error(`Too many redirects (>${MAX_REDIRECTS}).`);
      url = assertSafeUrl(new URL(location!, url));
      if (raw.status === 303 || ((raw.status === 301 || raw.status === 302) && method === 'POST')) {
        method = method === 'HEAD' ? 'HEAD' : 'GET';
        body = undefined;
      }
      redirected = true;
      continue;
    }

    const status = raw.status >= 200 && raw.status <= 599 ? raw.status : 502;
    const response = new Response(NULL_BODY_STATUS.has(status) ? null : raw.body, {
      status,
      statusText: raw.statusText,
      headers: raw.headers,
    });
    Object.defineProperty(response, 'url', { value: url.toString() });
    Object.defineProperty(response, 'redirected', { value: redirected });
    return response;
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener('abort', () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}
