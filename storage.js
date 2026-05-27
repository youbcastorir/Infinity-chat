/**
 * Infinity AI — Storage Module
 * Manages chat persistence, settings, and data
 */

const Storage = (() => {
  const CHATS_KEY = 'infinity_chats';
  const SETTINGS_KEY = 'infinity_settings';
  const ACTIVE_KEY = 'infinity_active_chat';

  // ============ CHAT OPERATIONS ============

  function getAllChats() {
    try {
      const raw = localStorage.getItem(CHATS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function saveAllChats(chats) {
    try {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    } catch (e) {
      console.warn('Storage quota exceeded, pruning old chats...');
      pruneOldChats();
    }
  }

  function getChat(id) {
    const chats = getAllChats();
    return chats[id] || null;
  }

  function createChat(id) {
    const chats = getAllChats();
    const newChat = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      model: getSetting('model') || 'llama-3.3-70b-versatile'
    };
    chats[id] = newChat;
    saveAllChats(chats);
    return newChat;
  }

  function updateChat(id, updates) {
    const chats = getAllChats();
    if (!chats[id]) return;
    chats[id] = { ...chats[id], ...updates, updatedAt: Date.now() };
    saveAllChats(chats);
  }

  function deleteChat(id) {
    const chats = getAllChats();
    delete chats[id];
    saveAllChats(chats);
  }

  function addMessage(chatId, message) {
    const chats = getAllChats();
    if (!chats[chatId]) return;
    chats[chatId].messages.push(message);
    chats[chatId].updatedAt = Date.now();
    saveAllChats(chats);
  }

  function updateLastMessage(chatId, content) {
    const chats = getAllChats();
    if (!chats[chatId]) return;
    const msgs = chats[chatId].messages;
    if (msgs.length > 0) {
      msgs[msgs.length - 1].content = content;
      chats[chatId].updatedAt = Date.now();
      saveAllChats(chats);
    }
  }

  function getChatList() {
    const chats = getAllChats();
    return Object.values(chats)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }

  function pinChat(id, pinned) {
    updateChat(id, { pinned });
  }

  function renameChat(id, title) {
    updateChat(id, { title });
  }

  function pruneOldChats() {
    const chats = getAllChats();
    const sorted = Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt);
    if (sorted.length > 50) {
      const toRemove = sorted.slice(50);
      toRemove.forEach(c => delete chats[c.id]);
      try { localStorage.setItem(CHATS_KEY, JSON.stringify(chats)); } catch {}
    }
  }

  // ============ ACTIVE CHAT ============

  function getActiveChat() {
    return localStorage.getItem(ACTIVE_KEY) || null;
  }

  function setActiveChat(id) {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }

  // ============ SETTINGS ============

  function getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function getSetting(key) {
    return getSettings()[key] ?? null;
  }

  function setSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function setSettings(updates) {
    const settings = getSettings();
    Object.assign(settings, updates);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // ============ EXPORT / IMPORT ============

  function exportAllChats() {
    const chats = getAllChats();
    const settings = getSettings();
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      chats
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infinity-ai-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportSingleChat(id) {
    const chat = getChat(id);
    if (!chat) return;
    const blob = new Blob([JSON.stringify(chat, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importChats(data) {
    if (!data || typeof data !== 'object') return false;
    const chats = getAllChats();
    const imported = data.chats || {};
    let count = 0;
    Object.values(imported).forEach(chat => {
      if (chat.id && chat.messages) {
        chats[chat.id] = chat;
        count++;
      }
    });
    saveAllChats(chats);
    return count;
  }

  function clearAll() {
    localStorage.removeItem(CHATS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  }

  // ============ SEARCH ============

  function searchChats(query) {
    if (!query.trim()) return getChatList();
    const q = query.toLowerCase();
    return getChatList().filter(chat => {
      if (chat.title.toLowerCase().includes(q)) return true;
      return chat.messages.some(m =>
        typeof m.content === 'string' && m.content.toLowerCase().includes(q)
      );
    });
  }

  return {
    getAllChats, getChat, createChat, updateChat, deleteChat,
    addMessage, updateLastMessage, getChatList, pinChat, renameChat,
    getActiveChat, setActiveChat,
    getSetting, setSetting, getSettings, setSettings,
    exportAllChats, exportSingleChat, importChats, clearAll,
    searchChats
  };
})();
