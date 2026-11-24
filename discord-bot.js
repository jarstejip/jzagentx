/**
 * JZAGENTIC Discord Bot Integration
 * Dedicated AI Assistant for Discord Servers (e.g. RPL SERVER)
 * Features:
 * - 100% UNLIMITED Token Mode for Discord members
 * - Dedicated channel listening (#ai-agent) & @mention responses
 * - Multimodal vision: reads code error screenshots & diagrams
 * - Smart message chunking (< 2000 chars)
 * - Multi-model support: Gemini, Claude, GPT-4o, DeepSeek
 */

const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const aiEngine = require('./ai-engine');

// Configuration Paths
const CONFIG_FILE = path.join(__dirname, 'discord-config.json');
const API_KEYS_FILE = path.join(__dirname, '.api-keys.json');

// Default Config
let discordConfig = {
  token: process.env.DISCORD_BOT_TOKEN || '',
  targetChannel: 'ai-agent',
  defaultModel: 'Gemini 2.0 Flash',
  unlimitedMode: true,
  statusText: '🤖 RPL SERVER | Unlimited AI Code Assistant',
  prefix: '!'
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    discordConfig = { ...discordConfig, ...JSON.parse(raw) };
  } catch (e) {
    console.error('[Discord] Failed to read discord-config.json:', e.message);
  }
}

// Load API Keys for AI Engine
let apiConfig = {
  gemini: process.env.GEMINI_API_KEY || '',
  openrouter: process.env.OPENROUTER_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  anthropic: process.env.ANTHROPIC_API_KEY || '',
  deepseek: process.env.DEEPSEEK_API_KEY || '',
  ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
};

if (fs.existsSync(API_KEYS_FILE)) {
  try {
    const raw = fs.readFileSync(API_KEYS_FILE, 'utf8');
    apiConfig = { ...apiConfig, ...JSON.parse(raw) };
  } catch (e) {}
}

const DISCORD_SYSTEM_PROMPT = `Anda adalah JZAGENTIC AI Assistant yang bertugas membantu anggota dan siswa di Discord "RPL SERVER" (Rekayasa Perangkat Lunak).
Spesialisasi utama Anda:
- Pemrograman & Algoritma (PHP, JavaScript, Python, C++, Java, Dart/Flutter, Kotlin, SQL, Laravel, Web Development).
- Troubleshooting Error: Mendiagnosis bug kodingan atau tangkapan layar/screenshot error yang dikirim anggota.
- Bantuan Tugas & Project RPL: Memberikan penjelasan konsep yang mendalam namun mudah dipahami.
- Mode Token: UNLIMITED (Bebas Kuota untuk semua anak di server RPL).

Gaya Format Jawaban di Discord:
1. Gunakan markdown Discord yang rapi.
2. Bungkus potongan kode di dalam blok kode sesuai bahasa (contoh: \`\`\`php ... \`\`\`, \`\`\`javascript ... \`\`\`).
3. Berikan solusi to-the-point, jelas, dan siap pakai.`;

// In-memory conversation history per channel (last 10 messages)
const channelMemory = new Map();

// Helper: Split long Discord messages safely (<= 1950 chars)
function splitDiscordMessage(text, maxLen = 1950) {
  if (!text || text.length <= maxLen) return [text || ''];
  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    let splitIdx = remaining.lastIndexOf('\n\n', maxLen);
    if (splitIdx === -1 || splitIdx < maxLen / 2) {
      splitIdx = remaining.lastIndexOf('\n', maxLen);
    }
    if (splitIdx === -1 || splitIdx < maxLen / 2) {
      splitIdx = remaining.lastIndexOf(' ', maxLen);
    }
    if (splitIdx === -1) {
      splitIdx = maxLen;
    }

    chunks.push(remaining.substring(0, splitIdx).trim());
    remaining = remaining.substring(splitIdx).trim();
  }

  return chunks;
}

// Helper: Download image attachment as Base64
async function downloadAttachmentBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve(buffer.toString('base64'));
      });
      res.on('error', reject);
    });
  });
}

// Create Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message]
});

client.once('ready', () => {
  console.log(`=======================================================`);
  console.log(`🚀 JZAGENTIC DISCORD BOT ONLINE!`);
  console.log(`🤖 Logged in as:   ${client.user.tag}`);
  console.log(`🎯 Target Channel: #${discordConfig.targetChannel}`);
  console.log(`♾️  Token Mode:     UNLIMITED (Bebas Kuota untuk RPL SERVER)`);
  console.log(`🧠 Default Model:  ${discordConfig.defaultModel}`);
  console.log(`=======================================================`);

  client.user.setActivity(discordConfig.statusText, { type: ActivityType.Custom });
});

client.on('messageCreate', async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  const channelName = message.channel.name ? message.channel.name.toLowerCase() : '';
  const targetChannel = discordConfig.targetChannel.toLowerCase();
  const isTargetChannel = channelName.includes(targetChannel) || channelName.includes('ai-agent');
  const isMentioned = client.user && message.mentions.has(client.user.id);
  const isDM = !message.guild;

  // Only respond if in target channel (#ai-agent), mentioned, or in DM
  if (!isTargetChannel && !isMentioned && !isDM) return;

  let rawContent = message.content.trim();
  if (isMentioned && client.user) {
    const mentionRegex = new RegExp(`<@!?${client.user.id}>`, 'g');
    rawContent = rawContent.replace(mentionRegex, '').trim();
  }

  // Handle bot prefix commands
  const prefix = discordConfig.prefix || '!';
  if (rawContent.startsWith(prefix)) {
    const args = rawContent.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'help' || command === 'bantuan') {
      const embed = new EmbedBuilder()
        .setTitle('🤖 JZAGENTIC AI Assistant • RPL SERVER')
        .setDescription('Selamat datang di AI Asisten RPL! Bot ini terhubung langsung ke multi-model AI (Gemini, Claude, GPT-4o, DeepSeek) dengan kuota **100% UNLIMITED**.')
        .setColor(0x00E5FF)
        .addFields(
          { name: '💬 Cara Bertanya', value: 'Ketik langsung pertanyaan Anda di channel ini atau kirim screenshot error kodingan Anda!' },
          { name: '📷 Kirim Gambar/Screenshot', value: 'Lampirkan gambar/foto script error di chat Discord, AI akan membaca & menganalisisnya!' },
          { name: '🔄 Ganti Model AI', value: '`!model` (Cek model aktif)\n`!model gpt-4o`\n`!model claude`\n`!model gemini`\n`!model deepseek`' },
          { name: '🧹 Reset Memori Obrolan', value: '`!reset` atau `!clear`' },
          { name: '⚡ Status Kuota', value: '`!quota` atau `!status`' }
        )
        .setFooter({ text: 'JZAGENTIC • Autonomous AI Ecosystem • RPL SERVER' });

      await message.reply({ embeds: [embed] });
      return;
    }

    if (command === 'model') {
      if (args.length === 0) {
        return message.reply(`🤖 Model AI aktif saat ini: **${discordConfig.defaultModel}**\n\nUntuk mengganti model, ketik:\n\`!model gpt-4o\`\n\`!model claude\`\n\`!model gemini\`\n\`!model deepseek\``);
      }
      const choice = args[0].toLowerCase();
      if (choice.includes('claude')) discordConfig.defaultModel = 'Claude 3.7 Sonnet';
      else if (choice.includes('gpt') || choice.includes('4o')) discordConfig.defaultModel = 'GPT-4o';
      else if (choice.includes('deepseek') || choice.includes('r1')) discordConfig.defaultModel = 'DeepSeek-R1';
      else if (choice.includes('gemini') || choice.includes('flash')) discordConfig.defaultModel = 'Gemini 2.0 Flash';
      else {
        return message.reply('⚠️ Model tidak dikenali. Pilihan: `gemini`, `claude`, `gpt-4o`, `deepseek`.');
      }
      return message.reply(`✅ Engine AI dialihkan ke: **${discordConfig.defaultModel}**!`);
    }

    if (command === 'clear' || command === 'reset') {
      channelMemory.delete(message.channel.id);
      return message.reply('🧹 Memori percakapan di channel ini telah di-reset. Silakan mulai topik baru!');
    }

    if (command === 'quota' || command === 'status') {
      return message.reply('♾️ **Status Kuota Discord:** `UNLIMITED VIP (Bebas Kuota Sepuasnya untuk RPL SERVER)`\n⚡ **Active Engine:** `' + discordConfig.defaultModel + '`\n🌐 **Hub:** `https://jzagentx.my.id`');
    }
  }

  // If message has no text and no attachments, do nothing
  if (!rawContent && message.attachments.size === 0) return;

  // Send Typing Indicator
  try {
    await message.channel.sendTyping();
  } catch (e) {}

  // Periodic typing interval for longer generations
  const typingInterval = setInterval(() => {
    message.channel.sendTyping().catch(() => {});
  }, 4500);

  try {
    // Process attachments (Images / Screenshots)
    const images = [];
    const imageAttachments = message.attachments.filter(att => att.contentType && att.contentType.startsWith('image/'));
    for (const [_, att] of imageAttachments) {
      try {
        const b64 = await downloadAttachmentBase64(att.url);
        images.push({
          mimeType: att.contentType,
          base64: b64,
          name: att.name
        });
      } catch (err) {
        console.error('[Discord] Error downloading attachment:', err.message);
      }
    }

    // Build conversation history
    const channelId = message.channel.id;
    let history = channelMemory.get(channelId) || [];

    const userPrompt = rawContent || (images.length > 0 ? 'Tolong analisis dan jelaskan gambar/screenshot error kodingan ini secara lengkap.' : '');
    const userMsg = { role: 'user', content: userPrompt };
    if (images.length > 0) {
      userMsg.images = images;
    }

    history.push(userMsg);
    // Keep max 12 recent messages in history
    if (history.length > 12) history = history.slice(-12);
    channelMemory.set(channelId, history);

    // Call JZAGENTIC AI Engine
    let fullResponse = '';
    const activeModel = discordConfig.defaultModel || 'Gemini 2.0 Flash';

    await new Promise((resolve, reject) => {
      aiEngine.streamAI(
        activeModel,
        history,
        apiConfig,
        (token) => {
          fullResponse += token;
        },
        () => {
          resolve();
        },
        (err) => {
          reject(err);
        },
        DISCORD_SYSTEM_PROMPT
      );
    });

    clearInterval(typingInterval);

    if (!fullResponse.trim()) {
      fullResponse = 'Maaf, model AI tidak memberikan respon. Silakan coba ajukan pertanyaan kembali.';
    }

    // Store assistant response in memory
    history.push({ role: 'assistant', content: fullResponse });
    channelMemory.set(channelId, history);

    // Split and send response (safe for 2000-char limit)
    const chunks = splitDiscordMessage(fullResponse);
    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        await message.reply({ content: chunks[i], allowedMentions: { repliedUser: false } });
      } else {
        await message.channel.send({ content: chunks[i] });
      }
    }
  } catch (error) {
    clearInterval(typingInterval);
    console.error('[Discord] Error generating AI response:', error);
    await message.reply(`⚠️ Terjadi kendala saat memproses jawaban: ${error.message || 'Model sedang sibuk'}. Silakan coba sesaat lagi.`);
  }
});

// Start Bot function
function startDiscordBot(token) {
  const botToken = token || discordConfig.token;
  if (!botToken || botToken.trim() === '') {
    console.log('[Discord] Belum ada Bot Token terpasang di discord-config.json.');
    console.log('[Discord] Dapatkan token di https://discord.com/developers/applications lalu masukkan ke discord-config.json');
    return false;
  }

  client.login(botToken.trim()).catch((err) => {
    console.error('❌ [Discord] Gagal login ke Discord:', err.message);
  });
  return true;
}

// Auto-start if run directly: `node discord-bot.js`
if (require.main === module) {
  startDiscordBot();
}

module.exports = {
  startDiscordBot,
  client,
  discordConfig
};
