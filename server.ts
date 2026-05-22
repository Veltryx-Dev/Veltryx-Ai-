import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import https from 'https';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

const CFG = {
  base_url: 'https://cytoai.jemph.workers.dev',
  api_key: process.env.CYTO_API_KEY || 'cyto-sk-f56c3fc28aee41eb97762480',
  model: 'cyto-2.4',
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

  // Increase payload limit for large base64 images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API route to proxy the chat completion
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, stream = true } = req.body;

      const payload = {
        model: CFG.model,
        messages,
        stream,
      };

      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CFG.api_key}`,
          'Content-Type': 'application/json',
        },
      };

      const fetchRes = await fetch(`${CFG.base_url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CFG.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!fetchRes.ok) {
        throw new Error(`API error: ${fetchRes.statusText}`);
      }

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Forward the stream
        const reader = fetchRes.body?.getReader();
        if (!reader) {
          throw new Error('No body in response');
        }

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // value is Uint8Array
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
        res.end();
      } else {
        const data = await fetchRes.json();
        res.json(data);
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      res.status(500).json({ error: 'Failed to process chat request.' });
    }
  });

  // API route to parse documents
  app.post('/api/parse-document', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { mimetype, buffer, originalname } = req.file;
      let text = '';

      if (mimetype === 'application/pdf') {
        const data = await pdfParse(buffer);
        text = data.text;
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (mimetype.startsWith('text/') || mimetype === 'application/json' || originalname.endsWith('.csv')) {
        text = buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported document type for parsing' });
      }

      res.json({ text });
    } catch (error) {
      console.error('Error parsing document:', error);
      res.status(500).json({ error: 'Failed to parse document.' });
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
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
