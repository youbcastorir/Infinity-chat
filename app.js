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
    showToast('Add your API key in Settings to start chatting!', 'info', 5000);
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

  if (DOM.modelSelect) DOM.modelSelect.value = model;
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
  if (DOM.modelSelect) DOM.modelSelect.value = DOM.settingsModel.value;
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
  setTimeout(() => {
    DOM.userInput.focus();
  }, 100);
  closeMobileSidebar();
}

function loadChat(id) {
  AppState.activeChatId = id;
  Storage.setActiveChat(id);

  const chat = Storage.getChat(id);
  if (!chat) return;

  document.querySelectorAll('.chat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.chatId === id);
  });

  DOM.welcomeScreen.style.display = 'none';
  DOM.chatContainer.style.display = 'flex';
  DOM.chatContainer.style.flexDirection = 'column';

  DOM.messagesList.innerHTML = '';
  chat.messages.forEach(msg => renderMessage(msg));

  scrollToBottom(true);
  setTimeout(() => {
    DOM.userInput.focus();
  }, 100);
  closeMobileSidebar();
}

function restoreActiveChat() {
  const id = Storage.getActiveChat();
  if (id && Storage.getChat(id)) {
    loadChat(id);
  } else {
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
      
