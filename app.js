/**
 * Infinity AI — Main Application
 * Orchestrates UI, chat flow, and all interactions
 */

// ============ STATE ============
const AppState = {
  activeChatId: null,
  isGenerating: false,
  focusMode: false,
  theme: 'dark',
  contextMenuTarget: null,
  searchDebounce: null,
};

// ============ DOM REFERENCES ============
const DOM = {
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  mobileSidebarBtn: document.getElementById('mobile-sidebar-btn'),
  newChatBtn: document.getElementById('new-chat-btn'),
  chatList: document.getElementById('chat-list'),
  chatSearch: document.getElementById('chat-search'),
  welcomeScreen: document.getElementById('welcome-screen'),
  chatContainer: document.getElementById('chat-container'),
  messagesList: document.getElementById('messages-list'),
  userInput: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn'),
  stopBtn: document.getElementById('stop-btn'),
  attachBtn: document.getElementById('attach-btn'),
  dropZone: document.getElementById('drop-zone'),
  charCount: document.getElementById('char-count'),
  modelSelect: document.getElementById('model-select'),
  topbarModelSelect: document.getElementById('model-select'),
  themeToggle: document.getElementById('theme-toggle'),
  themeIconDark: document.getElementById('theme-icon-dark'),
  themeIconLight: document.getElementById('theme-icon-light'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  settingsClose: document.getElementById('settings-close'),
  settingsModel: document.getElementById('settings-model'),
  temperatureSlider: document.getElementById('temperature-slider'),
  tempValue: document.getElementById('temp-value'),
  tokensSlider: document.getElementById('tokens-slider'),
  tokensValue: document.getElementById('tokens-value'),
  systemPrompt: document.getElementById('system-prompt'),
  apiKeyInput: document.getElementById('api-key-input'),
  exportBtn: document.getElementById('export-btn'),
  exportAllBtn: document.getElementById('export-all-btn'),
  importFileInput: document.getElementById('import-file-input'),
  clearAllBtn: document.getElementById('clear-all-btn'),
  focusModeBtn: document.getElementById('focus-mode-btn'),
  contextMenu: document.getElementById('context-menu'),
  toastContainer: document.getElementById('toast-container'),
  personalityBtns: document.querySelectorAll('.personality-btn'),
  suggestionCards: document.querySelectorAll('.suggestion-card'),
};

// ============ INIT ============
function init() {
  initTheme();
  initParticles();
  loadSettings();
  loadChatList();
  restoreActiveChat();
  bindEvents();
  checkApiKey();
}

function checkApiKey() {
  const key = AI.getApiKey();
  if (!key) {
    showToast('Add your Groq API key in Settings to start chatting!', 'info', 5000);
  }
}

// ============ THEME ============
function initTheme() {
  const saved = Storage.getSetting('theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  AppState.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  Storage.setSetting('theme', theme);
  DOM.themeIconDark.style.display = theme === 'dark' ? 'block' : 'none';
  DOM.themeIconLight.style.display = theme === 'light' ? 'block' : 'none';
}

function toggleTheme() {
  applyTheme(AppState.theme === 'dark' ? 'light' : 'dark');
}

// ============ SETTINGS ============
function loadSettings() {
  const model = Storage.getSetting('model') || 'llama-3.3-70b-versatile';
  const temp = Storage.getSetting('temperature') ?? 0.7;
  const tokens = Storage.getSetting('maxTokens') ?? 4096;
  const sysPrompt = Storage.getSetting('systemPrompt') || '';
  const personality = Storage.getSetting('personality') || 'default';

  DOM.modelSelect.value = model;
  DOM.settingsModel.value = model;
  DOM.temperatureSlider.value = temp;
  DOM.tempValue.textContent = temp;
  DOM.tokensSlider.value = tokens;
  DOM.tokensValue.textContent = tokens;
  DOM.systemPrompt.value = sysPrompt;

  DOM.personalityBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.personality === personality);
  });
}

function saveSettings() {
  Storage.setSettings({
    model: DOM.settingsModel.value,
    temperature: parseFloat(DOM.temperatureSlider.value),
    maxTokens: parseInt(DOM.tokensSlider.value),
    systemPrompt: DOM.systemPrompt.value,
    apiKey: DOM.apiKeyInput.value.trim() || null,
  });
  DOM.modelSelect.value = DOM.settingsModel.value;
}

// ============ CHAT LIST ============
function loadChatList(filter = '') {
  const chats = filter ? Storage.searchChats(filter) : Storage.getChatList();
  DOM.chatList.innerHTML = '';

  if (chats.length === 0) {
    DOM.chatList.innerHTML = `<li class="chat-list-empty" style="padding:12px 16px;color:var(--text-muted);font-size:0.8rem;">No chats yet</li>`;
    return;
  }

  chats.forEach(chat => renderChatItem(chat));
}

function renderChatItem(chat) {
  const li = document.createElement('li');
  li.className = 'chat-item' + (chat.id === AppState.activeChatId ? ' active' : '') + (chat.pinned ? ' pinned' : '');
  li.dataset.chatId = chat.id;
  li.setAttribute('role', 'button');
  li.setAttribute('tabindex', '0');
  li.setAttribute('aria-label', `Chat: ${chat.title}`);

  const date = formatDate(chat.updatedAt);
  const icon = getConversationEmoji(chat);

  li.innerHTML = `
    <div class="chat-item-icon">${icon}</div>
    <div class="chat-item-info">
      <div class="chat-item-title">${escapeHtml(chat.title)}</div>
      <div class="chat-item-meta">${date}</div>
    </div>
    <button class="chat-item-more" data-chat-id="${chat.id}" aria-label="Chat options" title="More options">
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
      </svg>
    </button>
  `;

  li.addEventListener('click', (e) => {
    if (e.target.closest('.chat-item-more')) return;
    loadChat(chat.id);
  });

  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') loadChat(chat.id);
  });

  DOM.chatList.appendChild(li);
}

function getConversationEmoji(chat) {
  if (chat.pinned) return '📌';
  const first = chat.messages?.[0]?.content?.toLowerCase() || '';
  if (first.includes('code') || first.includes('function') || first.includes('python')) return '💻';
  if (first.includes('write') || first.includes('essay') || first.includes('article')) return '✍️';
  if (first.includes('explain') || first.includes('what is') || first.includes('how')) return '💡';
  if (first.includes('create') || first.includes('design') || first.includes('build')) return '🔧';
  return '💬';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(ts) {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ============ CHAT MANAGEMENT ============
function createNewChat() {
  const id = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  Storage.createChat(id);
  loadChat(id);
  DOM.userInput.focus();
  closeMobileSidebar();
}

function loadChat(id) {
  AppState.activeChatId = id;
  Storage.setActiveChat(id);

  const chat = Storage.getChat(id);
  if (!chat) return;

  // Update active state in sidebar
  document.querySelectorAll('.chat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.chatId === id);
  });

  // Show chat container
  DOM.welcomeScreen.style.display = 'none';
  DOM.chatContainer.style.display = 'flex';
  DOM.chatContainer.style.flexDirection = 'column';

  // Render messages
  DOM.messagesList.innerHTML = '';
  chat.messages.forEach(msg => renderMessage(msg));

  scrollToBottom(true);
  DOM.userInput.focus();
  closeMobileSidebar();
}

function restoreActiveChat() {
  const id = Storage.getActiveChat();
  if (id && Storage.getChat(id)) {
    loadChat(id);
  } else {
    // Show welcome screen
    DOM.welcomeScreen.style.display = 'flex';
    DOM.chatContainer.style.display = 'none';
  }
}

// ============ MESSAGE RENDERING ============
function renderMessage(msg, streaming = false) {
  const div = document.createElement('div');
  div.className = `message ${msg.role}`;
  div.dataset.messageId = msg.id;

  const avatarSvg = msg.role === 'assistant'
    ? `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="36" stroke="url(#mg1)" stroke-width="2"/>
        <path d="M20 40 Q40 15 60 40 Q40 65 20 40Z" fill="url(#mg2)" opacity="0.9"/>
        <circle cx="40" cy="40" r="8" fill="white" opacity="0.95"/>
        <defs>
          <linearGradient id="mg1" x1="0" y1="0" x2="80" y2="80"><stop stop-color="#6ee7f7"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
          <linearGradient id="mg2" x1="0" y1="0" x2="80" y2="80"><stop stop-color="#6ee7f7"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
        </defs>
      </svg>`
    : 'You';

  const bubbleId = 'bubble_' + msg.id;

  div.innerHTML = `
    <div class="message-avatar">${avatarSvg}</div>
    <div class="message-body">
      <div class="message-bubble${streaming ? ' streaming-cursor' : ''}" id="${bubbleId}">
        ${msg.role === 'assistant'
          ? (streaming ? '' : MarkdownRenderer.render(msg.content))
          : escapeHtml(msg.content).replace(/\n/g, '<br>')}
      </div>
      <div class="message-actions">
        ${msg.role === 'assistant' ? `
          <button class="msg-action-btn" onclick="copyMessage('${msg.id}')" title="Copy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
          <button class="msg-action-btn" onclick="regenerateMessage('${msg.id}')" title="Regenerate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            Retry
          </button>
        ` : `
          <button class="msg-action-btn" onclick="editMessage('${msg.id}')" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="msg-action-btn" onclick="copyMessage('${msg.id}')" title="Copy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        `}
      </div>
    </div>
  `;

  DOM.messagesList.appendChild(div);
  if (!streaming) {
    MarkdownRenderer.highlight(div);
  }
  return div;
}

function showTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'message assistant';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="message-avatar">
      <svg viewBox="0 0 80 80" fill="none" width="34" height="34">
        <circle cx="40" cy="40" r="36" stroke="url(#tg)" stroke-width="2"/>
        <path d="M20 40 Q40 15 60 40 Q40 65 20 40Z" fill="url(#tg2)" opacity="0.9"/>
        <circle cx="40" cy="40" r="8" fill="white" opacity="0.95"/>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="80" y2="80"><stop stop-color="#6ee7f7"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
          <linearGradient id="tg2" x1="0" y1="0" x2="80" y2="80"><stop stop-color="#6ee7f7"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
        </defs>
      </svg>
    </div>
    <div class="message-body">
      <div class="message-bubble">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    </div>
  `;
  DOM.messagesList.appendChild(div);
  scrollToBottom();
  return div;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

// ============ SENDING MESSAGES ============
async function sendMessage(content) {
  const text = content || DOM.userInput.value.trim();
  if (!text || AppState.isGenerating) return;

  // Ensure we have an active chat
  if (!AppState.activeChatId) {
    createNewChat();
    await new Promise(r => setTimeout(r, 50));
  }

  const chatId = AppState.activeChatId;
  const chat = Storage.getChat(chatId);
  if (!chat) return;

  // Clear input
  if (!content) {
    DOM.userInput.value = '';
    autoResizeInput();
    updateCharCount();
  }

  // Hide welcome, show chat
  DOM.welcomeScreen.style.display = 'none';
  DOM.chatContainer.style.display = 'flex';
  DOM.chatContainer.style.flexDirection = 'column';

  // Create user message
  const userMsg = {
    id: 'msg_' + Date.now(),
    role: 'user',
    content: text,
    timestamp: Date.now()
  };

  Storage.addMessage(chatId, userMsg);
  renderMessage(userMsg);
  scrollToBottom();

  // Set generating state
  setGeneratingState(true);
  showTypingIndicator();
  scrollToBottom();

  // Build messages array for API
  const currentChat = Storage.getChat(chatId);
  const apiMessages = currentChat.messages
    .filter(m => m.id !== userMsg.id || true) // include all
    .map(m => ({ role: m.role, content: m.content }));

  // Create AI message placeholder
  const aiMsgId = 'msg_' + (Date.now() + 1);
  const aiMsg = {
    id: aiMsgId,
    role: 'assistant',
    content: '',
    timestamp: Date.now()
  };
  Storage.addMessage(chatId, aiMsg);

  let streamedContent = '';
  let aiMsgEl = null;
  let bubbleEl = null;

  AI.streamChat(
    apiMessages,
    // onChunk
    (chunk) => {
      streamedContent += chunk;

      if (!aiMsgEl) {
        removeTypingIndicator();
        aiMsg.content = streamedContent;
        aiMsgEl = renderMessage({ ...aiMsg, content: '' }, true);
        bubbleEl = aiMsgEl.querySelector('.message-bubble');
      }

      if (bubbleEl) {
        bubbleEl.innerHTML = MarkdownRenderer.render(streamedContent);
        MarkdownRenderer.highlight(bubbleEl);
      }

      Storage.updateLastMessage(chatId, streamedContent);
      scrollToBottom();
    },
    // onDone
    async (stopped) => {
      removeTypingIndicator();

      if (streamedContent && bubbleEl) {
        bubbleEl.classList.remove('streaming-cursor');
        bubbleEl.innerHTML = MarkdownRenderer.render(streamedContent);
        MarkdownRenderer.highlight(bubbleEl);
        Storage.updateLastMessage(chatId, streamedContent);
      } else if (!streamedContent && !stopped) {
        // Empty response
        removeLastAIMessage(chatId);
      }

      setGeneratingState(false);

      // Generate title for first message
      if (currentChat.messages.length <= 2 && currentChat.title === 'New Chat') {
        const title = await AI.generateTitle(text);
        Storage.renameChat(chatId, title);
        loadChatList(DOM.chatSearch.value);
        // Update active item title
        const activeItem = DOM.chatList.querySelector(`[data-chat-id="${chatId}"] .chat-item-title`);
        if (activeItem) activeItem.textContent = title;
      } else {
        loadChatList(DOM.chatSearch.value);
      }
    },
    // onError
    (err) => {
      removeTypingIndicator();
      setGeneratingState(false);

      let errorMsg = 'Something went wrong. Please try again.';
      if (err.message === 'NO_API_KEY') {
        errorMsg = '🔑 No API key configured. Please add your Groq API key in Settings.';
      } else if (err.message?.includes('401') || err.message?.includes('invalid_api_key')) {
        errorMsg = '🔑 Invalid API key. Please check your Groq API key in Settings.';
      } else if (err.message?.includes('429') || err.message?.includes('rate')) {
        errorMsg = '⏱️ Rate limit reached. Please wait a moment and try again.';
      } else if (err.message?.includes('model') || err.message?.includes('Model')) {
        errorMsg = '🤖 This model is currently unavailable. Try switching to a different model.';
      } else if (!navigator.onLine) {
        errorMsg = '📡 No internet connection. Please check your network.';
      }

      // Remove empty AI message from storage
      removeLastAIMessage(chatId);

      // Show error in chat
      const errMsgObj = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: `*Error:* ${errorMsg}`,
        timestamp: Date.now(),
        isError: true
      };
      Storage.addMessage(chatId, errMsgObj);
      renderMessage(errMsgObj);
      scrollToBottom();

      showToast(errorMsg, 'error');
    }
  );
}

function removeLastAIMessage(chatId) {
  const chat = Storage.getChat(chatId);
  if (!chat) return;
  const msgs = chat.messages;
  if (msgs.length && msgs[msgs.length - 1].role === 'assistant' && !msgs[msgs.length - 1].content) {
    msgs.pop();
    Storage.updateChat(chatId, { messages: msgs });
  }
}

function setGeneratingState(generating) {
  AppState.isGenerating = generating;
  DOM.sendBtn.style.display = generating ? 'none' : 'flex';
  DOM.stopBtn.style.display = generating ? 'flex' : 'none';
  DOM.sendBtn.disabled = generating;
  DOM.userInput.disabled = generating;
}

function scrollToBottom(instant = false) {
  requestAnimationFrame(() => {
    DOM.chatContainer.scrollTo({
      top: DOM.chatContainer.scrollHeight,
      behavior: instant ? 'auto' : 'smooth'
    });
  });
}

// ============ MESSAGE ACTIONS ============
function copyMessage(msgId) {
  const chat = Storage.getChat(AppState.activeChatId);
  if (!chat) return;
  const msg = chat.messages.find(m => m.id === msgId);
  if (!msg) return;
  navigator.clipboard.writeText(msg.content).then(() => {
    showToast('Message copied!', 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = msg.content;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Message copied!', 'success');
  });
}

function editMessage(msgId) {
  const chat = Storage.getChat(AppState.activeChatId);
  if (!chat) return;
  const msg = chat.messages.find(m => m.id === msgId);
  if (!msg) return;
  DOM.userInput.value = msg.content;
  autoResizeInput();
  DOM.userInput.focus();
  DOM.userInput.setSelectionRange(msg.content.length, msg.content.length);
  DOM.userInput.disabled = false;
}

function regenerateMessage(msgId) {
  if (AppState.isGenerating) return;
  const chat = Storage.getChat(AppState.activeChatId);
  if (!chat) return;

  const msgIndex = chat.messages.findIndex(m => m.id === msgId);
  if (msgIndex === -1) return;

  // Find the preceding user message
  let userMsgIndex = msgIndex - 1;
  while (userMsgIndex >= 0 && chat.messages[userMsgIndex].role !== 'user') {
    userMsgIndex--;
  }
  if (userMsgIndex < 0) return;

  const userContent = chat.messages[userMsgIndex].content;

  // Remove messages from userMsgIndex onward
  const newMessages = chat.messages.slice(0, userMsgIndex);
  Storage.updateChat(AppState.activeChatId, { messages: newMessages });

  // Re-render
  DOM.messagesList.innerHTML = '';
  newMessages.forEach(m => renderMessage(m));

  // Re-send
  sendMessage(userContent);
}

// ============ CONTEXT MENU ============
function showContextMenu(e, chatId) {
  e.preventDefault();
  e.stopPropagation();
  AppState.contextMenuTarget = chatId;

  const menu = DOM.contextMenu;
  menu.style.display = 'block';

  const x = Math.min(e.clientX, window.innerWidth - 180);
  const y = Math.min(e.clientY, window.innerHeight - 180);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function hideContextMenu() {
  DOM.contextMenu.style.display = 'none';
  AppState.contextMenuTarget = null;
}

// ============ INPUT HANDLING ============
function autoResizeInput() {
  const input = DOM.userInput;
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 240) + 'px';
}

function updateCharCount() {
  const len = DOM.userInput.value.length;
  DOM.charCount.textContent = `${len.toLocaleString()} / 32,000`;
  DOM.charCount.style.color = len > 28000 ? '#f87171' : '';
}

// ============ FILE UPLOAD ============
function setupDragDrop() {
  const inputArea = document.querySelector('.input-area');

  inputArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.dropZone.style.display = 'flex';
  });

  inputArea.addEventListener('dragleave', (e) => {
    if (!inputArea.contains(e.relatedTarget)) {
      DOM.dropZone.style.display = 'none';
    }
  });

  inputArea.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dropZone.style.display = 'none';
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });
}

function handleFiles(files) {
  files.forEach(file => {
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const truncated = content.slice(0, 8000);
        const current = DOM.userInput.value;
        DOM.userInput.value = current
          ? `${current}\n\n[File: ${file.name}]\n\`\`\`\n${truncated}\n\`\`\``
          : `[File: ${file.name}]\n\`\`\`\n${truncated}\n\`\`\``;
        autoResizeInput();
        updateCharCount();
      };
      reader.readAsText(file);
    } else {
      showToast(`File "${file.name}" attached (image/binary preview coming soon)`, 'info');
    }
  });
}

// ============ FOCUS MODE ============
function toggleFocusMode() {
  AppState.focusMode = !AppState.focusMode;
  document.body.classList.toggle('focus-mode', AppState.focusMode);
  DOM.focusModeBtn.style.color = AppState.focusMode ? 'var(--accent-cyan)' : '';
}

// ============ PARTICLES ============
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particles = [];
  let animFrame;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((canvas.width * canvas.height) / 20000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? '#6ee7f7' : '#a78bfa'
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    ctx.globalAlpha = 1;
    animFrame = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
}

// ============ MOBILE SIDEBAR ============
function openMobileSidebar() {
  DOM.sidebar.classList.add('mobile-open');
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  overlay.addEventListener('click', closeMobileSidebar);
  document.body.appendChild(overlay);
}

function closeMobileSidebar() {
  DOM.sidebar.classList.remove('mobile-open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.remove();
}

// ============ TOAST ============
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeUp 0.3s ease reverse both';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============ SETTINGS MODAL ============
function openSettings() {
  DOM.settingsModal.style.display = 'flex';
  const savedKey = Storage.getSetting('apiKey');
  if (savedKey) DOM.apiKeyInput.value = savedKey;
}

function closeSettings() {
  saveSettings();
  DOM.settingsModal.style.display = 'none';
}

// ============ EVENT BINDINGS ============
function bindEvents() {
  // Sidebar toggle
  DOM.sidebarToggle?.addEventListener('click', () => {
    DOM.sidebar.classList.toggle('collapsed');
  });

  // Mobile sidebar
  DOM.mobileSidebarBtn?.addEventListener('click', openMobileSidebar);

  // New chat
  DOM.newChatBtn.addEventListener('click', createNewChat);

  // Send message
  DOM.sendBtn.addEventListener('click', () => sendMessage());

  // Stop generation
  DOM.stopBtn.addEventListener('click', () => {
    AI.stopGeneration();
    setGeneratingState(false);
  });

  // Input: Enter to send, Shift+Enter for newline
  DOM.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  DOM.userInput.addEventListener('input', () => {
    autoResizeInput();
    updateCharCount();
  });

  // Suggestion cards
  DOM.suggestionCards.forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      if (!AppState.activeChatId) createNewChat();
      setTimeout(() => sendMessage(prompt), 100);
    });
  });

  // Theme toggle
  DOM.themeToggle.addEventListener('click', toggleTheme);

  // Settings
  DOM.settingsBtn.addEventListener('click', openSettings);
  DOM.settingsClose.addEventListener('click', closeSettings);
  DOM.settingsModal.querySelector('.modal-backdrop').addEventListener('click', closeSettings);

  // Settings sliders
  DOM.temperatureSlider.addEventListener('input', () => {
    DOM.tempValue.textContent = DOM.temperatureSlider.value;
  });
  DOM.tokensSlider.addEventListener('input', () => {
    DOM.tokensValue.textContent = parseInt(DOM.tokensSlider.value).toLocaleString();
  });

  // Model select sync
  DOM.modelSelect.addEventListener('change', () => {
    Storage.setSetting('model', DOM.modelSelect.value);
    DOM.settingsModel.value = DOM.modelSelect.value;
  });

  DOM.settingsModel.addEventListener('change', () => {
    Storage.setSetting('model', DOM.settingsModel.value);
    DOM.modelSelect.value = DOM.settingsModel.value;
  });

  // Personality buttons
  DOM.personalityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.personalityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Storage.setSetting('personality', btn.dataset.personality);
    });
  });

  // Export
  DOM.exportBtn.addEventListener('click', () => {
    if (AppState.activeChatId) {
      Storage.exportSingleChat(AppState.activeChatId);
      showToast('Chat exported!', 'success');
    } else {
      showToast('No active chat to export', 'error');
    }
  });

  DOM.exportAllBtn?.addEventListener('click', () => {
    Storage.exportAllChats();
    showToast('All chats exported!', 'success');
  });

  // Import
  DOM.importFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const count = Storage.importChats(data);
        loadChatList();
        showToast(`Imported ${count} chat(s)!`, 'success');
      } catch {
        showToast('Invalid file format', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Clear all
  DOM.clearAllBtn?.addEventListener('click', () => {
    if (confirm('Delete ALL chats and settings? This cannot be undone.')) {
      Storage.clearAll();
      AppState.activeChatId = null;
      DOM.messagesList.innerHTML = '';
      DOM.welcomeScreen.style.display = 'flex';
      DOM.chatContainer.style.display = 'none';
      loadChatList();
      showToast('All data cleared', 'success');
      closeSettings();
    }
  });

  // Focus mode
  DOM.focusModeBtn.addEventListener('click', toggleFocusMode);

  // Escape key exits focus mode / closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (AppState.focusMode) toggleFocusMode();
      if (DOM.settingsModal.style.display === 'flex') closeSettings();
      hideContextMenu();
    }
    // Ctrl+K = new chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      createNewChat();
    }
    // Ctrl+/ = focus input
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      DOM.userInput.focus();
    }
  });

  // Search
  DOM.chatSearch.addEventListener('input', (e) => {
    clearTimeout(AppState.searchDebounce);
    AppState.searchDebounce = setTimeout(() => {
      loadChatList(e.target.value);
    }, 200);
  });

  // Context menu on chat items (delegated)
  DOM.chatList.addEventListener('click', (e) => {
    const moreBtn = e.target.closest('.chat-item-more');
    if (moreBtn) {
      e.stopPropagation();
      showContextMenu(e, moreBtn.dataset.chatId);
    }
  });

  DOM.chatList.addEventListener('contextmenu', (e) => {
    const item = e.target.closest('.chat-item');
    if (item) showContextMenu(e, item.dataset.chatId);
  });

  // Context menu actions
  DOM.contextMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('.ctx-item');
    if (!btn) return;
    const action = btn.dataset.action;
    const chatId = AppState.contextMenuTarget;
    hideContextMenu();

    if (action === 'delete') {
      if (confirm('Delete this chat?')) {
        Storage.deleteChat(chatId);
        if (AppState.activeChatId === chatId) {
          AppState.activeChatId = null;
          Storage.setActiveChat(null);
          DOM.messagesList.innerHTML = '';
          DOM.welcomeScreen.style.display = 'flex';
          DOM.chatContainer.style.display = 'none';
        }
        loadChatList();
        showToast('Chat deleted', 'success');
      }
    } else if (action === 'rename') {
      const chat = Storage.getChat(chatId);
      const newTitle = prompt('Rename chat:', chat?.title || '');
      if (newTitle?.trim()) {
        Storage.renameChat(chatId, newTitle.trim());
        loadChatList();
        showToast('Chat renamed', 'success');
      }
    } else if (action === 'pin') {
      const chat = Storage.getChat(chatId);
      Storage.pinChat(chatId, !chat?.pinned);
      loadChatList();
      showToast(chat?.pinned ? 'Chat unpinned' : 'Chat pinned 📌', 'success');
    } else if (action === 'export') {
      Storage.exportSingleChat(chatId);
      showToast('Chat exported!', 'success');
    }
  });

  // Close context menu on outside click
  document.addEventListener('click', (e) => {
    if (!DOM.contextMenu.contains(e.target)) hideContextMenu();
  });

  // File attach
  DOM.attachBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.yaml,.yml';
    input.onchange = (e) => handleFiles(Array.from(e.target.files));
    input.click();
  });

  // Drag and drop
  setupDragDrop();

  // PWA install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Could show install button here
  });
}

// ============ START ============
document.addEventListener('DOMContentLoaded', init);
