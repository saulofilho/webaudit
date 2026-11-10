import { safeFetch } from '../security/safeFetch';
import { Request, Response } from 'express';

/** Offline snapshot used only when the live CISA KEV feed is unreachable. */
const SNAPSHOT_FEEDS: ThreatFeed[] = [
  {
    cve: 'CVE-2024-3400',
    title: 'Palo Alto Networks PAN-OS Command Injection',
    vendor: 'Palo Alto Networks',
    product: 'PAN-OS',
    severity: 'CRITICAL',
    cvss: 10.0,
    dateAdded: '2024-04-12',
    dueAction: 'Atualizar para versão hotfix ou habilitar Threat Prevention Signature.',
    knownRansomwareUse: 'Known',
    source: 'CISA KEV Catalog'
  },
  {
    cve: 'CVE-2023-46805',
    title: 'Ivanti Connect Secure Authentication Bypass',
    vendor: 'Ivanti',
    product: 'Connect Secure (ICS)',
    severity: 'CRITICAL',
    cvss: 9.8,
    dateAdded: '2024-01-10',
    dueAction: 'Aplicar mitigation XML e atualizar patches de segurança.',
    knownRansomwareUse: 'Known',
    source: 'CISA KEV Catalog'
  },
  {
    cve: 'CVE-2023-38606',
    title: 'WebKit Remote Code Execution / Memory Corruption',
    vendor: 'Apple',
    product: 'WebKit / Safari iOS & macOS',
    severity: 'HIGH',
    cvss: 8.8,
    dateAdded: '2023-09-21',
    dueAction: 'Atualizar Safari e iOS/macOS para versões suportadas.',
    knownRansomwareUse: 'Unknown',
    source: 'CISA KEV Catalog'
  },
  {
    cve: 'CVE-2023-4863',
    title: 'libwebp Heap Buffer Overflow in WebP Codec',
    vendor: 'Google / WebP Open Source',
    product: 'libwebp (Chromium, Firefox, Electron)',
    severity: 'CRITICAL',
    cvss: 9.6,
    dateAdded: '2023-09-13',
    dueAction: 'Atualizar todas as dependências que processam imagens WebP em navegadores e servidores.',
    knownRansomwareUse: 'Known',
    source: 'CISA KEV Catalog'
  },
  {
    cve: 'CVE-2021-44228',
    title: 'Apache Log4j2 JNDI Remote Code Execution (Log4Shell)',
    vendor: 'Apache Software Foundation',
    product: 'Log4j',
    severity: 'CRITICAL',
    cvss: 10.0,
    dateAdded: '2021-12-10',
    dueAction: 'Atualizar log4j-core para versão >= 2.17.1.',
    knownRansomwareUse: 'Known',
    source: 'CISA KEV Catalog'
  }
];

interface ThreatFeed {
  cve: string;
  title: string;
  vendor: string;
  product: string;
  /** KEV does not publish CVSS; null when unknown */
  severity: string;
  cvss: number | null;
  dateAdded: string;
  dueAction: string;
  knownRansomwareUse: string;
  source: string;
}

const KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let kevCache: { at: number; catalogDate: string; feeds: ThreatFeed[] } | null = null;

async function loadKev(): Promise<{ catalogDate: string; feeds: ThreatFeed[] }> {
  if (kevCache && Date.now() - kevCache.at < CACHE_TTL_MS) return kevCache;
  const res = await safeFetch(KEV_URL, { timeoutMs: 10000, maxBytes: 20 * 1024 * 1024, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`CISA KEV feed returned HTTP ${res.status}`);
  const data = (await res.json()) as { dateReleased?: string; vulnerabilities?: any[] };
  const feeds: ThreatFeed[] = (data.vulnerabilities || [])
    .map((v) => ({
      cve: String(v.cveID || ''),
      title: String(v.vulnerabilityName || ''),
      vendor: String(v.vendorProject || ''),
      product: String(v.product || ''),
      severity: 'KEV',
      cvss: null,
      dateAdded: String(v.dateAdded || ''),
      dueAction: String(v.requiredAction || ''),
      knownRansomwareUse: v.knownRansomwareCampaignUse === 'Known' ? 'Known' : 'Unknown',
      source: 'CISA KEV Catalog',
    }))
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  kevCache = { at: Date.now(), catalogDate: data.dateReleased || new Date().toISOString(), feeds };
  return kevCache;
}

export async function handleThreatIntel(req: Request, res: Response) {
  try {
    const { query } = req.query;

    let items: ThreatFeed[];
    let dataSource: 'live' | 'snapshot' = 'live';
    let updatedAt: string;
    try {
      const kev = await loadKev();
      items = kev.feeds;
      updatedAt = kev.catalogDate;
    } catch (err) {
      console.warn('CISA KEV feed unavailable, serving offline snapshot:', err);
      items = SNAPSHOT_FEEDS;
      dataSource = 'snapshot';
      updatedAt = '2024-04-12';
    }

    if (query && typeof query === 'string') {
      const q = query.toLowerCase();
      items = items.filter(
        i =>
          i.cve.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.vendor.toLowerCase().includes(q) ||
          i.product.toLowerCase().includes(q)
      );
    }

    return res.json({
      total: items.length,
      updatedAt,
      dataSource,
      feeds: items.slice(0, 30),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha ao buscar feeds de Threat Intel.' });
  }
}
