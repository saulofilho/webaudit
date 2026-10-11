import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { analyzeWebsite } from './server/analyzer';
import { generateAIFix } from './server/geminiFix';
import { generateExecutiveSummary } from './server/geminiSummary';
import { checkPageLinks, crawlSitemapAndPages } from './server/extendedAudits';
import { auditKeywordCannibalization } from './server/cannibalizationAudit';
import { auditContentGap } from './server/contentGapAudit';
import { auditLocalSeo } from './server/localSeoAudit';
import { auditImages } from './server/imageAudit';
import { handleJsMiner } from './server/secscan/jsMinerHandler';
import { handleNiktoScan } from './server/secscan/niktoHandler';
import { handleWafScan } from './server/secscan/wafHandler';
import { handleDastFuzz } from './server/secscan/dastHandler';
import { handleThreatIntel } from './server/secscan/threatIntelHandler';

async function startServer() {
  const app = express();
  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg =
    portArgIndex !== -1 && process.argv[portArgIndex + 1]
      ? parseInt(process.argv[portArgIndex + 1], 10)
      : null;
  const PORT = portFromArg || (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

  // Security Hardening: Disable Express fingerprinting
  app.disable('x-powered-by');

  // Global Security Headers Middleware
  app.use((_req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https: blob:; font-src 'self' https: data:; frame-ancestors 'self' https:;"
    );
    next();
  });

  // Middleware for API routes
  app.use('/api', express.json({ limit: '10mb' }));

  // In-memory or env storage for Google Search Console verification
  let googleVerificationCode = process.env.GOOGLE_SITE_VERIFICATION || '';

  // SEO & Discoverability routes: dynamic robots.txt and sitemap.xml
  app.get('/robots.txt', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.get('host') || 'localhost:3000';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'all');
    res.send(`User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${proto}://${host}/sitemap.xml
`);
  });

  app.get('/sitemap.xml', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${proto}://${host}`;
    const today = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/#vitals</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/#security</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/#accessibility</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/#seo</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/#compliance</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'all');
    res.send(xml);
  });

  // Static favicon & public assets handler
  app.get('/favicon.svg', (_req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(process.cwd(), 'public', 'favicon.svg'));
  });
  app.get('/favicon.ico', (_req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(process.cwd(), 'public', 'favicon.svg'));
  });
  app.get(['/og-image.jpg', '/og-image.jpeg'], (_req, res) => {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.sendFile(path.join(process.cwd(), 'public', 'og-image.jpg'));
  });
  app.get('/og-image.png', (_req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.sendFile(path.join(process.cwd(), 'public', 'og-image.png'));
  });
  app.use(express.static(path.join(process.cwd(), 'public')));

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/google-verification', (_req, res) => {
    res.json({ verificationCode: googleVerificationCode });
  });

  app.post('/api/google-verification', (req, res) => {
    const { verificationCode } = req.body || {};
    if (typeof verificationCode === 'string') {
      googleVerificationCode = verificationCode.trim();
    }
    res.json({ success: true, verificationCode: googleVerificationCode });
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid URL is required to run the audit.' });
      }

      const report = await analyzeWebsite(url);
      return res.json(report);
    } catch (err: any) {
      console.error('Audit error:', err);
      return res.status(500).json({
        error: err.message || 'Internal failure while analyzing the provided website.',
      });
    }
  });

  app.post('/api/check-links', async (req, res) => {
    try {
      const { url, maxLinks } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid URL is required to inspect page links.' });
      }
      const data = await checkPageLinks(url, typeof maxLinks === 'number' ? maxLinks : 35);
      return res.json(data);
    } catch (err: any) {
      console.error('Check links error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to check links for the specified website.',
      });
    }
  });

  app.post('/api/crawl-sitemap', async (req, res) => {
    try {
      const { url, maxPages } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid URL is required to crawl the sitemap.' });
      }
      const data = await crawlSitemapAndPages(url, typeof maxPages === 'number' ? maxPages : 10);
      return res.json(data);
    } catch (err: any) {
      console.error('Crawl sitemap error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to crawl sitemap and discovered pages.',
      });
    }
  });

  app.post('/api/cannibalization-audit', async (req, res) => {
    try {
      const { url, maxPages } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid URL is required to audit keyword cannibalization.' });
      }
      const data = await auditKeywordCannibalization(url, typeof maxPages === 'number' ? maxPages : 15);
      return res.json(data);
    } catch (err: any) {
      console.error('Cannibalization audit error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to audit keyword cannibalization.',
      });
    }
  });

  app.post('/api/content-gap-analysis', async (req, res) => {
    try {
      const { url, competitorUrls, primaryQuery } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid URL is required to analyze content gap.' });
      }
      const data = await auditContentGap(url, { competitorUrls, primaryQuery });
      return res.json(data);
    } catch (err: any) {
      console.error('Content gap analysis error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to analyze content gap against top competitors.',
      });
    }
  });

  app.post('/api/local-seo-check', async (req, res) => {
    try {
      const { url, report } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid URL is required to check local SEO.' });
      }
      const data = await auditLocalSeo(url, report);
      return res.json(data);
    } catch (err: any) {
      console.error('Local SEO check error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to check local SEO, NAP consistency, and Google Business Profile.',
      });
    }
  });

  app.post('/api/audit-images', async (req, res) => {
    try {
      const { url, sampleHtml, crawlAdditionalPages } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid URL is required to audit images.' });
      }
      const data = await auditImages(
        url,
        typeof sampleHtml === 'string' ? sampleHtml : undefined,
        crawlAdditionalPages !== false
      );
      return res.json(data);
    } catch (err: any) {
      console.error('Image audit error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to scan images and analyze accessibility.',
      });
    }
  });

  app.post('/api/generate-sitemap', (req, res) => {
    try {
      const { url, pages, includeImages = true } = req.body || {};
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A target URL is required to generate the sitemap.' });
      }

      let parsedOrigin = '';
      try {
        parsedOrigin = new URL(url.startsWith('http') ? url : `https://${url}`).origin;
      } catch {
        parsedOrigin = 'https://example.com';
      }

      const today = new Date().toISOString().split('T')[0];
      const items = Array.isArray(pages) && pages.length > 0 ? pages : [
        { loc: `${parsedOrigin}/`, changefreq: 'daily', priority: 1.0, lastmod: today },
        { loc: `${parsedOrigin}/#vitals`, changefreq: 'weekly', priority: 0.9, lastmod: today },
        { loc: `${parsedOrigin}/#security`, changefreq: 'weekly', priority: 0.9, lastmod: today },
        { loc: `${parsedOrigin}/#accessibility`, changefreq: 'weekly', priority: 0.9, lastmod: today },
        { loc: `${parsedOrigin}/#seo`, changefreq: 'weekly', priority: 0.9, lastmod: today },
        { loc: `${parsedOrigin}/#compliance`, changefreq: 'weekly', priority: 0.8, lastmod: today },
      ];

      const hasImages = includeImages && items.some((it: any) => Array.isArray(it.images) && it.images.length > 0);

      const xmlParts: string[] = [];
      xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
      if (hasImages) {
        xmlParts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');
      } else {
        xmlParts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      }

      for (const item of items) {
        xmlParts.push('  <url>');
        xmlParts.push(`    <loc>${item.loc}</loc>`);
        if (item.lastmod) xmlParts.push(`    <lastmod>${item.lastmod}</lastmod>`);
        if (item.changefreq) xmlParts.push(`    <changefreq>${item.changefreq}</changefreq>`);
        if (item.priority !== undefined) xmlParts.push(`    <priority>${Number(item.priority).toFixed(1)}</priority>`);

        if (includeImages && Array.isArray(item.images)) {
          for (const img of item.images) {
            if (img && img.loc) {
              xmlParts.push('    <image:image>');
              xmlParts.push(`      <image:loc>${img.loc}</image:loc>`);
              if (img.title) xmlParts.push(`      <image:title>${img.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>`);
              xmlParts.push('    </image:image>');
            }
          }
        }

        xmlParts.push('  </url>');
      }

      xmlParts.push('</urlset>');
      const generatedXml = xmlParts.join('\n');
      const robotsTxtSnippet = `User-agent: *\nAllow: /\n\nSitemap: ${parsedOrigin}/sitemap.xml\n`;

      return res.json({
        success: true,
        xml: generatedXml,
        urlCount: items.length,
        sizeBytes: Buffer.byteLength(generatedXml, 'utf-8'),
        sitemapUrl: `${parsedOrigin}/sitemap.xml`,
        robotsTxtSnippet,
      });
    } catch (err: any) {
      console.error('Generate sitemap error:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate sitemap XML.' });
    }
  });

  app.post('/api/gemini/fix', async (req, res) => {
    try {
      const { item, targetUrl, techStack, customFramework, userQuestion } = req.body;
      if (!item || !item.id || !item.title) {
        return res.status(400).json({ error: 'Audited item data is required.' });
      }

      const fix = await generateAIFix(item, targetUrl, techStack, customFramework, userQuestion);
      return res.json(fix);
    } catch (err: any) {
      console.error('AI Fix error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to generate intelligent fix guide.',
      });
    }
  });

  app.post('/api/gemini/summary', async (req, res) => {
    try {
      const { report, tone } = req.body;
      if (!report || !report.targetUrl) {
        return res.status(400).json({ error: 'Complete audit report is required.' });
      }

      const summary = await generateExecutiveSummary(report, tone);
      return res.json(summary);
    } catch (err: any) {
      console.error('AI Summary error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to generate executive summary with AI.',
      });
    }
  });

  // SecScan DevSecOps & Active Pentest Suite Routes
  app.post('/api/secscan/js-miner', handleJsMiner);
  app.post('/api/secscan/nikto', handleNiktoScan);
  app.post('/api/secscan/waf', handleWafScan);
  app.post('/api/secscan/dast', handleDastFuzz);
  app.get('/api/secscan/threat-intel', handleThreatIntel);

  // Vite Middleware or Static Production Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // For social crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn, Discord, Slack)
    // intercept and return HTML with the exact absolute og:image URL matching current host
    app.use(async (req, res, next) => {
      const userAgent = req.get('user-agent') || '';
      const isSocialCrawler = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Discordbot|Slackbot|Googlebot|bingbot/i.test(userAgent);
      
      if (isSocialCrawler && !req.path.startsWith('/api') && !req.path.includes('.')) {
        try {
          const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
          const host = req.get('host') || 'localhost:3000';
          const origin = `${proto}://${host}`;
          let html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
          html = await vite.transformIndexHtml(req.originalUrl, html);
          html = html.replace(/https:\/\/[^"'\s]+\/og-image\.jpg/g, `${origin}/og-image.jpg`);
          html = html.replace(/content="\/og-image\.jpg"/g, `content="${origin}/og-image.jpg"`);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.send(html);
        } catch {
          // fallback to next()
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      try {
        const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
        const host = req.get('host') || 'localhost:3000';
        const origin = `${proto}://${host}`;
        let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        html = html.replace(/https:\/\/[^"'\s]+\/og-image\.jpg/g, `${origin}/og-image.jpg`);
        html = html.replace(/content="\/og-image\.jpg"/g, `content="${origin}/og-image.jpg"`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      } catch {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Website Analyzer server running on http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server error:', err);
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
