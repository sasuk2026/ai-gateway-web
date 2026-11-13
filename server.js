const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Config ----
const PASSWORD = process.env.PASSWORD || 'sk-834298';
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const SESSIONS = new Set();

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {
      baseUrl: process.env.BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.API_KEY || ''
    };
  }
}
function saveConfig(c) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(c, null, 2));
}

function auth(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (SESSIONS.has(token)) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

// ---- Auth ----
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password === PASSWORD) {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    SESSIONS.add(token);
    return res.json({ token });
  }
  res.status(401).json({ error: 'wrong password' });
});

// ---- Config (base URL + key kept server-side, never committed) ----
app.get('/api/config', auth, (req, res) => {
  const c = loadConfig();
  res.json({ baseUrl: c.baseUrl, apiKeySet: !!c.apiKey });
});

app.post('/api/config', auth, (req, res) => {
  const { baseUrl, apiKey } = req.body || {};
  const c = loadConfig();
  if (baseUrl) c.baseUrl = baseUrl.replace(/\/+$/, '');
  if (apiKey && apiKey !== '***set***') c.apiKey = apiKey;
  saveConfig(c);
  res.json({ ok: true });
});

// ---- Live model list (auto-refresh of usable models) ----
app.get('/api/models', auth, async (req, res) => {
  const c = loadConfig();
  try {
    const r = await fetch(`${c.baseUrl}/models`, {
      headers: c.apiKey ? { Authorization: `Bearer ${c.apiKey}` } : {}
    });
    const data = await r.json();
    const models = (data.data || []).map(m => m.id).sort();
    res.json({ models, count: models.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Chat proxy (stream + non-stream) ----
app.post('/api/chat', auth, async (req, res) => {
  const c = loadConfig();
  try {
    const upstream = await fetch(`${c.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(c.apiKey ? { Authorization: `Bearer ${c.apiKey}` } : {})
      },
      body: JSON.stringify(req.body)
    });
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    const reader = upstream.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) return res.end();
      res.write(value);
      pump();
    };
    pump();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`AI gateway web listening on :${PORT}`));
