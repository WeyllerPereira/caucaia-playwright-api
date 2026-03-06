'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

// --- Config ---
const PORT = process.env.PORT || 3000;

// Segurança simples: um token compartilhado entre n8n e API
// Defina no EasyPanel/Hostinger como env var: API_TOKEN=seu_token
const API_TOKEN = process.env.API_TOKEN || '';

// Permite receber JSON grande (caso você envie bastante coisa do n8n)
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// --- Middleware de auth ---
function requireToken(req, res, next) {
  // Aceita: Authorization: Bearer <token>  OU  x-api-key: <token>
  const auth = String(req.headers.authorization || '');
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const xKey = String(req.headers['x-api-key'] || '').trim();

  const token = bearer || xKey;

  if (!API_TOKEN) {
    return res.status(500).json({
      ok: false,
      error: 'API_TOKEN not configured on server',
    });
  }

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  next();
}

// --- Healthcheck ---
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'caucaia-playwright-api', ts: new Date().toISOString() });
});

// --- Rota principal (stub) ---
// Aqui por enquanto só valida o payload e devolve um retorno padrão.
// Depois a gente pluga o Playwright de verdade sem quebrar o n8n.
app.post('/crm/pedido', requireToken, async (req, res) => {
  const body = req.body || {};

  const pedido_id = String(body.pedido_id || '').trim();
  const telefone = String(body.telefone || '').trim();

  // Itens pode vir como array ou string JSON
  let itens = body.itens;

  if (typeof itens === 'string') {
    try { itens = JSON.parse(itens); } catch (e) { /* ignore */ }
  }

  const itensOk = Array.isArray(itens) && itens.length > 0;

  if (!pedido_id) {
    return res.status(400).json({ ok: false, error: 'pedido_id é obrigatório' });
  }
  if (!telefone) {
    return res.status(400).json({ ok: false, error: 'telefone é obrigatório' });
  }
  if (!itensOk) {
    return res.status(400).json({ ok: false, error: 'itens (array) é obrigatório e não pode ser vazio' });
  }

  // Retorno padrão (até o Playwright estar conectado)
  // A ideia é o n8n já conseguir:
  // - marcar enviado_playwright=sim
  // - salvar retorno_playwright (este objeto)
  // - salvar data_execucao_playwright
  return res.json({
    ok: true,
    pedido_id,
    status: 'stub_ok',
    mensagem: 'API recebeu o pedido. Playwright será conectado na próxima etapa.',
    echo: {
      telefone,
      itens_count: itens.length,
    },
    ts: new Date().toISOString(),
  });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
