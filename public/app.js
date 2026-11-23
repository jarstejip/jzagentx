/**
 * JZAGENTIC - Front-End Orchestrator (Real Token Metering & Real-Time Stream Engine)
 */

// Global State
let currentTab = 'agent';
let activeModel = { family: 'CLAUDE', name: 'Claude 3.7 Sonnet' };
let currentFile = 'playground.js';
let localIP = 'localhost';
let serverPort = 3333;

// User Authentication & Monetization State
let currentUser = null;
let sessionToken = localStorage.getItem('jz_session_token') || null;
let googleClientId = '';
let availablePlans = [];
let whatsappAdminNumber = '6281515779040';
let currentAdminOtp = '';

// Real Token Tracking
let tokenStats = {
  inputTokensToday: 0,
  outputTokensToday: 0,
  totalTokensToday: 0,
  totalTokensAllTime: 0,
  requestsToday: 0,
  requestsAllTime: 0,
  currentInput: 0,
  currentOutput: 0,
};

const MODEL_CATALOG = {
  CLAUDE: {
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#CC785C" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="m13.827 2.115 6.957 18.067h-3.044l-1.424-3.79H7.684l-1.424 3.79H3.216L10.173 2.115h3.654zm-.702 3.656h-.25L9.043 14.15h5.914l-3.832-8.38z"/></svg>`,
    provider: 'Anthropic',
    models: ['Claude 3.7 Sonnet', 'Claude 3.5 Sonnet', 'Claude 3.5 Haiku', 'Claude 3 Opus']
  },
  GPT: {
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#10A37F" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.783a4.485 4.485 0 0 1 2.366-1.973V12.4a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.067 0L4.002 14.94A4.502 4.502 0 0 1 2.34 8.783zm15.746 3.924l-5.843-3.37 2.02-1.168a.076.076 0 0 1 .068 0l4.82 2.782a4.498 4.498 0 0 1-.68 8.013v-5.58a.79.79 0 0 0-.385-.677zm2.327-3.924a4.48 4.48 0 0 1-.535 3.013l-.142-.085-4.783-2.759a.770.770 0 0 0-.78 0L8.83 12.32V9.99a.08.08 0 0 1 .033-.062l4.84-2.79a4.5 4.5 0 0 1 6.364 1.646zM10.74 1.57a4.5 4.5 0 0 1 4.494 4.494v5.583a.795.795 0 0 0 .392.681l4.779 2.758-.141.082a4.476 4.476 0 0 1-6.648-4.223V5.21a.071.071 0 0 0-.038-.052L10.74 1.57zm-.74 9.176l2.02-1.166 2.02 1.166v2.332l-2.02 1.166-2.02-1.166V10.746z"/></svg>`,
    provider: 'OpenAI',
    models: ['GPT-4o', 'GPT-4o mini', 'o3-mini', 'o1', 'GPT-4 Turbo']
  },
  GEMINI: {
    iconSvg: `<img src="/gemini-logo.webp" width="18" height="18" style="vertical-align:middle; display:inline-block; object-fit:contain; flex-shrink:0;" alt="Google Gemini">`,
    provider: 'Google',
    models: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash']
  },
  DEEPSEEK: {
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M2.5 13C2.5 7.5 7 3.5 13 3.5C18 3.5 21.5 7 21.5 11.5C21.5 15.5 18.5 19 14 19.5L16.5 22L11 20C5.5 19.5 2.5 16.5 2.5 13Z" fill="#1E6FFF"/><circle cx="8.5" cy="11.5" r="1.5" fill="#FFFFFF"/></svg>`,
    provider: 'DeepSeek',
    models: ['DeepSeek-V3', 'DeepSeek-R1']
  },
  GROK: {
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    provider: 'xAI',
    models: ['Grok 2', 'Grok 2 Vision']
  },
  LLAMA: {
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M6.88 4C3.84 4 1.5 6.37 1.5 9.77C1.5 14.19 5.56 18.24 9.17 19.78C10.66 20.42 12 19.71 12 19.71C12 19.71 13.34 20.42 14.83 19.78C18.44 18.24 22.5 14.19 22.5 9.77C22.5 6.37 20.16 4 17.12 4C14.7 4 12.87 5.48 12 7.02C11.13 5.48 9.3 4 6.88 4ZM7.14 6.35C8.92 6.35 10.35 7.69 11.08 9.94C9.52 13.56 7.42 16.53 4.8 17.06C3.41 15.93 3.03 13.53 3.03 9.77C3.03 7.82 4.67 6.35 7.14 6.35ZM16.86 6.35C19.33 6.35 20.97 7.82 20.97 9.77C20.97 13.53 20.59 15.93 19.2 17.06C16.58 16.53 14.48 13.56 12.92 9.94C13.65 7.69 15.08 6.35 16.86 6.35Z" fill="url(#meta-grad-icon)"/><defs><linearGradient id="meta-grad-icon" x1="1.5" y1="4" x2="22.5" y2="19.78" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0081FB"/><stop offset="50%" stop-color="#0064E0"/><stop offset="100%" stop-color="#0081FB"/></linearGradient></defs></svg>`,
    provider: 'Meta',
    models: ['Llama 3.3 70B', 'Llama 3.1 8B']
  },
  QWEN: {
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#FF6A00" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.2l7.8 4.3L12 12.8 4.2 8.5 12 4.2zm-8 6l7 3.8v7.3l-7-3.8V10.2zm9 11.1v-7.3l7-3.8v7.3l-7 3.8z"/></svg>`,
    provider: 'Alibaba',
    models: ['Qwen 2.5 Coder 32B', 'Qwen 2.5 72B']
  }
};

// DOM Elements
const canvas = document.getElementById('stars-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const editorTextarea = document.getElementById('main-editor-area');
const lineNumbersCol = document.getElementById('line-numbers-col');
const fileTreeContainer = document.getElementById('file-tree-container');
const phoneLiveCode = document.getElementById('phone-live-code');
const terminalLogs = document.getElementById('terminal-logs-view');
const chatFeedContainer = document.getElementById('chat-feed-container');

// ==================== 1. COSMIC PARTICLES BACKGROUND ====================
let particles = [];
function initParticles() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = [];
  const count = Math.floor((canvas.width * canvas.height) / 8000);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
    });
  }
}

function renderParticles() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let p of particles) {
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.35})`;
    ctx.fill();
  }
  requestAnimationFrame(renderParticles);
}

window.addEventListener('resize', initParticles);

// ==================== 2. NAVIGATION & TAB SWITCHING ====================
function updateAgentContextPill() {
  const pill = document.getElementById('agent-active-file-pill');
  if (pill) {
    pill.textContent = currentFile || 'workspace';
  }
}

function updateModeUI(mode) {
  const indicator = document.getElementById('mode-status-indicator');
  const indicatorText = document.getElementById('mode-indicator-text');
  const inputEl = document.getElementById('hero-chat-input');
  const greetingEl = document.querySelector('.gemini-greeting');
  const subtextEl = document.querySelector('.gemini-subtext');
  const cardsContainer = document.querySelector('.gemini-prompt-cards');

  if (mode === 'agent') {
    if (indicator) indicator.classList.remove('chatbot-mode');
    if (indicatorText) {
      indicatorText.innerHTML = `⚡ <strong>Mode Agen Otonom:</strong> Terhubung ke Workspace • Memantau File: <code id="agent-active-file-pill">${currentFile}</code>`;
    }
    if (inputEl) {
      inputEl.placeholder = `Instruksikan Agent untuk memodifikasi kode ${currentFile}, menambah fitur, atau audit file...`;
    }
    if (greetingEl) greetingEl.textContent = 'Halo, Developer';
    if (subtextEl) subtextEl.textContent = `Autonomous Agent siap mengeksekusi tugas & memodifikasi file ${currentFile} di workspace Anda.`;

    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="gemini-card" data-prompt="Modifikasi file ${currentFile}: tambahkan section baru dengan desain modern dan responsive">
          <div class="card-icon">⚡</div>
          <div class="card-title">Modifikasi ${currentFile}</div>
          <div class="card-desc">Tambahkan fitur atau section baru secara otonom</div>
        </div>
        <div class="gemini-card" data-prompt="Refactor dan bersihkan kode di file ${currentFile} agar lebih rapi dan efisien">
          <div class="card-icon">🛠️</div>
          <div class="card-title">Auto-Refactor Kode</div>
          <div class="card-desc">Optimasi struktur dan performa script</div>
        </div>
        <div class="gemini-card" data-prompt="Audit keamanan dan periksa potensi error atau bug pada script ${currentFile}">
          <div class="card-icon">🔒</div>
          <div class="card-title">Audit Keamanan & Bug</div>
          <div class="card-desc">Pindai kerentanan kode di workspace</div>
        </div>
        <div class="gemini-card" data-prompt="Buatkan file JavaScript modular baru untuk menambahkan interaktivitas ke ${currentFile}">
          <div class="card-icon">📄</div>
          <div class="card-title">Buat Script Baru</div>
          <div class="card-desc">Generate file pendukung di workspace</div>
        </div>
      `;
      reattachCardListeners();
    }
  } else if (mode === 'chatbot') {
    if (indicator) indicator.classList.add('chatbot-mode');
    if (indicatorText) {
      indicatorText.innerHTML = `💬 <strong>Mode Chatbot AI:</strong> Obrolan Cerdas Gemini (Bebas Tanya Konsep, Riset & Diskusi Tanpa Batas)`;
    }
    if (inputEl) {
      inputEl.placeholder = 'Tanya apa saja kepada JZAGENTIC AI (konsep, riset, diskusi, bebas tanpa batasan)...';
    }
    if (greetingEl) greetingEl.textContent = 'Halo, Rekan';
    if (subtextEl) subtextEl.textContent = 'Apa topik, ide, atau pertanyaan yang ingin Anda diskusikan hari ini?';

    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="gemini-card" data-prompt="Jelaskan cara kerja arsitektur sistem berbasis Microservices vs Monolith beserta pro kontranya">
          <div class="card-icon">📚</div>
          <div class="card-title">Eksplorasi Konsep Teknis</div>
          <div class="card-desc">Pelajari arsitektur dan sistem modern</div>
        </div>
        <div class="gemini-card" data-prompt="Berikan saya ide dan blueprint sistem SaaS berbasis AI yang menguntungkan tahun ini">
          <div class="card-icon">💡</div>
          <div class="card-title">Brainstorming Ide Produk</div>
          <div class="card-desc">Rancang ide inovatif dan strategi produk</div>
        </div>
        <div class="gemini-card" data-prompt="Analisis tren arsitektur keamanan siber dan proteksi zero-trust terkini">
          <div class="card-icon">🔍</div>
          <div class="card-title">Riset & Analisis Faktual</div>
          <div class="card-desc">Dapatkan wawasan mendalam topik digital</div>
        </div>
        <div class="gemini-card" data-prompt="Bantu saya menyusun artikel teknis dan dokumentasi API yang profesional dan rapi">
          <div class="card-icon">✍️</div>
          <div class="card-title">Copywriting & Dokumentasi</div>
          <div class="card-desc">Tulis konten teknis berstandar industri</div>
        </div>
      `;
      reattachCardListeners();
    }
  }
}

function reattachCardListeners() {
  document.querySelectorAll('.gemini-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      if (prompt) {
        sendChatMessageStream(prompt, 'chat-feed-container');
      }
    });
  });
}

function switchNavTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

  if (tabName === 'agent' || tabName === 'chatbot') {
    document.getElementById('view-agent').classList.add('active');
    updateModeUI(tabName);
  } else if (tabName === 'ide') {
    document.getElementById('view-ide').classList.add('active');
    updateLineNumbers();
  } else if (tabName === 'ecosystem') {
    document.getElementById('view-ecosystem').classList.add('active');
  }
}

document.querySelectorAll('.nav-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchNavTab(btn.dataset.tab));
});

// Ecosystem Sub-Tabs
document.querySelectorAll('.eco-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.eco-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const target = tab.dataset.ecotab;
    document.querySelectorAll('.eco-subview').forEach(v => v.style.display = 'none');
    
    if (target === 'mirror') {
      document.getElementById('ecoview-mirror').style.display = 'block';
    } else if (target === 'mcp') {
      document.getElementById('ecoview-mcp').style.display = 'block';
      loadMcpView();
    } else if (target === 'skills') {
      document.getElementById('ecoview-skills').style.display = 'block';
      loadSkillsView();
    } else {
      document.getElementById('ecoview-mcp').style.display = 'block';
      loadMcpView();
    }
  });
});

// ==================== 3. FILE SYSTEM & EDITOR ====================
let showAllFiles = false;

async function loadFiles() {
  try {
    const res = await fetch(`/api/files?showAll=${showAllFiles}`);
    const data = await res.json();
    renderFileTree(data.tree, fileTreeContainer);
  } catch (e) {
    console.error('Failed to load files:', e);
  }
}

function renderFileTree(nodes, container, depth = 0) {
  container.innerHTML = '';
  nodes.forEach(node => {
    const item = document.createElement('div');
    item.className = 'tree-item' + (node.path === currentFile ? ' active' : '');
    item.style.paddingLeft = `${depth * 14 + 14}px`;

    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    if (node.type === 'directory') {
      icon.textContent = '📁';
    } else if (node.name.endsWith('.php')) {
      icon.textContent = '🐘';
    } else if (node.name.endsWith('.js')) {
      icon.textContent = '🟨';
    } else if (node.name.endsWith('.sql')) {
      icon.textContent = '🗄️';
    } else if (node.name.endsWith('.json')) {
      icon.textContent = '⚙️';
    } else if (node.name.endsWith('.md')) {
      icon.textContent = '📝';
    } else {
      icon.textContent = '📄';
    }

    const name = document.createElement('span');
    name.textContent = node.name;

    item.appendChild(icon);
    item.appendChild(name);

    if (node.type === 'file') {
      item.addEventListener('click', () => openFile(node.path));
    }

    container.appendChild(item);

    if (node.type === 'directory' && node.children) {
      const childContainer = document.createElement('div');
      renderFileTree(node.children, childContainer, depth + 1);
      container.appendChild(childContainer);
    }
  });
}

async function openFile(relPath) {
  try {
    const res = await fetch(`/api/file?path=${encodeURIComponent(relPath)}`);
    const data = await res.json();
    if (data.content !== undefined) {
      currentFile = relPath;
      editorTextarea.value = data.content;
      document.getElementById('active-tab-name').textContent = pathBasename(relPath);
      document.getElementById('context-file-tag').textContent = pathBasename(relPath);
      updateLineNumbers();
      syncToPhoneMirror(data.content, relPath);
      updateAgentContextPill();
      if (currentTab === 'agent') {
        updateModeUI('agent');
      }
      loadFiles();
      if (livePreviewPane && livePreviewPane.style.display !== 'none' && (relPath.endsWith('.html') || relPath.endsWith('.htm'))) {
        openLivePreview(relPath);
      }
      showToast(`Membuka ${relPath}`);
    }
  } catch (e) {
    showToast(`Error membuka file: ${e.message}`);
  }
}

let saveTimeout = null;
editorTextarea.addEventListener('input', () => {
  updateLineNumbers();
  syncToPhoneMirror(editorTextarea.value, currentFile);

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentFile, content: editorTextarea.value }),
      });
      if (livePreviewPane && livePreviewPane.style.display !== 'none' && (currentFile.endsWith('.html') || currentFile.endsWith('.htm'))) {
        refreshLivePreview();
      }
    } catch (e) {
      console.error('Auto-save error:', e);
    }
  }, 600);
});

editorTextarea.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editorTextarea.selectionStart;
    const end = editorTextarea.selectionEnd;
    editorTextarea.value = editorTextarea.value.substring(0, start) + '    ' + editorTextarea.value.substring(end);
    editorTextarea.selectionStart = editorTextarea.selectionEnd = start + 4;
    updateLineNumbers();
  }
});

function updateLineNumbers() {
  if (!editorTextarea || !lineNumbersCol) return;
  const lines = editorTextarea.value.split('\n').length;
  let nums = '';
  for (let i = 1; i <= lines; i++) {
    nums += i + '\n';
  }
  lineNumbersCol.textContent = nums;
}

function syncToPhoneMirror(content, filePath) {
  if (phoneLiveCode) {
    phoneLiveCode.textContent = `// File: ${filePath}\n\n` + content;
  }
}

function pathBasename(p) {
  return p.split(/[\\/]/).pop();
}

// Toggle System Files in Explorer
const toggleFilterBtn = document.getElementById('toggle-filter-files-btn');
if (toggleFilterBtn) {
  toggleFilterBtn.addEventListener('click', () => {
    showAllFiles = !showAllFiles;
    toggleFilterBtn.style.opacity = showAllFiles ? '1' : '0.5';
    toggleFilterBtn.title = showAllFiles ? 'Mode: Semua File Termasuk Sistem (Klik untuk Proyek Saja)' : 'Mode: Proyek Saja (Klik untuk Lihat File Sistem)';
    loadFiles();
    showToast(showAllFiles ? 'Menampilkan semua file sistem' : 'Menampilkan file proyek web saja');
  });
}

const refreshFilesBtn = document.getElementById('refresh-files-btn');
if (refreshFilesBtn) {
  refreshFilesBtn.addEventListener('click', () => {
    loadFiles();
    showToast('File explorer diperbarui');
  });
}

const createFileBtn = document.getElementById('create-file-btn');
if (createFileBtn) {
  createFileBtn.addEventListener('click', async () => {
    const filename = prompt('Nama file baru (contoh: test.php atau script.js):');
    if (!filename) return;
    try {
      await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filename, content: '// ' + filename + '\n' })
      });
      await loadFiles();
      openFile(filename);
      showToast(`File ${filename} berhasil dibuat!`);
    } catch (e) {
      showToast('Gagal membuat file: ' + e.message);
    }
  });
}

// ==================== 4. SCRIPT RUNNER & LIVE WEB PREVIEW ====================
const workspaceBody = document.getElementById('ide-workspace-body');
const livePreviewPane = document.getElementById('live-preview-pane');
const livePreviewIframe = document.getElementById('live-preview-iframe');
const previewUrlText = document.getElementById('preview-url-text');
const idePreviewBtn = document.getElementById('ide-preview-btn');
const ideSplitBtn = document.getElementById('ide-split-btn');
const quickPreviewTabBtn = document.getElementById('quick-preview-tab-btn');

function getPreviewUrl(file) {
  const target = file || currentFile;
  return `/preview/${encodeURIComponent(target)}?t=${Date.now()}`;
}

function openLivePreview(file, mode = 'split') {
  const target = file || currentFile;
  const url = getPreviewUrl(target);
  
  if (livePreviewIframe) livePreviewIframe.src = url;
  if (previewUrlText) previewUrlText.textContent = `http://${localIP}:${serverPort}/preview/${encodeURIComponent(target)}`;
  
  if (workspaceBody) {
    if (mode === 'split') {
      workspaceBody.classList.remove('preview-only');
      workspaceBody.classList.add('split-mode');
    } else {
      workspaceBody.classList.remove('split-mode');
      workspaceBody.classList.add('preview-only');
    }
  }
  if (livePreviewPane) livePreviewPane.style.display = 'flex';
  if (quickPreviewTabBtn) quickPreviewTabBtn.classList.add('active');
  if (idePreviewBtn) idePreviewBtn.classList.add('active');
}

function closeLivePreview() {
  if (workspaceBody) {
    workspaceBody.classList.remove('split-mode', 'preview-only');
  }
  if (livePreviewPane) livePreviewPane.style.display = 'none';
  if (quickPreviewTabBtn) quickPreviewTabBtn.classList.remove('active');
  if (idePreviewBtn) idePreviewBtn.classList.remove('active');
}

function refreshLivePreview() {
  if (livePreviewIframe) {
    livePreviewIframe.src = getPreviewUrl(currentFile);
    showToast('Tampilan web diperbarui');
  }
}

// Preview button handlers
if (idePreviewBtn) {
  idePreviewBtn.addEventListener('click', () => {
    if (livePreviewPane && livePreviewPane.style.display !== 'none' && workspaceBody && workspaceBody.classList.contains('preview-only')) {
      closeLivePreview();
    } else {
      openLivePreview(currentFile, 'preview-only');
    }
  });
}

if (ideSplitBtn) {
  ideSplitBtn.addEventListener('click', () => {
    if (workspaceBody && workspaceBody.classList.contains('split-mode')) {
      closeLivePreview();
    } else {
      openLivePreview(currentFile, 'split');
    }
  });
}

if (quickPreviewTabBtn) {
  quickPreviewTabBtn.addEventListener('click', () => {
    if (livePreviewPane && livePreviewPane.style.display !== 'none') {
      closeLivePreview();
    } else {
      openLivePreview(currentFile, 'split');
    }
  });
}

document.getElementById('preview-refresh-btn')?.addEventListener('click', refreshLivePreview);

document.getElementById('preview-external-btn')?.addEventListener('click', () => {
  const url = `http://${localIP}:${serverPort}/preview/${encodeURIComponent(currentFile)}`;
  window.open(url, '_blank');
  showToast(`Membuka ${currentFile} di tab baru browser!`);
});

document.getElementById('preview-close-btn')?.addEventListener('click', closeLivePreview);

// RUN BUTTON: Smart handler for HTML vs Scripts
document.getElementById('ide-run-btn').addEventListener('click', async () => {
  logTerminal(`[JZAGENTIC Runner] Menjalankan ${currentFile}...`);

  // Auto-save file first
  try {
    await fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentFile, content: editorTextarea.value }),
    });
  } catch (e) {}

  // If HTML: launch Live Web Preview directly!
  if (currentFile.endsWith('.html') || currentFile.endsWith('.htm')) {
    openLivePreview(currentFile, 'split');
    logTerminal(`🌐 [Live Web Execution] Menampilkan pratinjau halaman web untuk ${currentFile}`);
    logTerminal(`🔗 URL: http://${localIP}:${serverPort}/preview/${encodeURIComponent(currentFile)}`);
    showToast(`🌐 Halaman web ${currentFile} berhasil dieksekusi & ditampilkan!`);
    return;
  }

  // CLI scripts (Node, PHP, Python)
  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptPath: currentFile }),
    });
    const result = await res.json();
    logTerminal(`$ ${result.command}`);
    if (result.stdout) logTerminal(result.stdout);
    if (result.stderr) logTerminal(`[STDERR] ${result.stderr}`);
    logTerminal(`[Selesai dalam ${result.durationMs}ms | Exit code: ${result.exitCode}]`);
    showToast(`Eksekusi ${currentFile} selesai!`);
  } catch (e) {
    logTerminal(`[Error] Gagal mengeksekusi: ${e.message}`);
  }
});

function logTerminal(msg) {
  terminalLogs.textContent += '\n' + msg;
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

document.getElementById('clear-term-btn').addEventListener('click', () => {
  terminalLogs.textContent = '[JZAGENTIC Shell] Terminal cleared.';
});

document.getElementById('ide-terminal-toggle').addEventListener('click', () => {
  const drawer = document.getElementById('terminal-drawer');
  drawer.style.display = drawer.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('ide-agent-toggle').addEventListener('click', () => {
  const panel = document.getElementById('ide-agent-panel');
  panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
});

// ==================== 5. REAL-TIME AI TOKEN STREAMING (UNLIMITED) ====================
async function sendChatMessageStream(promptText, containerId = 'chat-feed-container') {
  const attachmentsToSend = [...pendingAttachments];
  clearAttachments();

  const finalPrompt = (promptText || '').trim() || (attachmentsToSend.length > 0 ? 'Tolong analisis dan jelaskan lampiran/foto ini secara lengkap.' : '');
  if (!finalPrompt) return;

  // Check mandatory authentication
  if (!currentUser || !sessionToken) {
    showAuthModal();
    showToast('Silakan masuk dengan akun Google untuk menggunakan AI Agent!');
    return;
  }

  const container = document.getElementById(containerId);
  const scrollParent = document.getElementById('gemini-scroll-area') || document.getElementById('view-agent');
  const welcomeHero = document.getElementById('gemini-welcome');

  // Hide welcome greeting once chatting starts (Gemini style)
  if (welcomeHero && containerId === 'chat-feed-container') {
    welcomeHero.style.display = 'none';
  }

  // Render attachment thumbnails inside user message card
  let attachmentsHtml = '';
  if (attachmentsToSend.length > 0) {
    attachmentsHtml = `<div class="chat-message-attachments">` + 
      attachmentsToSend.map(att => {
        if (att.isImage) {
          return `
            <div class="chat-attachment-img-wrap" onclick="openImageLightbox('${att.dataUrl}', '${escapeHTML(att.name)}')">
              <img src="${att.dataUrl}" class="chat-attachment-img" alt="${escapeHTML(att.name)}" title="Klik untuk perbesar">
            </div>
          `;
        } else {
          return `
            <div class="chat-attachment-file-chip">
              <span>📄</span>
              <span>${escapeHTML(att.name)}</span>
              <span style="font-size:0.7rem; color:#a1a1aa;">(${formatBytes(att.size)})</span>
            </div>
          `;
        }
      }).join('') +
    `</div>`;
  }

  // User card (Gemini neat right-aligned bubble)
  const userCard = document.createElement('div');
  userCard.className = 'chat-card user';
  userCard.innerHTML = `
    <div class="chat-header"><span>Anda ${currentTab === 'agent' ? '⚡ (Agent)' : '💬'}</span></div>
    ${attachmentsHtml}
    <div class="chat-body">${escapeHTML(finalPrompt)}</div>
  `;
  container.appendChild(userCard);

  // Agent card with streaming cursor (Gemini clean sparkle layout)
  const agentCard = document.createElement('div');
  agentCard.className = 'chat-card agent';
  agentCard.innerHTML = `
    <div class="chat-header">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:1.15rem; color:#ffffff;">${currentTab === 'agent' ? '⚡' : '✦'}</span>
        <strong style="color:#ffffff; font-size:0.92rem; font-weight:600;">${activeModel.name} ${currentTab === 'agent' ? '(Autonomous Agent)' : ''}</strong>
      </div>
      <span class="stream-status" style="color:#a1a1aa; font-size:0.75rem;">● Streaming...</span>
    </div>
    <div class="chat-body stream-text"><span class="streaming-cursor"></span></div>
  `;
  container.appendChild(agentCard);

  // Scroll to new message
  if (scrollParent) {
    scrollParent.scrollTo({ top: scrollParent.scrollHeight, behavior: 'smooth' });
  }

  const streamBody = agentCard.querySelector('.stream-text');
  let accumulatedText = '';
  let userManuallyScrolled = false;

  // Track if user manually scrolls up during streaming
  const handleUserScroll = () => {
    if (scrollParent) {
      const distanceToBottom = scrollParent.scrollHeight - scrollParent.scrollTop - scrollParent.clientHeight;
      userManuallyScrolled = distanceToBottom > 150;
    }
  };
  if (scrollParent) {
    scrollParent.addEventListener('scroll', handleUserScroll, { passive: true });
  }

  try {
    const isAgent = currentTab === 'agent';
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        message: finalPrompt,
        model: activeModel.name,
        fileContext: isAgent ? { path: currentFile, content: editorTextarea.value } : null,
        mode: currentTab,
        systemPrompt: window.customSystemPrompt || null,
        images: attachmentsToSend.filter(a => a.isImage).map(a => ({
          name: a.name,
          mimeType: a.type,
          base64: a.base64
        })),
        attachedFiles: attachmentsToSend.filter(a => !a.isImage).map(a => ({
          name: a.name,
          content: a.textData || ''
        }))
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const rawLines = buffer.split(/\r?\n/);
      buffer = rawLines.pop() || ''; // keep remainder

      for (let rawLine of rawLines) {
        const trimmed = rawLine.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const payloadStr = trimmed.replace(/^data:\s*/, '').trim();
        if (!payloadStr || payloadStr === '[DONE]') continue;

        try {
          const data = JSON.parse(payloadStr);
          if (data.type === 'auth_required') {
            streamBody.innerHTML = `<span style="color:#ef4444; font-weight:600;">${escapeHTML(data.message)}</span>`;
            agentCard.querySelector('.stream-status').textContent = '🔒 Wajib Login';
            showAuthModal();
            return;
          }
          if (data.type === 'quota_exhausted') {
            streamBody.innerHTML = `<span style="color:#f59e0b; font-weight:700;">${escapeHTML(data.message)}</span>`;
            agentCard.querySelector('.stream-status').textContent = '⚠️ Kuota Habis';
            if (data.user) updateUserState(data.user);
            openPricingModal();
            return;
          }
          if (data.type === 'token_stats') {
            if (data.user) updateUserState(data.user);
            updateTokenTicker(data.stats);
          } else if (data.type === 'token') {
            accumulatedText += data.token;
            streamBody.innerHTML = formatMarkdown(accumulatedText) + '<span class="streaming-cursor"></span>';
            if (data.stats) {
              updateTokenTicker(data.stats);
            }
            if (scrollParent && !userManuallyScrolled) {
              scrollParent.scrollTop = scrollParent.scrollHeight;
            }
          } else if (data.type === 'done') {
            const finalReply = data.fullResponse || accumulatedText;
            streamBody.innerHTML = formatMarkdown(finalReply);
            agentCard.querySelector('.stream-status').textContent = '✓ Selesai';
            agentCard.querySelector('.stream-status').style.color = '#e4e4e7';

            if (data.user) updateUserState(data.user);

            // Show token breakdown
            if (data.tokenBreakdown) {
              const breakdownEl = showTokenBreakdown(data.tokenBreakdown);
              if (breakdownEl) agentCard.appendChild(breakdownEl);
            }

            // Update global stats
            if (data.stats) {
              updateTokenTicker(data.stats);
            }

            // Attach Apply to File button if code is detected
            checkAndAttachApplyButton(agentCard, finalReply);
            if (scrollParent && !userManuallyScrolled) {
              scrollParent.scrollTop = scrollParent.scrollHeight;
            }
          }
        } catch (e) {
          // Ignore partial JSON chunks
        }
      }
    }

    // Safety fallback: if done and status not set
    if (agentCard.querySelector('.stream-status').textContent.includes('Streaming')) {
      streamBody.innerHTML = formatMarkdown(accumulatedText);
      agentCard.querySelector('.stream-status').textContent = '✓ Selesai';
      agentCard.querySelector('.stream-status').style.color = '#e4e4e7';
      checkAndAttachApplyButton(agentCard, accumulatedText);
    }
  } catch (err) {
    streamBody.innerHTML = `<span style="color:#ef4444;">[Error]: ${err.message}</span>`;
  } finally {
    if (scrollParent) {
      scrollParent.removeEventListener('scroll', handleUserScroll);
    }
  }
}

function checkAndAttachApplyButton(card, text) {
  const codeMatches = text.match(/```(?:php|js|javascript)?\n([\s\S]*?)```/);
  if (codeMatches && codeMatches[1]) {
    const actions = document.createElement('div');
    actions.className = 'code-actions';
    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn-small';
    applyBtn.innerHTML = '⚡ Terapkan Langsung ke Editor (' + currentFile + ')';
    applyBtn.addEventListener('click', () => {
      editorTextarea.value = codeMatches[1].trim();
      updateLineNumbers();
      syncToPhoneMirror(editorTextarea.value, currentFile);
      switchNavTab('ide');
      showToast(`Kode berhasil diterapkan ke ${currentFile}!`);
    });
    actions.appendChild(applyBtn);
    card.appendChild(actions);
  }
}

function updateTokenTicker(stats) {
  if (stats) {
    if (stats.totalTokensToday !== undefined) tokenStats.totalTokensToday = stats.totalTokensToday || stats.totalToday || 0;
    if (stats.totalTokensAllTime !== undefined) tokenStats.totalTokensAllTime = stats.totalTokensAllTime || stats.totalAllTime || 0;
    if (stats.inputTokensToday !== undefined) tokenStats.inputTokensToday = stats.inputTokensToday || 0;
    if (stats.outputTokensToday !== undefined) tokenStats.outputTokensToday = stats.outputTokensToday || 0;
    if (stats.requestsToday !== undefined) tokenStats.requestsToday = stats.requestsToday || 0;
    if (stats.requestsAllTime !== undefined) tokenStats.requestsAllTime = stats.requestsAllTime || 0;
    if (stats.inputTokens !== undefined) tokenStats.currentInput = stats.inputTokens || 0;
    if (stats.outputTokens !== undefined) tokenStats.currentOutput = stats.outputTokens || 0;
    if (stats.totalToday !== undefined) tokenStats.totalTokensToday = stats.totalToday;
    if (stats.totalAllTime !== undefined) tokenStats.totalTokensAllTime = stats.totalAllTime;
  }

  const badge = document.getElementById('token-counter-badge');
  if (badge) {
    const fmt = (n) => new Intl.NumberFormat('id-ID').format(n);
    if (currentUser) {
      if (currentUser.isVip || currentUser.tokenBalance === 'UNLIMITED') {
        badge.innerHTML = `<span>👑 VIP UNLIMITED • Bebas Kuota</span>`;
        badge.style.color = '#fbbf24';
        badge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      } else {
        const bal = typeof currentUser.tokenBalance === 'number' ? currentUser.tokenBalance : parseInt(currentUser.tokenBalance, 10) || 0;
        badge.innerHTML = `<span>🪙 Sisa: ${fmt(bal)} Tokens (${currentUser.tierName || 'Free'})</span>`;
        if (bal <= 0) {
          badge.style.color = '#ef4444';
          badge.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        } else {
          badge.style.color = '#34d399';
          badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        }
      }
    } else {
      badge.innerHTML = `<span>🔒 Masuk Google (50.000 Token Gratis)</span>`;
      badge.style.color = '#a1a1aa';
    }
  }
}

// Show detailed token breakdown after each message
function showTokenBreakdown(breakdown) {
  if (!breakdown) return;
  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n);
  const detail = document.createElement('div');
  detail.className = 'token-breakdown';
  detail.style.cssText = 'font-size:0.7rem;color:#6b7280;padding:4px 12px;text-align:right;border-top:1px solid rgba(255,255,255,0.05);';
  detail.innerHTML = `📊 Input: ${fmt(breakdown.input)} • Output: ${fmt(breakdown.output)} • Total: ${fmt(breakdown.total)} tokens`;
  return detail;
}

// ==================== ATTACHMENT & ACTION MENU ENGINE ====================
let pendingAttachments = [];

function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function renderAttachmentPreviews() {
  const container = document.getElementById('attached-files-preview');
  if (!container) return;

  if (pendingAttachments.length === 0) {
    container.innerHTML = '';
    container.classList.remove('has-files');
    return;
  }

  container.classList.add('has-files');
  container.innerHTML = pendingAttachments.map(att => `
    <div class="attachment-chip" id="att-chip-${att.id}">
      ${att.isImage 
        ? `<img src="${att.dataUrl}" class="attachment-thumb" alt="${escapeHTML(att.name)}" onclick="openImageLightbox('${att.dataUrl}', '${escapeHTML(att.name)}')">`
        : `<div class="attachment-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.1rem;">📄</div>`
      }
      <div class="attachment-info">
        <span class="attachment-name" title="${escapeHTML(att.name)}">${escapeHTML(att.name)}</span>
        <span class="attachment-size">${formatBytes(att.size)}</span>
      </div>
      <button type="button" class="attachment-remove" onclick="removeAttachment('${att.id}')" title="Hapus lampiran">✕</button>
    </div>
  `).join('');
}

window.removeAttachment = function(id) {
  pendingAttachments = pendingAttachments.filter(a => a.id !== id);
  renderAttachmentPreviews();
};

function clearAttachments() {
  pendingAttachments = [];
  renderAttachmentPreviews();
  const f1 = document.getElementById('chat-file-input');
  const f2 = document.getElementById('chat-photo-input');
  if (f1) f1.value = '';
  if (f2) f2.value = '';
}

async function handleFilesSelected(fileList) {
  if (!fileList || fileList.length === 0) return;

  for (const file of Array.from(fileList)) {
    if (file.size > 25 * 1024 * 1024) {
      showToast(`File ${file.name} terlalu besar (maks 25MB)!`);
      continue;
    }

    const isImage = file.type.startsWith('image/');
    const id = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    try {
      if (isImage) {
        const dataUrl = await readFileAsDataURL(file);
        const base64 = dataUrl.split(',')[1] || '';
        pendingAttachments.push({
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type || 'image/jpeg',
          isImage: true,
          dataUrl,
          base64
        });
        showToast(`📷 Foto ${file.name} berhasil dilampirkan!`);
      } else {
        const isText = file.type.startsWith('text/') || /\.(js|json|html|css|py|php|md|txt|sql|csv|ts)$/i.test(file.name);
        let textData = '';
        if (isText) {
          textData = await readFileAsText(file);
        }
        const dataUrl = await readFileAsDataURL(file);
        pendingAttachments.push({
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          isImage: false,
          dataUrl,
          textData
        });
        showToast(`📄 File ${file.name} berhasil dilampirkan!`);
      }
    } catch (err) {
      console.error('File read error:', err);
      showToast(`Gagal membaca file ${file.name}`);
    }
  }

  renderAttachmentPreviews();
  closeAttachMenu();
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function toggleAttachMenu() {
  const menu = document.getElementById('attach-dropdown-menu');
  const btn = document.getElementById('gemini-attach-btn');
  if (!menu) return;
  const isOpen = menu.classList.contains('show');
  if (isOpen) {
    closeAttachMenu();
  } else {
    menu.classList.add('show');
    if (btn) btn.classList.add('active');
  }
}

function closeAttachMenu() {
  const menu = document.getElementById('attach-dropdown-menu');
  const btn = document.getElementById('gemini-attach-btn');
  if (menu) menu.classList.remove('show');
  if (btn) btn.classList.remove('active');
}

// Lightbox modal functions
window.openImageLightbox = function(url, caption = '') {
  const modal = document.getElementById('image-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  if (modal && img) {
    img.src = url;
    if (cap) cap.textContent = caption;
    modal.classList.add('active');
  }
};

window.closeImageLightbox = function() {
  const modal = document.getElementById('image-lightbox-modal');
  if (modal) modal.classList.remove('active');
};

// Hero Chat Actions
const heroChatInput = document.getElementById('hero-chat-input');
const heroSendBtn = document.getElementById('hero-send-btn');
const geminiAttachBtn = document.getElementById('gemini-attach-btn');
const chatFileInput = document.getElementById('chat-file-input');
const chatPhotoInput = document.getElementById('chat-photo-input');
const scrollToSearchBtn = document.getElementById('scroll-to-search-btn');
const geminiScrollArea = document.getElementById('gemini-scroll-area');

// Plus Attachment Button Click
if (geminiAttachBtn) {
  geminiAttachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAttachMenu();
  });
}

// Close attach menu when clicking outside
document.addEventListener('click', (e) => {
  const container = document.getElementById('attach-menu-container');
  if (container && !container.contains(e.target)) {
    closeAttachMenu();
  }
});

// Action Menu Item Handlers (Matching user screenshot)
const menuUploadFile = document.getElementById('menu-upload-file');
const menuUploadPhoto = document.getElementById('menu-upload-photo');
const menuUploadDrive = document.getElementById('menu-upload-drive');
const menuCreateImage = document.getElementById('menu-create-image');
const menuCreateVideo = document.getElementById('menu-create-video');
const menuCreateMusic = document.getElementById('menu-create-music');
const menuCanvas = document.getElementById('menu-canvas');
const menuDeepResearch = document.getElementById('menu-deep-research');
const menuGuidedLearning = document.getElementById('menu-guided-learning');
const personalIntelToggle = document.getElementById('personal-intel-toggle');

if (menuUploadFile && chatFileInput) {
  menuUploadFile.addEventListener('click', () => {
    chatFileInput.click();
  });
}

if (menuUploadPhoto && chatPhotoInput) {
  menuUploadPhoto.addEventListener('click', () => {
    chatPhotoInput.click();
  });
}

if (chatFileInput) {
  chatFileInput.addEventListener('change', (e) => {
    handleFilesSelected(e.target.files);
  });
}

if (chatPhotoInput) {
  chatPhotoInput.addEventListener('change', (e) => {
    handleFilesSelected(e.target.files);
  });
}

if (menuUploadDrive) {
  menuUploadDrive.addEventListener('click', () => {
    closeAttachMenu();
    const driveUrl = prompt('Masukkan tautan Google Drive / Docs atau Cloud URL publik:');
    if (driveUrl && driveUrl.trim()) {
      heroChatInput.value = (heroChatInput.value ? heroChatInput.value + '\n\n' : '') + `[Konteks Google Drive: ${driveUrl.trim()}] Tolong baca dan analisis dokumen ini.`;
      heroChatInput.focus();
      showToast('☁️ Tautan Google Drive ditambahkan ke percakapan!');
    }
  });
}

if (menuCreateImage) {
  menuCreateImage.addEventListener('click', () => {
    closeAttachMenu();
    heroChatInput.value = 'Buatkan prompt gambar visual berkualitas tinggi bertema: ';
    heroChatInput.focus();
    showToast('🎨 Mode Buat Gambar AI diaktifkan!');
  });
}

if (menuCreateVideo) {
  menuCreateVideo.addEventListener('click', () => {
    closeAttachMenu();
    showToast('🔒 Fitur Buat Video AI (Sora / Veo 2) eksklusif untuk paket VIP Unlimited!');
    openPricingModal();
  });
}

if (menuCreateMusic) {
  menuCreateMusic.addEventListener('click', () => {
    closeAttachMenu();
    heroChatInput.value = 'Buatkan struktur komposisi dan prompt musik AI bertema: ';
    heroChatInput.focus();
    showToast('🎵 Mode Buat Musik AI diaktifkan!');
  });
}

if (menuCanvas) {
  menuCanvas.addEventListener('click', () => {
    closeAttachMenu();
    switchTab('ide');
    showToast('🎨 Beralih ke Canvas IDE Multi-File Code Editor!');
  });
}

if (menuDeepResearch) {
  menuDeepResearch.addEventListener('click', () => {
    closeAttachMenu();
    heroChatInput.value = '[Deep Research Autonomous] Lakukan riset mendalam secara komprehensif mengenai: ';
    heroChatInput.focus();
    showToast('⚛ Mode Deep Research diaktifkan: AI akan menganalisis secara mendalam!');
  });
}

if (menuGuidedLearning) {
  menuGuidedLearning.addEventListener('click', () => {
    closeAttachMenu();
    heroChatInput.value = 'Bimbing saya langkah demi langkah secara terpandu untuk memahami: ';
    heroChatInput.focus();
    showToast('📖 Mode Pembelajaran Terpandu diaktifkan!');
  });
}

if (personalIntelToggle) {
  // Load saved state
  const savedIntel = localStorage.getItem('jz_personal_intel');
  if (savedIntel !== null) {
    personalIntelToggle.checked = savedIntel === 'true';
  }
  personalIntelToggle.addEventListener('change', (e) => {
    localStorage.setItem('jz_personal_intel', e.target.checked);
    showToast(e.target.checked ? '✨ Kecerdasan Personal (Labs) diaktifkan!' : 'Kecerdasan Personal dinonaktifkan.');
  });
}

// Paste Image from Clipboard Support (Ctrl+V)
document.addEventListener('paste', (e) => {
  const items = (e.clipboardData || e.originalEvent.clipboardData)?.items;
  if (!items) return;
  const files = [];
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }
  if (files.length > 0) {
    e.preventDefault();
    handleFilesSelected(files);
    showToast('📋 Gambar dari clipboard berhasil ditempel!');
  }
});

// Drag and drop support
const dropZone = document.querySelector('.gemini-bottom-bar');
if (dropZone) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#38bdf8';
  });
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  });
}

// Auto-expand textarea as user types (Gemini style)
if (heroChatInput) {
  heroChatInput.addEventListener('input', () => {
    heroChatInput.style.height = 'auto';
    heroChatInput.style.height = Math.min(heroChatInput.scrollHeight, 180) + 'px';
  });
}

// Show/hide floating scroll button
if (geminiScrollArea && scrollToSearchBtn) {
  geminiScrollArea.addEventListener('scroll', () => {
    const distanceFromBottom = geminiScrollArea.scrollHeight - geminiScrollArea.scrollTop - geminiScrollArea.clientHeight;
    if (distanceFromBottom > 240) {
      scrollToSearchBtn.classList.add('visible');
    } else {
      scrollToSearchBtn.classList.remove('visible');
    }
  }, { passive: true });

  scrollToSearchBtn.addEventListener('click', () => {
    geminiScrollArea.scrollTo({ top: geminiScrollArea.scrollHeight, behavior: 'smooth' });
  });
}

// Quick Prompt Cards Click (Gemini Suggestions)
document.querySelectorAll('.gemini-card').forEach(card => {
  card.addEventListener('click', () => {
    const prompt = card.dataset.prompt;
    if (prompt) {
      sendChatMessageStream(prompt, 'chat-feed-container');
    }
  });
});

heroSendBtn.addEventListener('click', () => {
  const text = heroChatInput.value;
  heroChatInput.value = '';
  heroChatInput.style.height = 'auto';
  sendChatMessageStream(text, 'chat-feed-container');
});

heroChatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    heroSendBtn.click();
  }
});

// Quick command pills
document.querySelectorAll('.command-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const cmd = pill.dataset.cmd;
    heroChatInput.value = cmd + ' ';
    heroChatInput.focus();
  });
});

// Embedded IDE Agent Actions
const ideAgentPrompt = document.getElementById('ide-agent-prompt');
const ideAgentSend = document.getElementById('ide-agent-send');

ideAgentSend.addEventListener('click', () => {
  const text = ideAgentPrompt.value;
  ideAgentPrompt.value = '';
  sendChatMessageStream(text, 'ide-agent-messages');
});

document.getElementById('ide-quick-refactor').addEventListener('click', () => {
  sendChatMessageStream('/refactor optimize functions and strict types', 'ide-agent-messages');
});

// ==================== 6. AI MODELS MODAL & SWITCHER ====================
function openModelsModal() {
  renderModelsCatalog();
  document.getElementById('models-modal-overlay').classList.add('active');
}

function closeModelsModal() {
  document.getElementById('models-modal-overlay').classList.remove('active');
}

document.getElementById('open-models-btn').addEventListener('click', openModelsModal);
document.getElementById('close-models-btn').addEventListener('click', closeModelsModal);
document.getElementById('models-modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'models-modal-overlay') closeModelsModal();
});

function renderModelsCatalog() {
  const container = document.getElementById('models-catalog-container');
  container.innerHTML = '';

  for (const [family, data] of Object.entries(MODEL_CATALOG)) {
    const card = document.createElement('div');
    card.className = 'family-card';

    const header = document.createElement('div');
    header.className = 'family-title';
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        ${data.iconSvg}
        <span style="font-weight:700; color:#ffffff; font-size:0.92rem;">${data.provider || family}</span>
      </div>
      <span style="font-size:0.72rem; color:#a1a1aa; font-weight:normal;">Genuine AI</span>
    `;
    card.appendChild(header);

    data.models.forEach(modName => {
      const item = document.createElement('div');
      item.className = 'model-item' + (activeModel.name === modName ? ' active' : '');
      item.innerHTML = `
        <span class="model-dot"></span>
        <span style="flex:1; font-weight:500;">${modName}</span>
        <span style="font-size:0.68rem; color:#34d399; background:rgba(16,185,129,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(16,185,129,0.25);">✓ Asli</span>
      `;

      item.addEventListener('click', () => {
        selectModel(family, modName);
      });
      card.appendChild(item);
    });

    container.appendChild(card);
  }
}

async function selectModel(family, name) {
  activeModel = { family, name };
  document.getElementById('active-model-label').textContent = name;
  const iconContainer = document.getElementById('active-model-icon');
  if (iconContainer && MODEL_CATALOG[family]) {
    iconContainer.innerHTML = MODEL_CATALOG[family].iconSvg;
  }
  document.getElementById('agent-mini-model').textContent = name;
  closeModelsModal();
  showToast(`Engine real-time dialihkan ke: ${name}`);

  try {
    await fetch('/api/set-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family, name }),
    });
  } catch (e) {
    console.error('Model switch error:', e);
  }
}

// ==================== 7. API KEYS CONFIGURATION MODAL ====================
function openApiModal() {
  document.getElementById('api-modal-overlay').classList.add('active');
  loadApiKeyStatus(); // Load current status when opening
}

function closeApiModal() {
  document.getElementById('api-modal-overlay').classList.remove('active');
}

async function loadApiKeyStatus() {
  try {
    const res = await fetch('/api/ai/key-status');
    const data = await res.json();
    
    const statusBox = document.getElementById('api-key-status-box');
    if (!statusBox) return;

    if (data.anyKeyConfigured) {
      const providers = [];
      if (data.gemini) providers.push('Google Gemini ✅');
      if (data.openrouter) providers.push('OpenRouter ✅');
      if (data.anthropic) providers.push('Anthropic ✅');
      if (data.openai) providers.push('OpenAI ✅');
      if (data.deepseek) providers.push('DeepSeek ✅');
      
      statusBox.style.background = 'rgba(16,185,129,0.1)';
      statusBox.style.borderColor = 'rgba(16,185,129,0.4)';
      statusBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="font-size:1.1rem;">✅</span>
          <strong style="color:#34d399; font-size:0.9rem;">REAL AI Engine ACTIVE — Terhubung Langsung</strong>
        </div>
        <p style="font-size:0.8rem; color:#cbd5e1; margin:0;">
          Provider aktif: ${providers.join(' | ')}<br>
          Streaming real-time tanpa batas aktif!
        </p>
      `;
    } else {
      statusBox.style.background = 'rgba(239,68,68,0.1)';
      statusBox.style.borderColor = 'rgba(239,68,68,0.4)';
      statusBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="font-size:1.1rem;">⚠️</span>
          <strong style="color:#f87171; font-size:0.9rem;">Belum Ada API Key Terhubung</strong>
        </div>
        <p style="font-size:0.8rem; color:#cbd5e1; margin:0;">
          Masukkan API Key di bawah (bisa gratis di Google AI Studio atau OpenRouter) untuk menghubungkan web ini ke Real AI (Gemini, Claude, GPT, DeepSeek).
        </p>
      `;
    }

    // Fill in masked keys if available
    if (data.maskedKeys) {
      if (data.maskedKeys.gemini && document.getElementById('input-gemini-key')) document.getElementById('input-gemini-key').placeholder = `Tersimpan: ${data.maskedKeys.gemini}`;
      if (data.maskedKeys.openrouter) document.getElementById('input-openrouter-key').placeholder = `Tersimpan: ${data.maskedKeys.openrouter}`;
      if (data.maskedKeys.openai) document.getElementById('input-openai-key').placeholder = `Tersimpan: ${data.maskedKeys.openai}`;
      if (data.maskedKeys.anthropic) document.getElementById('input-anthropic-key').placeholder = `Tersimpan: ${data.maskedKeys.anthropic}`;
      if (data.maskedKeys.deepseek) document.getElementById('input-deepseek-key').placeholder = `Tersimpan: ${data.maskedKeys.deepseek}`;
      if (data.maskedKeys.ollamaUrl) document.getElementById('input-ollama-url').value = data.maskedKeys.ollamaUrl;
    }
  } catch (e) {
    console.error('Failed to load key status:', e);
  }
}

document.getElementById('open-api-keys-btn')?.addEventListener('click', openApiModal);
document.getElementById('admin-open-api-keys-btn')?.addEventListener('click', () => {
  closeAdminPortal();
  openApiModal();
});
document.getElementById('close-api-btn').addEventListener('click', closeApiModal);
document.getElementById('api-modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'api-modal-overlay') closeApiModal();
});

document.getElementById('save-api-keys-btn').addEventListener('click', async () => {
  const payload = {};
  // Only send fields that have actual values (not placeholder text)
  const gmKey = document.getElementById('input-gemini-key')?.value.trim();
  const orKey = document.getElementById('input-openrouter-key').value.trim();
  const oaKey = document.getElementById('input-openai-key').value.trim();
  const anKey = document.getElementById('input-anthropic-key').value.trim();
  const dsKey = document.getElementById('input-deepseek-key').value.trim();
  const olUrl = document.getElementById('input-ollama-url').value.trim();

  if (gmKey) payload.gemini = gmKey;
  if (orKey) payload.openrouter = orKey;
  if (oaKey) payload.openai = oaKey;
  if (anKey) payload.anthropic = anKey;
  if (dsKey) payload.deepseek = dsKey;
  if (olUrl) payload.ollamaUrl = olUrl;
  
  // Ollama model selection
  const olModel = document.getElementById('input-ollama-model')?.value?.trim();
  if (olModel) payload.ollamaModel = olModel;

  if (Object.keys(payload).length === 0) {
    showToast('Masukkan minimal satu API key!');
    return;
  }

  try {
    const res = await fetch('/api/ai/configure-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    
    // Clear input fields after saving
    if (document.getElementById('input-gemini-key')) document.getElementById('input-gemini-key').value = '';
    document.getElementById('input-openrouter-key').value = '';
    document.getElementById('input-openai-key').value = '';
    document.getElementById('input-anthropic-key').value = '';
    document.getElementById('input-deepseek-key').value = '';
    
    // Refresh status display
    await loadApiKeyStatus();
    
    showToast('✅ API Key tersimpan & Real AI AKTIF!');
  } catch (e) {
    showToast(`Error: ${e.message}`);
  }
});

// ==================== 8. ECOSYSTEM VIEWS (MCP & SKILLS) ====================
async function loadMcpView() {
  try {
    const res = await fetch('/api/mcp/servers');
    const data = await res.json();
    const container = document.getElementById('mcp-servers-grid');
    container.innerHTML = '';

    data.servers.forEach(srv => {
      const card = document.createElement('div');
      card.className = 'family-card';
      card.innerHTML = `
        <div class="family-title">
          <span>${srv.name}</span>
          <span style="color:#10b981; font-size:0.75rem;">● ${srv.status}</span>
        </div>
        <div style="font-size:0.75rem; color:#94a3b8;">Transport: <code>${srv.transport}</code></div>
        <div style="margin-top:8px; font-size:0.78rem;">
          <strong style="color:#cbd5e1;">Available Tools (${srv.tools.length}):</strong>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
            ${srv.tools.map(t => `<span class="command-pill">${t}</span>`).join('')}
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    console.error('MCP view load error:', e);
  }
}

async function loadSkillsView() {
  try {
    const res = await fetch('/api/mcp/servers');
    const data = await res.json();
    const container = document.getElementById('skills-grid');
    container.innerHTML = '';

    data.skills.forEach(skill => {
      const card = document.createElement('div');
      card.className = 'family-card';
      card.innerHTML = `
        <div class="family-title">
          <span>${skill.name}</span>
          <span style="color:#38bdf8;">⚡ Skill</span>
        </div>
        <p style="font-size:0.82rem; color:#94a3b8; line-height:1.4;">${skill.description}</p>
        <div style="margin-top:10px;">
          <button class="btn-small" onclick="showToast('Skill ${skill.name} siap digunakan.')">Aktivasi Otomatis</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    console.error('Skills load error:', e);
  }
}

// ==================== 9. MOBILE MIRROR & QR GENERATOR ====================
let currentMobilePlatform = 'android';

function selectMobilePlatform(platform) {
  currentMobilePlatform = platform;
  const androidBox = document.getElementById('platform-android');
  const iosBox = document.getElementById('platform-ios');
  const titleEl = document.getElementById('platform-banner-title');
  const descEl = document.getElementById('platform-banner-desc');
  const btnIcon = document.getElementById('btn-action-icon');
  const btnLabel = document.getElementById('btn-action-label');

  if (platform === 'android') {
    if (androidBox) androidBox.classList.add('active');
    if (iosBox) iosBox.classList.remove('active');
    if (titleEl) titleEl.innerHTML = '🤖 Android Native Companion';
    if (descEl) descEl.innerHTML = 'Buka link di <strong>Google Chrome</strong> pada HP Android Anda, lalu tekan menu titik tiga <strong>(⋮)</strong> &gt; pilih <strong>"Install Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong> untuk mengaktifkan mode APK native.';
    if (btnIcon) btnIcon.textContent = '📥';
    if (btnLabel) btnLabel.textContent = 'Unduh .APK Launcher';
  } else {
    if (iosBox) iosBox.classList.add('active');
    if (androidBox) androidBox.classList.remove('active');
    if (titleEl) titleEl.innerHTML = '🍎 Apple iOS Safari Companion';
    if (descEl) descEl.innerHTML = 'Buka link menggunakan <strong>Safari</strong> di iPhone Anda, tekan tombol <strong>Share (ikon kotak panah atas)</strong> &gt; pilih <strong>"Add to Home Screen"</strong> untuk menjadikannya aplikasi native iOS tanpa bar browser.';
    if (btnIcon) btnIcon.textContent = '🍎';
    if (btnLabel) btnLabel.textContent = 'Panduan Install iPhone';
  }
}

function copyMobileUrl() {
  const mobileUrl = `http://${localIP}:${serverPort}/mobile`;
  navigator.clipboard.writeText(mobileUrl).then(() => {
    showToast(`✅ Link berhasil disalin: ${mobileUrl}`);
  }).catch(() => {
    prompt('Salin link ini untuk dibuka di HP:', mobileUrl);
  });
}

async function setupMobileMirror() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    localIP = data.localIP || 'localhost';
    serverPort = data.port || 3333;

    if (data.tokenEngine) {
      updateTokenTicker(data.tokenEngine);
    }

    const mobileUrl = `http://${localIP}:${serverPort}/mobile`;
    const urlDisplay = document.getElementById('mobile-url-display');
    if (urlDisplay) urlDisplay.textContent = mobileUrl;
    
    const lanDisplay = document.getElementById('lan-ip-display');
    if (lanDisplay) lanDisplay.textContent = `${localIP}:${serverPort}`;

    const qrImg = document.getElementById('mirror-qr-img');
    if (qrImg) {
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mobileUrl)}`;
      qrImg.src = qrApi;
      qrImg.onerror = () => {
        qrImg.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="25" height="25" fill="black"/><rect x="65" y="10" width="25" height="25" fill="black"/><rect x="10" y="65" width="25" height="25" fill="black"/><rect x="40" y="40" width="20" height="20" fill="black"/><text x="50" y="95" font-size="8" text-anchor="middle" fill="%23666">JZAGENTIC QR</text></svg>`;
      };
    }
  } catch (e) {
    console.error('Failed to init mobile mirror:', e);
  }
}

document.getElementById('download-apk-btn').addEventListener('click', () => {
  const mobileUrl = `http://${localIP}:${serverPort}/mobile`;
  if (currentMobilePlatform === 'android') {
    // Generate an installable Android APK web launcher
    const launcherHtml = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${mobileUrl}"><script>window.location.href="${mobileUrl}";</script></head><body>Mengalihkan ke JZAGENTIC Mobile Companion...</body></html>`;
    const blob = new Blob([launcherHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jzagentic-android-launcher.html';
    a.click();
    showToast('Launcher Android diunduh! Buka file ini di HP Android Anda.');
  } else {
    // iPhone guide
    showToast('Di iPhone: Buka Safari > Ketik link di bawah > Tap Share > "Add to Home Screen"');
    copyMobileUrl();
  }
});

document.getElementById('scan-qr-btn').addEventListener('click', () => {
  const mobileUrl = `http://${localIP}:${serverPort}/mobile`;
  showToast(`Membuka Mobile Companion: ${mobileUrl}`);
  window.open(mobileUrl, '_blank', 'width=390,height=800,menubar=no,toolbar=no');
});

// Real-Time SSE Listener
function initSSE() {
  const evtSource = new EventSource('/api/mobile/events');
  evtSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'file_updated') {
        syncToPhoneMirror(data.content, data.path);
      }
      if (data.type === 'new_chat') {
        // If chat happened from mobile, show a toast or mirror on phone frame
        const phoneDot = document.getElementById('phone-status-dot');
        if (phoneDot) {
          phoneDot.textContent = '● Chat Syncing...';
          setTimeout(() => { phoneDot.textContent = '● Live Sync (Unlimited)'; }, 3000);
        }
      }
    } catch (e) {}
  };
}

// ==================== 10. UTILITIES ====================
function showToast(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function formatMarkdown(text) {
  if (!text) return '';
  // Handle code blocks safely
  const parts = text.split(/(```[\s\S]*?(?:```|$))/g);
  return parts.map(part => {
    if (part.startsWith('```')) {
      let code = part.replace(/^```[a-zA-Z0-9_-]*\r?\n?/, '');
      code = code.replace(/```$/, '');
      return `<pre class="code-block"><code>${escapeHTML(code)}</code></pre>`;
    }
    // Markdown prose (Gemini Minimalist Black & White)
    return escapeHTML(part)
      .replace(/## (.*?)(?:\r?\n|$)/g, '<h2 style="color:#ffffff; margin:18px 0 10px 0; font-size:1.2rem; font-weight:700; border-bottom:1px solid #242429; padding-bottom:6px;">$1</h2>')
      .replace(/### (.*?)(?:\r?\n|$)/g, '<h3 style="color:#f4f4f6; margin:14px 0 8px 0; font-size:1.05rem; font-weight:600;">$1</h3>')
      .replace(/#### (.*?)(?:\r?\n|$)/g, '<h4 style="color:#e4e4e7; margin:10px 0 6px 0; font-size:0.95rem; font-weight:600;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color:#d4d4d8;">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="command-pill" style="color:#ffffff; background:#18181c; border-color:#2a2a30;">$1</code>')
      .replace(/\n/g, '<br>');
  }).join('');
}

// ==================== 10. AUTH & MONETIZATION (GOOGLE OAUTH & PRICING) ====================
const authModalOverlay = document.getElementById('auth-modal-overlay');
const pricingModalOverlay = document.getElementById('pricing-modal-overlay');
const closePricingBtn = document.getElementById('close-pricing-btn');
const openPricingBtn = document.getElementById('open-pricing-btn');
const tokenCounterBadge = document.getElementById('token-counter-badge');

function showAuthModal() {
  if (authModalOverlay) {
    authModalOverlay.classList.add('active');
    renderGoogleButton();
  }
}

function hideAuthModal() {
  if (authModalOverlay) authModalOverlay.classList.remove('active');
}

function openPricingModal() {
  if (pricingModalOverlay) {
    pricingModalOverlay.classList.add('active');
    renderPricingPlans();
    updatePricingUserBanner();
  }
}

function closePricingModal() {
  if (pricingModalOverlay) pricingModalOverlay.classList.remove('active');
}

if (openPricingBtn) openPricingBtn.addEventListener('click', openPricingModal);
if (closePricingBtn) closePricingBtn.addEventListener('click', closePricingModal);
if (tokenCounterBadge) tokenCounterBadge.addEventListener('click', openPricingModal);

function saveUserWallet(user) {
  if (!user || !user.email) return;
  try {
    const normEmail = user.email.toLowerCase().trim();
    const wallet = {
      email: normEmail,
      tokenBalance: user.tokenBalance,
      tokensUsed: user.tokensUsed || 0,
      tier: user.tier || 'free',
      tierName: user.tierName || 'Free Starter',
      isVip: Boolean(user.isVip),
      updatedAt: Date.now(),
    };
    localStorage.setItem('jz_wallet_' + normEmail, JSON.stringify(wallet));
    localStorage.setItem('jz_last_email', normEmail);
  } catch (e) {}
}

function getCachedUserWallet(email = null) {
  try {
    const targetEmail = (email || localStorage.getItem('jz_last_email') || '').toLowerCase().trim();
    if (targetEmail) {
      const raw = localStorage.getItem('jz_wallet_' + targetEmail);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.tokenBalance === 'number') {
          return parsed;
        }
      }
    }

    // Fallback: check any stored wallet in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('jz_wallet_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.tokenBalance === 'number') {
            return parsed;
          }
        }
      }
    }
  } catch (e) {}
  return null;
}

function updateUserState(user) {
  if (!user) return;
  currentUser = user;
  saveUserWallet(currentUser);
  renderUserNavbar(currentUser);
  updateTokenTicker();
  updatePricingUserBanner();
}

function updatePricingUserBanner() {
  const emailEl = document.getElementById('pricing-user-email');
  const balanceEl = document.getElementById('pricing-user-balance');
  const tierEl = document.getElementById('pricing-user-tier');
  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n);

  if (currentUser) {
    if (emailEl) emailEl.textContent = currentUser.email;
    if (balanceEl) {
      balanceEl.textContent = (currentUser.isVip || currentUser.tokenBalance === 'UNLIMITED')
        ? '👑 UNLIMITED VIP'
        : `${fmt(currentUser.tokenBalance)} Token`;
    }
    if (tierEl) tierEl.textContent = currentUser.tierName || 'Free Starter';
  } else {
    if (emailEl) emailEl.textContent = 'Belum Masuk';
    if (balanceEl) balanceEl.textContent = '0 Token';
    if (tierEl) tierEl.textContent = 'Tamu';
  }
}

function renderUserNavbar(user) {
  const container = document.getElementById('auth-nav-container');
  if (!container) return;

  if (user) {
    container.innerHTML = `
      <div class="user-profile-chip" id="user-chip-btn" title="Klik untuk Info Akun / Keluar">
        <img class="user-avatar-img" src="${user.picture || 'https://www.gravatar.com/avatar/?d=mp'}" alt="${user.name}" onerror="this.src='https://www.gravatar.com/avatar/?d=mp'">
        <span class="user-chip-name">${escapeHTML(user.name.split(' ')[0])}</span>
        <span style="font-size:0.65rem; color:#a1a1aa;">▼</span>
      </div>
    `;

    document.getElementById('user-chip-btn')?.addEventListener('click', () => {
      const wantLogout = confirm(`Akun: ${user.name} (${user.email})\nPaket: ${user.tierName}\nSisa Token: ${user.tokenBalance}\n\nApakah Anda ingin keluar (Logout)?`);
      if (wantLogout) logout();
    });
  } else {
    container.innerHTML = `
      <button class="google-login-nav-btn" id="nav-login-btn">
        <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/></svg>
        <span>Masuk</span>
      </button>
    `;
    document.getElementById('nav-login-btn')?.addEventListener('click', showAuthModal);
  }
}

function logout() {
  localStorage.removeItem('jz_session_token');
  currentUser = null;
  sessionToken = null;
  renderUserNavbar(null);
  updateTokenTicker();
  showToast('Anda telah keluar dari akun JZAGENTIC.');
  showAuthModal();
}

async function renderPricingPlans() {
  const container = document.getElementById('pricing-cards-container');
  if (!container) return;

  try {
    if (availablePlans.length === 0) {
      const res = await fetch('/api/plans');
      const data = await res.json();
      availablePlans = data.plans || [];
      if (data.whatsappAdmin) whatsappAdminNumber = data.whatsappAdmin;
    }

    container.innerHTML = availablePlans.map(plan => {
      const isCurrent = currentUser && currentUser.tier === plan.id;
      const isFeatured = plan.id === 'pro';
      return `
        <div class="pricing-card ${isFeatured ? 'featured' : ''} ${isCurrent ? 'active-user-tier' : ''}">
          <span class="pricing-badge-tag" style="${isCurrent ? 'background:rgba(16,185,129,0.2); color:#34d399;' : isFeatured ? 'background:rgba(245,158,11,0.2); color:#fbbf24;' : 'background:rgba(255,255,255,0.08); color:#a1a1aa;'}">
            ${isCurrent ? 'AKTIF' : plan.badge}
          </span>
          <div style="font-size:1.05rem; font-weight:800; color:#ffffff; margin-bottom:4px;">${plan.name}</div>
          <div style="font-size:1.25rem; font-weight:800; color:${isFeatured ? '#f59e0b' : '#34d399'}; margin-bottom:4px;">${plan.priceLabel}</div>
          <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:12px;">${plan.tokens}</div>
          
          <ul style="list-style:none; padding:0; margin:0 0 16px 0; font-size:0.74rem; color:#cbd5e1; display:flex; flex-direction:column; gap:6px;">
            ${plan.features.map(f => `<li style="display:flex; align-items:center; gap:6px;"><span style="color:#34d399;">✓</span> ${f}</li>`).join('')}
          </ul>

          <button class="pricing-btn-action" style="${isCurrent ? 'background:#27272a; color:#a1a1aa; cursor:default;' : isFeatured ? 'background:#f59e0b; color:#000000;' : 'background:#ffffff; color:#000000;'}" data-plan-id="${plan.id}" ${isCurrent ? 'disabled' : ''}>
            ${isCurrent ? 'Paket Aktif' : plan.priceRp === 0 ? 'Mulai Gratis' : 'Beli Sekarang ⚡'}
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.pricing-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.getAttribute('data-plan-id');
        const plan = availablePlans.find(p => p.id === planId);
        if (plan) checkoutPlan(plan);
      });
    });

    const waBtn = document.getElementById('pricing-whatsapp-btn');
    if (waBtn) {
      waBtn.onclick = () => {
        const text = `Halo Admin JZAGENTIC, saya ingin upgrade akun:\n- Email: ${currentUser ? currentUser.email : 'Belum Login'}\n- Mohon kirimkan QRIS / Nomor Rekening untuk aktivasi VIP instan.`;
        window.open(`https://wa.me/${whatsappAdminNumber}?text=${encodeURIComponent(text)}`, '_blank');
      };
    }
  } catch (e) {
    console.error('Error rendering pricing:', e);
  }
}

// ==================== QRIS CHECKOUT & ADMIN PORTAL ====================
const qrisModalOverlay = document.getElementById('qris-modal-overlay');
const closeQrisBtn = document.getElementById('close-qris-btn');
const adminModalOverlay = document.getElementById('admin-modal-overlay');
const closeAdminBtn = document.getElementById('close-admin-btn');
const openAdminPortalBtn = document.getElementById('open-admin-portal-btn');
let currentAdminSecret = '';

function closeQrisModal() {
  if (qrisModalOverlay) qrisModalOverlay.classList.remove('active');
}
if (closeQrisBtn) closeQrisBtn.addEventListener('click', closeQrisModal);

async function checkoutPlan(plan) {
  if (plan.priceRp === 0) {
    if (!currentUser) showAuthModal();
    else closePricingModal();
    return;
  }
  closePricingModal();
  openQrisModal(plan);
}

async function openQrisModal(plan) {
  if (!qrisModalOverlay) return;

  const orderId = 'JZ' + Math.floor(10000 + Math.random() * 90000);
  const userEmail = currentUser ? currentUser.email : 'Tamu (Belum Login)';

  document.getElementById('qris-package-name').textContent = `${plan.name} (${plan.tokens})`;
  document.getElementById('qris-total-price').textContent = plan.priceLabel;

  // Fetch latest payment settings
  let paySettings = {
    whatsappAdmin: whatsappAdminNumber,
    bankName: 'BCA / Dana',
    bankAccount: 'Hubungi Admin via WA',
    bankHolder: 'JZAGENTIC Official',
    qrisImageUrl: '',
    qrisNote: 'Scan barcode QRIS dengan BCA, GoPay, OVO, Dana, ShopeePay, atau m-Banking Anda.',
  };

  try {
    const res = await fetch('/api/payment/settings');
    const data = await res.json();
    paySettings = { ...paySettings, ...data };
  } catch (e) {}

  // Update bank info
  const bankInfoEl = document.getElementById('qris-bank-info');
  const holderInfoEl = document.getElementById('qris-holder-info');
  if (bankInfoEl) bankInfoEl.textContent = `${paySettings.bankName}: ${paySettings.bankAccount}`;
  if (holderInfoEl) holderInfoEl.textContent = `a.n ${paySettings.bankHolder}`;

  // Copy button
  const copyBtn = document.getElementById('copy-bank-btn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(paySettings.bankAccount);
      showToast('Nomor rekening/HP berhasil disalin!');
    };
  }

  // Render QRIS (Image if set, else SVG QRIS placeholder)
  const qrisSlot = document.getElementById('qris-image-slot');
  if (qrisSlot) {
    if (paySettings.qrisImageUrl) {
      qrisSlot.innerHTML = `<img src="${paySettings.qrisImageUrl}" alt="QRIS ${paySettings.bankHolder}" style="width:100%; height:100%; object-fit:contain; border-radius:6px; cursor:pointer;" title="Klik untuk perbesar QRIS" onclick="window.open('${paySettings.qrisImageUrl}', '_blank')">`;
    } else {
      // Dynamic SVG QRIS Code with JZ Logo in center
      qrisSlot.innerHTML = `
        <svg viewBox="0 0 100 100" width="160" height="160" style="background:#ffffff; border-radius:4px;">
          <!-- Corner Markers -->
          <rect x="5" y="5" width="26" height="26" fill="#000000" rx="3"/>
          <rect x="9" y="9" width="18" height="18" fill="#ffffff" rx="2"/>
          <rect x="13" y="13" width="10" height="10" fill="#000000" rx="1"/>

          <rect x="69" y="5" width="26" height="26" fill="#000000" rx="3"/>
          <rect x="73" y="9" width="18" height="18" fill="#ffffff" rx="2"/>
          <rect x="77" y="13" width="10" height="10" fill="#000000" rx="1"/>

          <rect x="5" y="69" width="26" height="26" fill="#000000" rx="3"/>
          <rect x="9" y="73" width="18" height="18" fill="#ffffff" rx="2"/>
          <rect x="13" y="77" width="10" height="10" fill="#000000" rx="1"/>

          <!-- Grid Dots Matrix -->
          <rect x="36" y="8" width="6" height="6" fill="#000000"/>
          <rect x="46" y="8" width="6" height="6" fill="#000000"/>
          <rect x="56" y="8" width="6" height="6" fill="#000000"/>
          <rect x="36" y="18" width="6" height="6" fill="#000000"/>
          <rect x="56" y="18" width="6" height="6" fill="#000000"/>
          <rect x="8" y="36" width="6" height="6" fill="#000000"/>
          <rect x="18" y="36" width="6" height="6" fill="#000000"/>
          <rect x="28" y="36" width="6" height="6" fill="#000000"/>
          <rect x="8" y="46" width="6" height="6" fill="#000000"/>
          <rect x="18" y="56" width="6" height="6" fill="#000000"/>
          <rect x="36" y="36" width="6" height="6" fill="#000000"/>
          <rect x="56" y="36" width="6" height="6" fill="#000000"/>
          <rect x="68" y="36" width="6" height="6" fill="#000000"/>
          <rect x="78" y="36" width="6" height="6" fill="#000000"/>
          <rect x="88" y="46" width="6" height="6" fill="#000000"/>
          <rect x="68" y="56" width="6" height="6" fill="#000000"/>
          <rect x="78" y="56" width="6" height="6" fill="#000000"/>
          <rect x="36" y="68" width="6" height="6" fill="#000000"/>
          <rect x="46" y="78" width="6" height="6" fill="#000000"/>
          <rect x="56" y="88" width="6" height="6" fill="#000000"/>
          <rect x="68" y="68" width="6" height="6" fill="#000000"/>
          <rect x="78" y="78" width="6" height="6" fill="#000000"/>
          <rect x="88" y="88" width="6" height="6" fill="#000000"/>
          <rect x="36" y="88" width="6" height="6" fill="#000000"/>

          <!-- Center JZ Badge -->
          <circle cx="50" cy="50" r="14" fill="#000000"/>
          <text x="50" y="54" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">JZ</text>
        </svg>
      `;
    }
  }

  // WhatsApp Confirm Button
  const waBtn = document.getElementById('qris-confirm-wa-btn');
  if (waBtn) {
    waBtn.onclick = () => {
      const waNumber = paySettings.whatsappAdmin || whatsappAdminNumber;
      const text = `Halo Admin JZAGENTIC, saya sudah melakukan pembayaran:\n\n- No Order: ${orderId}\n- Akun Email: ${userEmail}\n- Paket: ${plan.name} (${plan.tokens})\n- Nominal: ${plan.priceLabel}\n\nMohon dicek bukti transfer berikut dan aktifkan akun saya, terima kasih! ⚡`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
      showToast('Membuka WhatsApp Admin untuk konfirmasi pembayaran!');
    };
  }

  qrisModalOverlay.classList.add('active');
}

// Admin Portal Logic
function openAdminPortal() {
  if (adminModalOverlay) {
    adminModalOverlay.classList.add('active');
    // If not unlocked yet, focus password input
    const passInput = document.getElementById('admin-secret-input');
    if (passInput) passInput.focus();
  }
}

function closeAdminPortal() {
  if (adminModalOverlay) adminModalOverlay.classList.remove('active');
}

if (openAdminPortalBtn) openAdminPortalBtn.addEventListener('click', openAdminPortal);
if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdminPortal);

// Request 2FA OTP for Admin
document.getElementById('admin-req-otp-btn')?.addEventListener('click', async () => {
  const secret = document.getElementById('admin-secret-input').value.trim();
  if (!secret) return showToast('Masukkan password admin terlebih dahulu!');

  const reqBtn = document.getElementById('admin-req-otp-btn');
  reqBtn.disabled = true;
  reqBtn.textContent = 'Membuat...';

  try {
    const res = await fetch('/api/admin/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
    const data = await res.json();
    if (data.success) {
      const otpSection = document.getElementById('admin-otp-section');
      const unlockBtn = document.getElementById('admin-unlock-btn');
      const statusMsg = document.getElementById('admin-otp-status-msg');

      if (otpSection) {
        otpSection.style.opacity = '1';
        otpSection.style.pointerEvents = 'auto';
      }
      if (unlockBtn) unlockBtn.disabled = false;

      // Status message (DO NOT display OTP code on screen for maximum privacy)
      if (statusMsg) {
        statusMsg.innerHTML = `
          <span style="color:#34d399; font-weight:600;">✓ Kode OTP telah dikirim rahasia ke WhatsApp Anda.</span>
          <br><a href="${data.waVerifyUrl}" target="_blank" style="color:#25D366; text-decoration:underline; font-weight:700;">📲 Klik di Sini untuk Buka WhatsApp & Lihat Kode OTP ↗</a>
        `;
      }

      document.getElementById('admin-otp-input')?.focus();
      showToast('Kode OTP telah dikirim rahasia ke WhatsApp!');
      if (data.waVerifyUrl) {
        window.open(data.waVerifyUrl, '_blank');
      }
    } else {
      showToast('Gagal: Password admin salah!');
    }
  } catch (e) {
    showToast('Error koneksi request OTP: ' + e.message);
  } finally {
    reqBtn.disabled = false;
    reqBtn.textContent = 'Kirim Ulang 📱';
  }
});

// Unlock Admin with Password + OTP
document.getElementById('admin-unlock-btn')?.addEventListener('click', async () => {
  const secret = document.getElementById('admin-secret-input').value.trim();
  const otp = document.getElementById('admin-otp-input').value.trim();

  if (!secret) return showToast('Masukkan password admin!');
  if (!otp) return showToast('Masukkan 6-digit kode OTP atau PIN Master Anda!');

  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, otp }),
    });
    const data = await res.json();
    if (data.success) {
      currentAdminSecret = secret;
      currentAdminOtp = otp;
      document.getElementById('admin-lock-screen').style.display = 'none';
      document.getElementById('admin-unlocked-screen').style.display = 'block';
      renderAdminUsers(data.users || []);
      populateAdminSettings(data.paymentConfig || {});
      showToast('Admin Portal Terverifikasi (2FA Sukses)! 🛡️');
    } else {
      showToast('Kode OTP salah atau telah kadaluarsa!');
    }
  } catch (e) {
    showToast('Error koneksi admin: ' + e.message);
  }
});

// Admin Subtabs
document.getElementById('admin-tab-users-btn')?.addEventListener('click', () => {
  document.getElementById('admin-users-view').style.display = 'block';
  document.getElementById('admin-settings-view').style.display = 'none';
  document.getElementById('admin-tab-users-btn').classList.add('active-subtab');
  document.getElementById('admin-tab-settings-btn').classList.remove('active-subtab');
});

document.getElementById('admin-tab-settings-btn')?.addEventListener('click', () => {
  document.getElementById('admin-users-view').style.display = 'none';
  document.getElementById('admin-settings-view').style.display = 'block';
  document.getElementById('admin-tab-settings-btn').classList.add('active-subtab');
  document.getElementById('admin-tab-users-btn').classList.remove('active-subtab');
});

// Refresh Admin Users
document.getElementById('refresh-admin-users-btn')?.addEventListener('click', async () => {
  if (!currentAdminSecret) return;
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: currentAdminSecret, otp: currentAdminOtp }),
    });
    const data = await res.json();
    if (data.success) {
      renderAdminUsers(data.users || []);
      showToast('Data pengguna diperbarui!');
    }
  } catch (e) {}
});

function renderAdminUsers(users) {
  const tbody = document.getElementById('admin-users-table-body');
  const countEl = document.getElementById('admin-users-count');
  if (countEl) countEl.textContent = users.length;
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:16px; text-align:center; color:#a1a1aa;">Belum ada user yang login dengan Google.</td></tr>`;
    return;
  }

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n);

  tbody.innerHTML = users.map(u => {
    const isVip = u.tier === 'vip' || u.tokenBalance === 'UNLIMITED';
    return `
      <tr class="admin-user-row" style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 10px 12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${u.picture || 'https://www.gravatar.com/avatar/?d=mp'}" style="width:22px; height:22px; border-radius:50%;" onerror="this.src='https://www.gravatar.com/avatar/?d=mp'">
            <div>
              <strong style="color:#ffffff; display:block;">${escapeHTML(u.name || 'User')}</strong>
              <span style="color:#94a3b8; font-size:0.7rem;">${escapeHTML(u.email)}</span>
            </div>
          </div>
        </td>
        <td style="padding: 10px 12px;">
          <span style="padding:2px 8px; border-radius:10px; font-weight:700; font-size:0.7rem; ${isVip ? 'background:rgba(245,158,11,0.2); color:#fbbf24;' : u.tier === 'pro' ? 'background:rgba(56,189,248,0.2); color:#38bdf8;' : 'background:rgba(255,255,255,0.08); color:#a1a1aa;'}">
            ${u.tierName || u.tier}
          </span>
        </td>
        <td style="padding: 10px 12px; font-weight:700; color:${isVip ? '#fbbf24' : '#34d399'};">
          ${isVip ? '👑 UNLIMITED' : fmt(u.tokenBalance)}
        </td>
        <td style="padding: 10px 12px; color:#a1a1aa;">
          ${fmt(u.tokensUsed || 0)} tokens
        </td>
        <td style="padding: 10px 12px; text-align:right;">
          <div style="display:inline-flex; gap:4px;">
            <button class="btn-small quick-row-topup" data-email="${u.email}" data-action="pro" style="padding:2px 6px; font-size:0.7rem; background:#10b981; color:#000000; font-weight:700;" title="Tambah 1 Juta Token (Pro)">+1M</button>
            <button class="btn-small quick-row-topup" data-email="${u.email}" data-action="vip" style="padding:2px 6px; font-size:0.7rem; background:#f59e0b; color:#000000; font-weight:700;" title="Jadikan VIP Unlimited">VIP</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.quick-row-topup').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.getAttribute('data-email');
      const action = btn.getAttribute('data-action');
      await executeAdminTopup(email, action);
    });
  });
}

async function executeAdminTopup(email, action) {
  let tokens = 0;
  let tier = 'pro';

  if (action === 'starter') {
    tokens = 250000;
    tier = 'starter';
  } else if (action === 'pro') {
    tokens = 1000000;
    tier = 'pro';
  } else if (action === 'vip') {
    tokens = 999999999;
    tier = 'vip';
  } else if (action === 'reset_free') {
    tokens = 50000;
    tier = 'free';
  }

  try {
    const res = await fetch('/api/admin/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: currentAdminSecret,
        email,
        tokens,
        tier,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Sukses mengaktifkan paket ${tier.toUpperCase()} untuk ${email}! ⚡`);
      // If current user is the one topped up, refresh
      if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
        updateUserState(data.user);
      }
      document.getElementById('refresh-admin-users-btn')?.click();
    } else {
      showToast('Gagal topup: ' + (data.error || 'Unknown'));
    }
  } catch (e) {
    showToast('Error topup: ' + e.message);
  }
}

// Quick 1-Click Form Submit
document.getElementById('quick-topup-submit-btn')?.addEventListener('click', async () => {
  const email = document.getElementById('quick-topup-email').value.trim();
  const action = document.getElementById('quick-topup-action').value;
  if (!email) return showToast('Masukkan email pengguna yang ingin di-topup!');
  await executeAdminTopup(email, action);
});

function populateAdminSettings(cfg) {
  if (cfg.whatsappAdmin) document.getElementById('setting-wa-number').value = cfg.whatsappAdmin;
  if (cfg.bankName) document.getElementById('setting-bank-name').value = cfg.bankName;
  if (cfg.bankAccount) document.getElementById('setting-bank-account').value = cfg.bankAccount;
  if (cfg.bankHolder) document.getElementById('setting-bank-holder').value = cfg.bankHolder;
  if (cfg.qrisImageUrl) document.getElementById('setting-qris-url').value = cfg.qrisImageUrl;
  if (cfg.qrisNote) document.getElementById('setting-qris-note').value = cfg.qrisNote;
}

// Save Payment Settings Submit
document.getElementById('save-payment-settings-btn')?.addEventListener('click', async () => {
  const payload = {
    secret: currentAdminSecret,
    whatsappAdmin: document.getElementById('setting-wa-number').value.trim(),
    bankName: document.getElementById('setting-bank-name').value.trim(),
    bankAccount: document.getElementById('setting-bank-account').value.trim(),
    bankHolder: document.getElementById('setting-bank-holder').value.trim(),
    qrisImageUrl: document.getElementById('setting-qris-url').value.trim(),
    qrisNote: document.getElementById('setting-qris-note').value.trim(),
  };

  try {
    const res = await fetch('/api/payment/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      if (data.settings.whatsappAdmin) whatsappAdminNumber = data.settings.whatsappAdmin;
      showToast('Pengaturan pembayaran & QRIS berhasil disimpan!');
    } else {
      showToast('Gagal menyimpan: ' + (data.error || 'Unknown'));
    }
  } catch (e) {
    showToast('Error menyimpan: ' + e.message);
  }
});

function renderGoogleButton() {
  const container = document.getElementById('google-signin-btn-container');
  if (!container) return;

  const tryRender = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 300,
          logo_alignment: 'left',
        });
      } catch (e) {
        console.warn('Google One Tap init issue:', e.message);
      }
    } else {
      setTimeout(tryRender, 300);
    }
  };
  tryRender();
}

async function handleGoogleCredentialResponse(response) {
  try {
    // Read cached wallet if any (so returning users keep their remaining balance!)
    const clientWallet = getCachedUserWallet();

    const res = await fetch('/api/auth/google/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential, clientWallet }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      sessionToken = data.sessionToken;
      localStorage.setItem('jz_session_token', sessionToken);
      
      // Save wallet in localStorage
      saveUserWallet(data.user);

      updateUserState(data.user);
      hideAuthModal();

      if (data.isNewUser) {
        showToast(`🎉 Selamat datang ${data.user.name}! Bonus 50.000 Token Gratis telah aktif!`);
      } else {
        const bal = (data.user.isVip || data.user.tokenBalance === 'UNLIMITED')
          ? 'UNLIMITED'
          : new Intl.NumberFormat('id-ID').format(data.user.tokenBalance);
        showToast(`👋 Selamat datang kembali, ${data.user.name}! Sisa kuota Anda: ${bal} Token.`);
      }
    } else {
      showToast('Gagal verifikasi Google: ' + (data.error || 'Unknown'));
    }
  } catch (e) {
    showToast('Error koneksi Google auth: ' + e.message);
  }
}

async function initAuthCheck() {
  try {
    const configRes = await fetch('/api/auth/config');
    const configData = await configRes.json();
    if (configData.googleClientId) {
      googleClientId = configData.googleClientId;
    }
  } catch (e) {}

  if (sessionToken) {
    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      const meData = await meRes.json();
      if (meData.authenticated && meData.user) {
        updateUserState(meData.user);
        return;
      }
    } catch (e) {}
  }

  // Not logged in: render button in navbar and prompt login
  renderUserNavbar(null);
  updateTokenTicker();
  // Prompt login modal
  showAuthModal();
}

// Initialize Application
window.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  renderParticles();
  loadFiles();
  openFile('playground.js');
  setupMobileMirror();
  initSSE();
  initAuthCheck();

  // Check if API keys are configured & load real token stats
  try {
    const statusRes = await fetch('/api/ai/key-status');
    const status = await statusRes.json();
    
    // Load real token stats from server
    const statsRes = await fetch('/api/status');
    const statsData = await statsRes.json();
    if (statsData.tokenEngine) {
      updateTokenTicker(statsData.tokenEngine);
    }

    const badge = document.getElementById('token-counter-badge');
    if (badge && !currentUser) {
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.5)';
      badge.style.color = '#34d399';
    }
    showToast('⚡ JZAGENTIC AI Engine Online — Google Cloud & Token Quota Aktif!');
  } catch (e) {
    showToast('⚠️ Tidak dapat memeriksa status API');
  }
});


// ==================== MOBILE RESPONSIVE HANDLERS ====================

// Mobile bottom tab bar navigation
document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    // Special "store" tab opens pricing modal
    if (tab === 'store') {
      document.getElementById('pricing-modal-overlay')?.classList.add('active');
      return;
    }

    // Switch view
    switchNavTab(tab);

    // Update mobile tabs active state
    document.querySelectorAll('.mobile-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
  });
});

// Sync desktop nav-tab clicks with mobile bottom tabs
const origSwitchNavTab = switchNavTab;
switchNavTab = function(tabName) {
  origSwitchNavTab(tabName);
  document.querySelectorAll('.mobile-tab-btn').forEach(b => {
    if (b.dataset.tab === 'store') return; // skip store btn
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
};

// Mobile IDE sidebar toggle
const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
const ideSidebar = document.querySelector('.ide-sidebar');
const mobileFilesBtn = document.getElementById('ide-mobile-files-btn');

function toggleMobileSidebar() {
  if (!ideSidebar) return;
  const isOpen = ideSidebar.classList.contains('mobile-visible');
  ideSidebar.classList.toggle('mobile-visible', !isOpen);
  mobileSidebarOverlay?.classList.toggle('active', !isOpen);
}

function closeMobileSidebar() {
  ideSidebar?.classList.remove('mobile-visible');
  mobileSidebarOverlay?.classList.remove('active');
}

if (mobileFilesBtn) {
  mobileFilesBtn.addEventListener('click', toggleMobileSidebar);
}

if (mobileSidebarOverlay) {
  mobileSidebarOverlay.addEventListener('click', closeMobileSidebar);
}

// Close sidebar when a file is opened on mobile
const origOpenFile = openFile;
openFile = async function(relPath) {
  await origOpenFile(relPath);
  closeMobileSidebar();
};

// Auto-hide model label text on very narrow screens
function handleResponsiveUpdates() {
  const w = window.innerWidth;
  
  // Hide upgrade pill text if too narrow
  const upgradePill = document.getElementById('open-pricing-btn');
  if (upgradePill) {
    if (w <= 360) {
      upgradePill.querySelector('span').textContent = '⭐';
    } else {
      upgradePill.querySelector('span').textContent = '⭐ Upgrade';
    }
  }
}

window.addEventListener('resize', handleResponsiveUpdates);
handleResponsiveUpdates();
