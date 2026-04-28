import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Client } from '@notionhq/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health Check - Moving to top
  app.get('/api/health', (req, res) => {
    console.log('Health check requested');
    res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
  });

  // API Routes (ALWAYS BEFORE VITE)
  app.post('/api/notion/validate', async (req, res) => {
    console.log('Validating Notion connection...');
    const { token, databaseId } = req.body;
    if (!token || !databaseId) {
      return res.status(400).json({ error: 'Missing token or databaseId' });
    }
    try {
      const notion = new Client({ auth: token });
      const response = await notion.databases.retrieve({ database_id: databaseId }) as any;
      res.json({ success: true, title: response.title[0]?.plain_text || 'Untitled' });
    } catch (error: any) {
      console.error('Notion Validate Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/notion/add', async (req, res) => {
    const { token, databaseId, properties } = req.body;
    if (!token || !databaseId || !properties) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const notion = new Client({ auth: token });
      const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: properties,
      });
      res.json(response);
    } catch (error: any) {
      console.error('Notion Add Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/notion/recent', async (req, res) => {
    const { token, databaseId, limit = 10 } = req.body;
    if (!token || !databaseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const notion = new Client({ auth: token });
      const response = await (notion.databases as any).query({
        database_id: databaseId,
        page_size: limit,
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'descending',
          },
        ],
      });
      res.json(response.results);
    } catch (error: any) {
      console.error('Notion Query Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
