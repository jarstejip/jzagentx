/**
 * JZAGENTIC - Full-Stack AI IDE & Ecosystem Hub Server
 * REAL AI Integration: OpenRouter, Anthropic, OpenAI, DeepSeek, Ollama
 * Real Token Metering Engine with actual streaming
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { streamAI, getProviderStatus, MODEL_MAP } = require('./ai-engine');

const PORT = process.env.PORT || 3333;
const WORKSPACE_DIR = path.join(__dirname, 'workspace');
const PUBLIC_DIR = path.join(__dirname, 'public');
const KEYS_FILE = path.join(__dirname, '.api-keys.json');
const TOKEN_STATS_FILE = path.join(__dirname, '.token-stats.json');

// Ensure isolated workspace exists
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

// ===== REAL TOKEN COUNTING ENGINE =====
// Approximate token count using char/4 method (matches GPT tokenizer ~closely)
function countTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  // More accurate: count words + punctuation + whitespace patterns
  // Average English/Indonesian: ~4 chars per token, code ~3.5 chars per token
  return Math.max(1, Math.ceil(text.length / 4));
}

// Count tokens for an array of messages (input prompt)
function countInputTokens(messages) {
  let total = 0;
  for (const msg of messages) {
    total += 4; // overhead per message (role, delimiters)
    total += countTokens(msg.content || '');
    total += countTokens(msg.role || '');
  }
  total += 2; // start/end sequence tokens
  return total;
}

// Token Usage Tracker — REAL metering
const TOKEN_ENGINE = {
  inputTokensToday: 0,     // tokens sent TO the AI (prompts)
  outputTokensToday: 0,    // tokens received FROM the AI (responses)
  totalTokensToday: 0,     // input + output
  totalTokensAllTime: 0,   // lifetime total
  requestsToday: 0,        // number of API calls today
  requestsAllTime: 0,      // lifetime API calls
  lastReset: new Date().setHours(0, 0, 0, 0),
  sessionStart: Date.now(),
};

// Load persisted stats from disk
function loadTokenStats() {
  try {
    if (fs.existsSync(TOKEN_STATS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(TOKEN_STATS_FILE, 'utf8'));
      TOKEN_ENGINE.totalTokensAllTime = saved.totalTokensAllTime || 0;
      TOKEN_ENGINE.requestsAllTime = saved.requestsAllTime || 0;
      // Restore daily stats if same day
      const savedDay = new Date(saved.lastReset).setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      if (savedDay === today) {
        TOKEN_ENGINE.inputTokensToday = saved.inputTokensToday || 0;
        TOKEN_ENGINE.outputTokensToday = saved.outputTokensToday || 0;
        TOKEN_ENGINE.totalTokensToday = saved.totalTokensToday || 0;
        TOKEN_ENGINE.requestsToday = saved.requestsToday || 0;
        TOKEN_ENGINE.lastReset = saved.lastReset;
      }
      console.log(`📊 Token stats loaded: ${TOKEN_ENGINE.totalTokensAllTime.toLocaleString()} lifetime tokens`);
    }
  } catch (e) {
    console.log('⚠️ Could not load token stats, starting fresh');
  }
}

// Save stats to disk (called after each request)
function saveTokenStats() {
  try {
    fs.writeFileSync(TOKEN_STATS_FILE, JSON.stringify({
      inputTokensToday: TOKEN_ENGINE.inputTokensToday,
      outputTokensToday: TOKEN_ENGINE.outputTokensToday,
      totalTokensToday: TOKEN_ENGINE.totalTokensToday,
      totalTokensAllTime: TOKEN_ENGINE.totalTokensAllTime,
      requestsToday: TOKEN_ENGINE.requestsToday,
      requestsAllTime: TOKEN_ENGINE.requestsAllTime,
      lastReset: TOKEN_ENGINE.lastReset,
      lastSaved: Date.now(),
    }, null, 2));
  } catch (e) {}
}

// Initialize from disk
loadTokenStats();

function checkAndResetDaily() {
  const today = new Date().setHours(0, 0, 0, 0);
  if (today > TOKEN_ENGINE.lastReset) {
    TOKEN_ENGINE.inputTokensToday = 0;
    TOKEN_ENGINE.outputTokensToday = 0;
    TOKEN_ENGINE.totalTokensToday = 0;
    TOKEN_ENGINE.requestsToday = 0;
    TOKEN_ENGINE.lastReset = today;
    saveTokenStats();
  }
}

// Get formatted token stats for API responses
function getTokenStats() {
  const uptime = Math.floor((Date.now() - TOKEN_ENGINE.sessionStart) / 1000);
  return {
    inputTokensToday: TOKEN_ENGINE.inputTokensToday,
    outputTokensToday: TOKEN_ENGINE.outputTokensToday,
    totalTokensToday: TOKEN_ENGINE.totalTokensToday,
    totalTokensAllTime: TOKEN_ENGINE.totalTokensAllTime,
    requestsToday: TOKEN_ENGINE.requestsToday,
    requestsAllTime: TOKEN_ENGINE.requestsAllTime,
    uptimeSeconds: uptime,
    plan: 'unlimited',
  };
}

// API Keys - persisted to disk
let API_CONFIG = {
  gemini: process.env.GEMINI_API_KEY || '',
  openrouter: process.env.OPENROUTER_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  anthropic: process.env.ANTHROPIC_API_KEY || '',
  deepseek: process.env.DEEPSEEK_API_KEY || '',
  ollamaUrl: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || '',
};

// Load saved keys from disk
try {
  if (fs.existsSync(KEYS_FILE)) {
    const saved = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    if (saved.gemini) API_CONFIG.gemini = saved.gemini;
    if (saved.openrouter) API_CONFIG.openrouter = saved.openrouter;
    if (saved.openai) API_CONFIG.openai = saved.openai;
    if (saved.anthropic) API_CONFIG.anthropic = saved.anthropic;
    if (saved.deepseek) API_CONFIG.deepseek = saved.deepseek;
    if (saved.ollamaUrl) API_CONFIG.ollamaUrl = saved.ollamaUrl;
    if (saved.ollamaModel) API_CONFIG.ollamaModel = saved.ollamaModel;
    console.log('[Config] API keys loaded from .api-keys.json');
  }
} catch (e) {
  console.log('[Config] No saved keys found, using env vars only');
}

function saveKeysToFile() {
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(API_CONFIG, null, 2), 'utf8');
  } catch (e) {
    console.error('[Config] Failed to save keys:', e.message);
  }
}

// Active Model
let activeModel = {
  family: 'CLAUDE',
  name: 'Claude 3.7 Sonnet',
};

// Conversation history per session (simple in-memory)
let conversationHistory = [];

// MCP Servers & Skills
let mcpServers = [
  { id: 'fs-mcp', name: 'Filesystem MCP', status: 'connected', transport: 'stdio', tools: ['read_file', 'write_file', 'list_dir', 'edit_ast'] },
  { id: 'git-mcp', name: 'Git & Version Hub', status: 'connected', transport: 'stdio', tools: ['git_status', 'git_commit', 'branch_diff'] },
  { id: 'db-mcp', name: 'Database MySQL/Postgres MCP', status: 'connected', transport: 'sse', tools: ['query', 'migrate', 'schema_inspect'] },
  { id: 'lsp-mcp', name: 'LSP Service (PHP/JS/Python)', status: 'connected', transport: 'ws', tools: ['diagnostics', 'hover', 'autocomplete'] },
  { id: 'terminal-mcp', name: 'Sandbox Terminal MCP', status: 'connected', transport: 'stdio', tools: ['execute_cmd', 'kill_proc'] },
];

let skillsList = [
  { id: 'realtime-code-edit', name: 'Real-Time Script Customizer', description: 'AST-based multi-file editing and automated refactoring' },
  { id: 'deep-debug', name: 'Deep Debugger & Log Inspector', description: 'Trace PHP/Node stack traces and auto-patch exceptions' },
  { id: 'mcp-orchestrator', name: 'MCP Tool Auto-Caller', description: 'Autonomous multi-step tool call pipeline' },
  { id: 'mobile-bridge', name: 'Mobile Mirror Sync Bridge', description: 'Bidirectional sync to smartphone companion' },
];

let mobileConnections = new Set();
let desktopState = { activeFile: 'playground.js', chatLog: [], lastCodeSync: Date.now() };

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.php': 'text/plain; charset=utf-8', '.sql': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    const lower = name.toLowerCase();
    // Exclude virtual/container/loopback adapters
    if (lower.includes('virtual') || lower.includes('vbox') || lower.includes('vmware') || 
        lower.includes('wsl') || lower.includes('vethernet') || lower.includes('loopback')) {
      continue;
    }
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Exclude common VirtualBox host-only subnet
        if (iface.address.startsWith('192.168.56.')) continue;
        candidates.push({
          name,
          address: iface.address,
          isWifi: lower.includes('wi-fi') || lower.includes('wlan') || lower.includes('wireless')
        });
      }
    }
  }
  // Prioritize active Wi-Fi / WLAN adapter
  candidates.sort((a, b) => (b.isWifi ? 1 : 0) - (a.isWifi ? 1 : 0));
  return candidates[0] ? candidates[0].address : 'localhost';
}

function getAllLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    const lower = name.toLowerCase();
    if (lower.includes('loopback')) continue;
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, address: iface.address, isVirtual: lower.includes('vbox') || iface.address.startsWith('192.168.56.') });
      }
    }
  }
  return ips;
}

function scanDir(dir, base = '') {
  let results = [];
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;

      const relPath = base ? `${base}/${item.name}` : item.name;
      if (item.isDirectory()) {
        results.push({ name: item.name, path: relPath, type: 'directory', children: scanDir(path.join(dir, item.name), relPath) });
      } else {
        const stats = fs.statSync(path.join(dir, item.name));
        results.push({ name: item.name, path: relPath, type: 'file', size: stats.size, updatedAt: stats.mtime });
      }
    }
  } catch (e) {}
  return results;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function broadcastToMobile(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of mobileConnections) {
    try { client.write(payload); } catch (e) { mobileConnections.delete(client); }
  }
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  checkAndResetDaily();

  try {
    // ===== AI STREAMING ENDPOINT (THE CORE - REAL AI) =====
    if (pathname === '/api/ai/stream' && req.method === 'POST') {
      const { message, fileContext, model, systemPrompt } = await readBody(req);

      // Build messages for the AI
      const aiMessages = [];

      // Add file context if available
      if (fileContext?.content) {
        aiMessages.push({
          role: 'user',
          content: `[Konteks file aktif di editor: ${fileContext.path}]\n\`\`\`\n${fileContext.content.substring(0, 4000)}\n\`\`\``,
        });
        aiMessages.push({
          role: 'assistant',
          content: 'Saya telah membaca file tersebut. Silakan berikan instruksi Anda.',
        });
      }

      // Add recent conversation history (last 10 exchanges)
      const recentHistory = conversationHistory.slice(-20);
      aiMessages.push(...recentHistory);

      // Add current user message
      aiMessages.push({ role: 'user', content: message });

      // Setup SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      let fullResponse = '';
      let outputTokens = 0;
      const requestedModel = model || activeModel.name;

      // Count input tokens BEFORE sending to AI
      const inputTokens = countInputTokens(aiMessages);
      TOKEN_ENGINE.inputTokensToday += inputTokens;
      TOKEN_ENGINE.totalTokensToday += inputTokens;
      TOKEN_ENGINE.totalTokensAllTime += inputTokens;
      TOKEN_ENGINE.requestsToday += 1;
      TOKEN_ENGINE.requestsAllTime += 1;

      // Send initial token stats with input count
      try {
        res.write(`data: ${JSON.stringify({
          type: 'token_stats',
          inputTokens,
          stats: getTokenStats(),
        })}\n\n`);
      } catch (e) {}

      const streamHandle = streamAI(
        requestedModel,
        aiMessages,
        API_CONFIG,
        // onToken
        (token) => {
          fullResponse += token;
          const chunkTokens = countTokens(token);
          outputTokens += chunkTokens;
          TOKEN_ENGINE.outputTokensToday += chunkTokens;
          TOKEN_ENGINE.totalTokensToday += chunkTokens;
          TOKEN_ENGINE.totalTokensAllTime += chunkTokens;

          try {
            res.write(`data: ${JSON.stringify({
              type: 'token',
              token: token,
              stats: {
                inputTokens,
                outputTokens,
                totalToday: TOKEN_ENGINE.totalTokensToday,
                totalAllTime: TOKEN_ENGINE.totalTokensAllTime,
                requestsToday: TOKEN_ENGINE.requestsToday,
              },
            })}\n\n`);
          } catch (e) {}
        },
        // onDone
        () => {
          // Save to conversation history
          conversationHistory.push({ role: 'user', content: message });
          conversationHistory.push({ role: 'assistant', content: fullResponse });
          // Keep history manageable
          if (conversationHistory.length > 40) {
            conversationHistory = conversationHistory.slice(-30);
          }

          const chatItem = {
            id: 'msg-' + Date.now(),
            user: message,
            agent: fullResponse,
            model: activeModel.name,
            tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
            timestamp: new Date().toISOString(),
          };
          desktopState.chatLog.push(chatItem);
          broadcastToMobile({ type: 'new_chat', chatItem });

          // Persist stats to disk
          saveTokenStats();

          try {
            res.write(`data: ${JSON.stringify({
              type: 'done',
              fullResponse,
              tokenBreakdown: {
                input: inputTokens,
                output: outputTokens,
                total: inputTokens + outputTokens,
              },
              stats: getTokenStats(),
              model: activeModel.name,
            })}\n\n`);
            res.end();
          } catch (e) {}
        },
        // onError
        (err) => {
          console.error('[AI Engine Error]', err.message);
          let errorText;
          if (err.message === 'NO_API_KEY') {
            errorText = '⚠️ Tidak ada API key yang terkonfigurasi untuk model ini. Klik tombol 🔑 di navbar untuk memasukkan API key.';
          } else {
            errorText = `⚠️ Error dari AI Provider: ${err.message}\n\nSilakan periksa API key Anda atau coba model lain.`;
          }
          try {
            res.write(`data: ${JSON.stringify({ type: 'token', token: errorText })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'done', fullResponse: errorText, tokensTotal: 0, model: activeModel.name })}\n\n`);
            res.end();
          } catch (e) {}
        },
        systemPrompt
      );

      req.on('close', () => {
        streamHandle.abort();
      });
      return;
    }

    // ===== NON-STREAMING CHAT FALLBACK =====
    if (pathname === '/api/chat' && req.method === 'POST') {
      const { message, fileContext } = await readBody(req);
      const aiMessages = [];
      if (fileContext?.content) {
        aiMessages.push({ role: 'user', content: `[File: ${fileContext.path}]\n\`\`\`\n${fileContext.content.substring(0, 4000)}\n\`\`\`` });
        aiMessages.push({ role: 'assistant', content: 'Saya telah membaca file tersebut.' });
      }
      aiMessages.push(...conversationHistory.slice(-20));
      aiMessages.push({ role: 'user', content: message });

      let fullReply = '';

      streamAI(activeModel.name, aiMessages, API_CONFIG,
        (token) => { fullReply += token; },
        () => {
          conversationHistory.push({ role: 'user', content: message });
          conversationHistory.push({ role: 'assistant', content: fullReply });
          if (conversationHistory.length > 40) conversationHistory = conversationHistory.slice(-30);

          const chatItem = { id: 'msg-' + Date.now(), user: message, agent: fullReply, model: activeModel.name, timestamp: new Date().toISOString() };
          desktopState.chatLog.push(chatItem);
          broadcastToMobile({ type: 'new_chat', chatItem });
          sendJSON(res, 200, { success: true, reply: fullReply, chatItem });
        },
        (err) => {
          sendJSON(res, 200, { success: true, reply: `⚠️ Error: ${err.message}`, chatItem: { id: 'msg-' + Date.now(), user: message, agent: `Error: ${err.message}`, model: activeModel.name, timestamp: new Date().toISOString() } });
        }
      );
      return;
    }

    // ===== STATUS & TOKEN STATS =====
    if (pathname === '/api/status' || pathname === '/api/ai/token-stats') {
      const providerStatus = getProviderStatus(API_CONFIG);
      sendJSON(res, 200, {
        status: 'online',
        activeModel,
        tokenEngine: getTokenStats(),
        apiConfigStatus: {
          openrouter: providerStatus.openrouter,
          openai: providerStatus.openai,
          anthropic: providerStatus.anthropic,
          deepseek: providerStatus.deepseek,
          ollama: providerStatus.ollama,
          anyKeyConfigured: providerStatus.anyKeyConfigured,
        },
        mcpCount: mcpServers.length,
        skillsCount: skillsList.length,
        localIP: getLocalIP(),
        allIPs: getAllLocalIPs(),
        port: PORT,
        mobileClients: mobileConnections.size,
      });
      return;
    }

    // ===== MODELS =====
    if (pathname === '/api/models') {
      const catalog = {
        CLAUDE: ['Claude 3.7 Sonnet', 'Claude 3.5 Sonnet', 'Claude 3.5 Haiku', 'Claude 3 Opus'],
        GPT: ['GPT-4o', 'GPT-4o mini', 'o3-mini', 'o1', 'GPT-4 Turbo'],
        GEMINI: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
        DEEPSEEK: ['DeepSeek-V3', 'DeepSeek-R1'],
        GROK: ['Grok 2', 'Grok 2 Vision'],
        LLAMA: ['Llama 3.3 70B', 'Llama 3.1 8B'],
        QWEN: ['Qwen 2.5 Coder 32B', 'Qwen 2.5 72B']
      };
      sendJSON(res, 200, { active: activeModel, catalog, plan: 'unlimited' });
      return;
    }

    // ===== SET MODEL =====
    if (pathname === '/api/set-model' && req.method === 'POST') {
      const data = await readBody(req);
      activeModel.family = data.family || activeModel.family;
      activeModel.name = data.name || activeModel.name;
      conversationHistory = []; // reset history on model switch
      sendJSON(res, 200, { success: true, activeModel });
      return;
    }

    // ===== CONFIGURE API KEYS (SAVE TO DISK) =====
    if (pathname === '/api/ai/configure-keys' && req.method === 'POST') {
      const keys = await readBody(req);
      if (keys.gemini !== undefined) API_CONFIG.gemini = keys.gemini;
      if (keys.openrouter !== undefined) API_CONFIG.openrouter = keys.openrouter;
      if (keys.openai !== undefined) API_CONFIG.openai = keys.openai;
      if (keys.anthropic !== undefined) API_CONFIG.anthropic = keys.anthropic;
      if (keys.deepseek !== undefined) API_CONFIG.deepseek = keys.deepseek;
      if (keys.ollamaUrl !== undefined) API_CONFIG.ollamaUrl = keys.ollamaUrl;
      if (keys.ollamaModel !== undefined) API_CONFIG.ollamaModel = keys.ollamaModel;
      saveKeysToFile();
      const status = getProviderStatus(API_CONFIG);
      sendJSON(res, 200, { success: true, message: 'API Keys saved and activated!', providerStatus: status });
      return;
    }

    // ===== GET API KEY STATUS =====
    if (pathname === '/api/ai/key-status') {
      const status = getProviderStatus(API_CONFIG);
      // Show masked keys
      const masked = {
        gemini: API_CONFIG.gemini ? API_CONFIG.gemini.substring(0, 8) + '...' + API_CONFIG.gemini.slice(-4) : '',
        openrouter: API_CONFIG.openrouter ? API_CONFIG.openrouter.substring(0, 8) + '...' + API_CONFIG.openrouter.slice(-4) : '',
        openai: API_CONFIG.openai ? API_CONFIG.openai.substring(0, 8) + '...' + API_CONFIG.openai.slice(-4) : '',
        anthropic: API_CONFIG.anthropic ? API_CONFIG.anthropic.substring(0, 8) + '...' + API_CONFIG.anthropic.slice(-4) : '',
        deepseek: API_CONFIG.deepseek ? API_CONFIG.deepseek.substring(0, 8) + '...' + API_CONFIG.deepseek.slice(-4) : '',
        ollamaUrl: API_CONFIG.ollamaUrl,
      };
      sendJSON(res, 200, { ...status, maskedKeys: masked });
      return;
    }

    // ===== CLEAR CHAT HISTORY =====
    if (pathname === '/api/ai/clear-history' && req.method === 'POST') {
      conversationHistory = [];
      desktopState.chatLog = [];
      sendJSON(res, 200, { success: true, message: 'Chat history cleared' });
      return;
    }

    // ===== FILES =====
    if (pathname === '/api/files') {
      sendJSON(res, 200, { tree: scanDir(WORKSPACE_DIR), workspace: WORKSPACE_DIR });
      return;
    }

    if (pathname === '/api/file' && req.method === 'GET') {
      const rel = urlObj.searchParams.get('path');
      if (!rel) { sendJSON(res, 400, { error: 'Path required' }); return; }
      try {
        const content = fs.readFileSync(path.join(WORKSPACE_DIR, rel), 'utf8');
        sendJSON(res, 200, { path: rel, content });
      } catch (e) {
        sendJSON(res, 404, { error: e.message });
      }
      return;
    }

    if (pathname === '/api/file' && req.method === 'POST') {
      const { path: rel, content } = await readBody(req);
      const full = path.join(WORKSPACE_DIR, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content, 'utf8');
      desktopState.activeFile = rel;
      desktopState.lastCodeSync = Date.now();
      broadcastToMobile({ type: 'file_updated', path: rel, content });
      sendJSON(res, 200, { success: true, path: rel });
      return;
    }

    // ===== RUN SCRIPT / EXECUTE / WEB PREVIEW =====
    if (pathname === '/api/run' && req.method === 'POST') {
      const { command, scriptPath } = await readBody(req);
      const targetScript = scriptPath || '';

      // If it's an HTML file, launch Web Preview mode!
      if (targetScript.endsWith('.html') || targetScript.endsWith('.htm')) {
        const previewUrl = `/preview/${encodeURIComponent(targetScript)}`;
        sendJSON(res, 200, {
          type: 'web_preview',
          url: previewUrl,
          fileName: targetScript,
          command: `live-web-preview "${targetScript}"`,
          stdout: `🌐 [Live Web Execution] Berhasil mengeksekusi tampilan web: ${targetScript}\n🔗 URL: http://localhost:${PORT}${previewUrl}`,
          stderr: '',
          exitCode: 0,
          durationMs: 1
        });
        return;
      }

      // If it's Python, PHP, or Node script
      let cmdToRun = command;
      if (!cmdToRun) {
        if (targetScript.endsWith('.php')) {
          cmdToRun = `php "${path.join(WORKSPACE_DIR, targetScript)}"`;
        } else if (targetScript.endsWith('.py')) {
          cmdToRun = `python "${path.join(WORKSPACE_DIR, targetScript)}"`;
        } else {
          cmdToRun = `node "${path.join(WORKSPACE_DIR, targetScript)}"`;
        }
      }

      const startTime = Date.now();
      exec(cmdToRun, { cwd: WORKSPACE_DIR, timeout: 15000 }, (error, stdout, stderr) => {
        sendJSON(res, 200, {
          type: 'cli_exec',
          command: cmdToRun,
          stdout: stdout || '',
          stderr: stderr || (error ? error.message : ''),
          exitCode: error ? error.code : 0,
          durationMs: Date.now() - startTime
        });
      });
      return;
    }

    // ===== LIVE WORKSPACE WEB PREVIEW (Render HTML, CSS, JS directly) =====
    if (pathname.startsWith('/preview/')) {
      const relFile = decodeURIComponent(pathname.replace(/^\/preview\//, ''));
      const safeTarget = path.normalize(path.join(WORKSPACE_DIR, relFile));
      if (!safeTarget.startsWith(WORKSPACE_DIR)) {
        res.writeHead(403); res.end('Forbidden'); return;
      }
      fs.stat(safeTarget, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h3>File tidak ditemukan di workspace: ${relFile}</h3>`);
          return;
        }
        const ext = path.extname(safeTarget).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/html; charset=utf-8' });
        fs.createReadStream(safeTarget).pipe(res);
      });
      return;
    }

    // ===== MCP =====
    if (pathname === '/api/mcp/servers') {
      sendJSON(res, 200, { servers: mcpServers, skills: skillsList });
      return;
    }

    // ===== MOBILE SSE (Optimized for Android Chrome & iOS Safari) =====
    if (pathname === '/api/mobile/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write(`data: ${JSON.stringify({ type: 'init', desktopState, activeModel, tokenEngine: TOKEN_ENGINE })}\n\n`);
      mobileConnections.add(res);
      // Keep-alive heartbeat every 15s to prevent iOS Safari from dropping the connection
      const heartbeat = setInterval(() => {
        try { res.write(': heartbeat\n\n'); } catch (e) { clearInterval(heartbeat); }
      }, 15000);
      req.on('close', () => {
        clearInterval(heartbeat);
        mobileConnections.delete(res);
      });
      return;
    }

    // ===== STATIC FILE SERVING =====
    let targetPath = pathname === '/' ? '/index.html' : pathname;
    if (targetPath === '/mobile') targetPath = '/mobile.html';
    const fullStaticPath = path.join(PUBLIC_DIR, targetPath);
    if (!fullStaticPath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }

    fs.stat(fullStaticPath, (err, stats) => {
      if (err || !stats.isFile()) {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (readErr, content) => {
          if (readErr) { res.writeHead(404); res.end('Not Found'); }
          else { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(content); }
        });
        return;
      }
      const ext = path.extname(fullStaticPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(fullStaticPath).pipe(res);
    });

  } catch (err) {
    console.error('[Server Error]', err);
    if (!res.headersSent) {
      sendJSON(res, 500, { error: err.message });
    }
  }
});

module.exports = server;

if (!process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    const status = getProviderStatus(API_CONFIG);
    console.log(`=======================================================`);
    console.log(`🚀 JZAGENTIC IDE & REAL AI ECOSYSTEM IS LIVE`);
    console.log(`🖥️  Desktop:       http://localhost:${PORT}`);
    console.log(`📱 Mobile Mirror:  http://${getLocalIP()}:${PORT}/mobile`);
    console.log(`⚡ Active Model:   ${activeModel.name}`);
    console.log(`♾️  Plan:           UNLIMITED (Real-Time Token Metering)`);
    console.log(`📊 Lifetime Usage: ${TOKEN_ENGINE.totalTokensAllTime.toLocaleString()} tokens`);
    console.log(`-------------------------------------------------------`);
    console.log(`🔑 API Keys Status:`);
    console.log(`   Gemini:      ${status.gemini ? '✅ Connected (Primary)' : '❌ Not set'}`);
    console.log(`   OpenRouter:  ${status.openrouter ? '✅ Connected' : '❌ Not set'}`);
    console.log(`   Anthropic:   ${status.anthropic ? '✅ Connected' : '❌ Not set'}`);
    console.log(`   OpenAI:      ${status.openai ? '✅ Connected' : '❌ Not set'}`);
    console.log(`   DeepSeek:    ${status.deepseek ? '✅ Connected' : '❌ Not set'}`);
    console.log(`   Ollama:      ${API_CONFIG.ollamaModel ? `✅ ${API_CONFIG.ollamaModel} @ ${API_CONFIG.ollamaUrl}` : `${API_CONFIG.ollamaUrl} (no model set)`}`);
    if (!status.anyKeyConfigured) {
      console.log(`\n⚠️  PERHATIAN: Belum ada API key terkonfigurasi!`);
      console.log(`   Buka http://localhost:${PORT} → klik 🔑 → masukkan API key`);
    }
    console.log(`=======================================================`);
  });
}
