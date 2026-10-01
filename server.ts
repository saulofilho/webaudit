import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { analyzeWebsite } from './server/analyzer';
import { generateAIFix } from './server/geminiFix';

async function startServer() {
  const app = express();
  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg =
    portArgIndex !== -1 && process.argv[portArgIndex + 1]
      ? parseInt(process.argv[portArgIndex + 1], 10)
      : null;
  const PORT = Number(process.env.PORT) || portFromArg || 3000;

  // Middleware for API routes
  app.use('/api', express.json({ limit: '10mb' }));

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Uma URL válida é obrigatória para realizar a análise.' });
      }

      const report = await analyzeWebsite(url);
      return res.json(report);
    } catch (err: any) {
      console.error('Audit error:', err);
      return res.status(500).json({
        error: err.message || 'Falha interna ao analisar o website fornecido.',
      });
    }
  });

  app.post('/api/gemini/fix', async (req, res) => {
    try {
      const { item, targetUrl, techStack, customFramework, userQuestion } = req.body;
      if (!item || !item.id || !item.title) {
        return res.status(400).json({ error: 'Os dados do item auditado são obrigatórios.' });
      }

      const fix = await generateAIFix(item, targetUrl, techStack, customFramework, userQuestion);
      return res.json(fix);
    } catch (err: any) {
      console.error('AI Fix error:', err);
      return res.status(500).json({
        error: err.message || 'Falha ao gerar o guia de correção inteligente.',
      });
    }
  });

  // Vite Middleware or Static Production Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
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
