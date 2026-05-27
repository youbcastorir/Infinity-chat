# ∞ Infinity AI

**Next-generation AI chat platform** powered by Groq's ultra-fast inference engine. A premium, production-ready web application inspired by Claude, ChatGPT, and Perplexity.

![Infinity AI](https://img.shields.io/badge/Infinity-AI-6ee7f7?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-a78bfa?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-white?style=for-the-badge)

---

## ✨ Features

### Core
- 🚀 **Ultra-fast streaming** responses via Groq API
- 💬 **Unlimited chat sessions** with persistent local storage
- 🧠 **Conversation memory** — full context maintained per session
- 🎨 **Markdown rendering** with syntax-highlighted code blocks
- 🌙 **Dark / Light mode** toggle
- 📱 **Fully responsive** — perfect on mobile, tablet, desktop

### AI Models (all free on Groq)
| Model | Speed | Best For |
|-------|-------|----------|
| Llama 3.3 70B | Fast | General purpose |
| Llama 3.1 8B | Fastest | Quick answers |
| Mixtral 8x7B | Fast | Long context |
| Gemma 2 9B | Fast | Instruction following |
| DeepSeek R1 70B | Moderate | Reasoning/code |
| Qwen QwQ 32B | Moderate | Complex reasoning |

### Chat Experience
- ✏️ Edit your messages and regenerate responses
- 🔄 Retry any AI response
- 📋 Copy messages and code blocks
- 🔍 Search across all chat history
- 📌 Pin important chats
- ✏️ Rename chats
- 💾 Export/import chats as JSON
- 🗑️ Delete individual chats or clear all

### Settings & Customization
- 🌡️ Temperature control (0 → 2)
- 📏 Max tokens control (256 → 8192)
- 💡 AI personality modes: Default, Creative, Expert, Concise
- 📝 Custom system prompts
- 🔑 Your own API key override

### Technical
- ⚡ Progressive Web App (PWA) — installable on any device
- 🔌 Offline-capable UI (cached assets)
- 🛡️ No backend required — runs entirely in the browser
- 📦 Zero framework dependencies (vanilla JS)
- 🎯 Modular architecture

---

## 🚀 Quick Start

### Option 1: Direct Open (No Server Needed)
```bash
git clone https://github.com/yourusername/infinity-ai.git
cd infinity-ai
# Open index.html in your browser
```

### Option 2: Vite Dev Server (Recommended)
```bash
git clone https://github.com/yourusername/infinity-ai.git
cd infinity-ai
npm install
cp .env.example .env
# Add your Groq API key to .env
npm run dev
```

### Option 3: Without Node.js (Python)
```bash
cd infinity-ai
python3 -m http.server 8080
# Open http://localhost:8080
```

---

## 🔑 Getting Your Free Groq API Key

1. Go to **https://console.groq.com**
2. Sign up for a free account
3. Navigate to **API Keys** → **Create API Key**
4. Copy your key (starts with `gsk_...`)

### Adding Your Key (Two Ways)

**Method A — Settings UI (Easiest)**
1. Open Infinity AI in your browser
2. Click **Settings** (bottom-left)
3. Paste your key in the **API Key** field
4. It's saved locally in your browser — never sent anywhere

**Method B — Environment Variable (For Build/Deploy)**
```bash
cp .env.example .env
# Edit .env:
VITE_GROQ_API_KEY=gsk_your_key_here
npm run build
```

---

## 🌐 Deployment

### GitHub Pages (Free)
```bash
# 1. Create a GitHub repo named: yourusername.github.io
# 2. Push all files to the repo
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/infinity-ai.git
git push -u origin main

# 3. Go to repo Settings → Pages → Source: main branch
# 4. Your site is live at https://yourusername.github.io/infinity-ai/
```

**Note:** For GitHub Pages, add your API key via the Settings UI after deploying,
or use GitHub Actions to inject it at build time.

---

### Netlify (Free — Recommended)
```bash
# Option A: Drag & Drop
# 1. Run: npm run build
# 2. Go to netlify.com → drag the /dist folder

# Option B: Git Deploy
# 1. Connect your GitHub repo at netlify.com
# 2. Build command: npm run build
# 3. Publish directory: dist
# 4. Add environment variable: VITE_GROQ_API_KEY = your_key
```

---

### Vercel (Free)
```bash
npm install -g vercel
vercel login
vercel --prod

# Or via dashboard:
# 1. Import GitHub repo at vercel.com
# 2. Add env var: VITE_GROQ_API_KEY
# 3. Deploy
```

---

### Self-Host with Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/infinity-ai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/html text/css application/javascript;

    location ~* \.(js|css|png|jpg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 📁 Project Structure

```
infinity-ai/
├── index.html          # App entry point (SEO, PWA, all meta tags)
├── style.css           # Full UI: glassmorphism, animations, responsive
├── app.js              # Main application logic & event orchestration
├── ai.js               # Groq API integration with streaming
├── storage.js          # LocalStorage-based chat persistence
├── markdown.js         # Marked.js renderer with Prism.js highlighting
├── sw.js               # Service Worker for PWA offline support
├── manifest.json       # PWA manifest
├── sitemap.xml         # SEO sitemap
├── robots.txt          # Search engine directives
├── .env.example        # Environment variable template
├── package.json        # Dependencies (dev only — Vite)
├── vite.config.js      # Build configuration
└── README.md           # This file
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Ctrl/Cmd + K` | New chat |
| `Ctrl/Cmd + /` | Focus input |
| `Esc` | Close modal / exit focus mode |

---

## 🔧 Configuration

All settings persist in `localStorage` under the key `infinity_settings`.

| Setting | Default | Options |
|---------|---------|---------|
| model | llama-3.3-70b-versatile | See model list |
| temperature | 0.7 | 0.0 – 2.0 |
| maxTokens | 4096 | 256 – 8192 |
| personality | default | default, creative, expert, concise |
| theme | dark | dark, light |
| systemPrompt | (empty) | Any string |

---

## 🛡️ Security Notes

- API keys are stored in `localStorage` — **never** sent to any server other than Groq directly
- All AI requests go directly from your browser to `api.groq.com`
- No user data is collected or logged
- For team deployments, inject the key at build time via environment variables
- Never commit your `.env` file to version control

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing`
5. Open a Pull Request

---

## 📄 License

MIT — free to use, modify, and deploy.

---

## 🙏 Credits

Built with:
- [Groq](https://groq.com) — Ultra-fast LLM inference
- [Marked.js](https://marked.js.org) — Markdown parsing
- [Prism.js](https://prismjs.com) — Syntax highlighting
- [Syne + DM Sans](https://fonts.google.com) — Typography

---

*Built with ♾️ by the Infinity AI team*
