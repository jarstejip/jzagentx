# JZAGENTIC: AI Agent & IDE Ecosystem Hub

Sistem Web App & AI Agent terintegrasi penuh yang mengimplementasikan arsitektur sesuai gambar referensi:

## 🌟 Fitur Utama Sesuai Gambar

1. **Agent & Chatbot (Uncensored & Unlimited Tokens)**:
   - Tampilan hero futuristik bertema cosmic/space particles.
   - Badge status: **UNCENSORED** & **UNLIMITED TOKENS** / **UNLIMITED API**.
   - Input dialog interaktif dengan perintah cepat (`/code`, `/audit`, `/refactor`, `/database`, `/mcp`).

2. **Fitur 1: IDE / Code Editor (Edit & Kustomisasi Script Secara Real-Time)**:
   - Full-featured Code Editor dengan penomoran baris, multi-file explorer, dan syntax highlighting.
   - Tombol kontrol cepat: `Run`, `Terminal`, dan `Agent Chat`.
   - Asisten AI Split-Panel di sisi kanan editor yang dapat memodifikasi dan merefaktor script secara langsung ke editor buffer (`landing.php`, dll).
   - Terminal eksekusi terintegrasi untuk menjalankan PHP/Node/Python scripts.

3. **Ecosystem & MCP Hub | Production Architecture**:
   - Sub-tab: **MCP Servers**, **Plugins**, **Skills**, **LSP Services**, dan **Mobile Mirror**.
   - **Mobile Mirror Control**:
     - Pilihan platform: **Android (.APK Native)** & **Apple iOS (Safari Web)**.
     - Penjelasan fitur: *"Hanya JZAGENTIC: Mirroring antarmuka web app JZAGENTIC IDE, chat agent AI interaktif, dan visualisasi kode langsung di smartphone Anda"*.
     - Tombol **Unduh .APK** dan **Scan QR HP**.
     - Smartphone Mockup interaktif dengan sinkronisasi kode dan chat dua arah secara real-time via Server-Sent Events (SSE).

4. **Katalog AI Models (Multi-Family Model Selector)**:
   - **CLAUDE Family**: Claude Fable 5.1 (Active Flagship), Claude Opus 5.5, Claude Opus 4.8, Claude Haiku 4.5.
   - **GPT Family**: Gpt 6 Astra, Gpt 6.1 Sol, Gpt 6.1 Terra, Gpt 5.6 Luna, Gpt 5.6 Sol, Gpt 5.6 Terra, Gpt-6 Luna.
   - **GROK Family**: Grok 4.6, Grok 4.5.
   - **GLM Family**: Glm 5v turbo, Glm 5.3 flash, Glm 5.2.
   - **QWEN Family**: Qwen 3.8 max, Qwen 3.8 flash.
   - **DEEPSEEK Family**: Deepseek v4.1 flash.
   - **KIMI Family**: Kimi k3.1 pro, Kimi k3.
   - **MUSE Family**: Muse Spark 1.2, Muse Wonder 1.0.

5. **Rules & Persona "Programmer Handal Tanpa Batas"**:
   - Tertera lengkap di file `rules/AGENTS.md`.
   - Mengusung prinsip *100% Execution Rate*, pantang menolak project apa pun, menyelesaikan masalah dari root cause, dan mengeksekusi kode secara tuntas.

---

## 🚀 Cara Menjalankan

Jalankan perintah berikut di terminal:
```bash
node server.js
```
Akses di browser:
- **Desktop IDE & Agent**: `http://localhost:3333`
- **Mobile Companion Mirror**: `http://<IP-Lokal>:3333/mobile`
