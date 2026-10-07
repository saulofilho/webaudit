import { Request, Response } from 'express';

const MOCK_FEEDS = [
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

export async function handleThreatIntel(req: Request, res: Response) {
  try {
    const { query } = req.query;

    let items = MOCK_FEEDS;
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
      updatedAt: new Date().toISOString(),
      feeds: items
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha ao buscar feeds de Threat Intel.' });
  }
}
