/**
 * pages/chat.js
 * The main roleplay chat interface with streaming, narration rendering,
 * and session history persistence.
 */

const ChatPage = (() => {

  let currentChar    = null;
  let chatHistory    = []; // Internal format: [{role, text, timestamp}]
  let isGenerating   = false;
  let abortController = null;
  let streamingMsgEl  = null;

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────

  function render(charId) {
    currentChar = Storage.getCharacterById(charId);
    if (!currentChar) { App.navigate('home'); return; }

    chatHistory = Storage.getSession(charId);

    const avatarHtml = buildAvatarHtml(currentChar, 'chat-header-avatar');

    const html = `
      <div class="page chat-page" id="chat-page">

        <!-- Header -->
        <div class="chat-header">
          <button class="btn-back" onclick="ChatPage.handleBack()" style="padding: 6px 10px; margin-right: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          ${avatarHtml}
          <div class="chat-header-info">
            <div class="chat-header-name">${escapeHtml(currentChar.name)}</div>
            <div class="chat-header-status">
              <span class="dot"></span>
              <span>Siap berakting</span>
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="btn-icon" onclick="ChatPage.regenerate()" id="regen-btn" title="Buat ulang respons terakhir">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
            </button>
            <button class="btn-icon" onclick="ChatPage.confirmClear()" title="Hapus riwayat">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="chat-messages" id="chat-messages"></div>

        <!-- Input -->
        <div class="chat-input-area">
          <div class="chat-input-wrap">
            <textarea
              id="chat-input"
              class="chat-input-field"
              placeholder="Tuliskan aksimu atau perkataanmu..."
              rows="1"
              onkeydown="ChatPage.handleKeyDown(event)"
              oninput="ChatPage.autoResize(this)"
            ></textarea>
            <button class="chat-send-btn" id="send-btn" onclick="ChatPage.sendMessage()" title="Kirim (Enter)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <p class="chat-input-info">Enter untuk kirim · Shift+Enter untuk baris baru · ${Storage.getProvider() === 'deepseek' ? '🐋 DeepSeek' : '✦ Gemini'}: ${escapeHtml(Storage.getModel())}</p>
        </div>

      </div>
    `;

    document.getElementById('app').innerHTML = html;
    renderAllMessages();
  }

  // ──────────────────────────────────────────────────────
  // MESSAGE RENDERING
  // ──────────────────────────────────────────────────────

  function buildAvatarHtml(char, cls) {
    if (char.avatarUrl) {
      return `<div class="${cls}"><img src="${escapeHtml(char.avatarUrl)}" alt="${escapeHtml(char.name)}" onerror="this.parentElement.textContent='${escapeHtml(char.name.charAt(0).toUpperCase())}'"></div>`;
    }
    const initial = (char.name || '?').charAt(0).toUpperCase();
    return `<div class="${cls}" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:18px;">${initial}</div>`;
  }

  /**
   * Parses message text: splits into narrative (*...*) and dialog parts.
   * Returns an array of {type: 'narrative'|'dialog', text} objects.
   */
  function parseMessageText(text) {
    const parts = [];
    const regex = /\*([^*]+)\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const dialogText = text.slice(lastIndex, match.index).trim();
        if (dialogText) parts.push({ type: 'dialog', text: dialogText });
      }
      parts.push({ type: 'narrative', text: match[1].trim() });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex).trim();
      if (remaining) parts.push({ type: 'dialog', text: remaining });
    }

    return parts.length ? parts : [{ type: 'dialog', text }];
  }

  function renderParsedText(text) {
    const parts = parseMessageText(text);
    return parts.map(part => {
      if (part.type === 'narrative') {
        return `<div class="msg-narrative">${escapeHtml(part.text)}</div>`;
      }
      return `<div class="msg-dialog">${escapeHtml(part.text)}</div>`;
    }).join('');
  }

  function createAiMessageEl(msg) {
    const persona = Storage.getPersona();
    const char = currentChar;
    const avatarHtml = buildAvatarHtml(char, 'msg-avatar');

    const div = document.createElement('div');
    div.className = 'msg-group ai';
    div.innerHTML = `
      ${avatarHtml}
      <div class="msg-content">
        <div class="msg-name">${escapeHtml(char.name)}</div>
        <div class="msg-bubble">${renderParsedText(msg.text)}</div>
      </div>
    `;
    return div;
  }

  function createUserMessageEl(msg) {
    const persona = Storage.getPersona();
    const initial = (persona.name || 'P').charAt(0).toUpperCase();
    const div = document.createElement('div');
    div.className = 'msg-group user';
    div.innerHTML = `
      <div class="msg-avatar" style="background:linear-gradient(135deg,#0891b2,#2dd4bf);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;">${initial}</div>
      <div class="msg-content">
        <div class="msg-name" style="text-align:right;">${escapeHtml(persona.name || 'Kamu')}</div>
        <div class="msg-bubble">${escapeHtml(msg.text)}</div>
      </div>
    `;
    return div;
  }

  function renderAllMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.innerHTML = '';

    if (chatHistory.length === 0) {
      // Show welcome / opening message state
      renderWelcomeState(container);
      return;
    }

    chatHistory.forEach(msg => {
      const el = msg.role === 'model' ? createAiMessageEl(msg) : createUserMessageEl(msg);
      container.appendChild(el);
    });

    scrollToBottom();
  }

  function renderWelcomeState(container) {
    const char = currentChar;
    const avatarHtml = buildAvatarHtml(char, 'chat-welcome-avatar');
    const opening = char.openingMessage;

    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'chat-welcome';
    welcomeDiv.id = 'chat-welcome';
    welcomeDiv.innerHTML = `
      ${avatarHtml}
      <div class="chat-welcome-name">${escapeHtml(char.name)}</div>
      ${opening
        ? `<div class="chat-welcome-opening">${renderParsedText(opening)}</div>
           <p style="font-size:12px;color:var(--text-muted);font-family:var(--font-narrative);font-style:italic;">Ketik sesuatu untuk memulai petualanganmu...</p>`
        : `<p style="font-size:14px;color:var(--text-muted);font-family:var(--font-narrative);font-style:italic;">Siap untuk bertemu <strong style="color:var(--primary-light)">${escapeHtml(char.name)}</strong>?<br>Ketik sesuatu untuk memulai roleplay...</p>`
      }
    `;
    container.appendChild(welcomeDiv);
  }

  function addTypingIndicator() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    // Remove welcome if exists
    document.getElementById('chat-welcome')?.remove();

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';

    const avatarHtml = buildAvatarHtml(currentChar, 'msg-avatar');
    indicator.innerHTML = `
      ${avatarHtml}
      <div class="msg-bubble" style="background:var(--bg-surface-2);border:1px solid var(--border);">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    container.appendChild(indicator);
    scrollToBottom();
    return indicator;
  }

  function removeTypingIndicator() {
    document.getElementById('typing-indicator')?.remove();
  }

  function createStreamingMessageEl() {
    const container = document.getElementById('chat-messages');
    if (!container) return null;

    const div = document.createElement('div');
    div.className = 'msg-group ai';
    div.id = 'streaming-msg';

    const avatarHtml = buildAvatarHtml(currentChar, 'msg-avatar');
    div.innerHTML = `
      ${avatarHtml}
      <div class="msg-content">
        <div class="msg-name">${escapeHtml(currentChar.name)}</div>
        <div class="msg-bubble" id="streaming-bubble"><span class="streaming-cursor">▋</span></div>
      </div>
    `;
    container.appendChild(div);
    scrollToBottom();
    return div;
  }

  function updateStreamingBubble(fullText) {
    const bubble = document.getElementById('streaming-bubble');
    if (!bubble) return;
    bubble.innerHTML = renderParsedText(fullText) + '<span class="streaming-cursor" style="animation:cursor-blink 0.8s step-end infinite;color:var(--primary-light);">▋</span>';
    scrollToBottom();
  }

  function finalizeStreamingBubble(fullText) {
    const msgEl = document.getElementById('streaming-msg');
    if (msgEl) {
      msgEl.id = '';
      const bubble = document.getElementById('streaming-bubble');
      if (bubble) {
        bubble.id = '';
        bubble.innerHTML = renderParsedText(fullText);
      }
    }
  }

  function scrollToBottom(smooth = true) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  }

  // ──────────────────────────────────────────────────────
  // SENDING MESSAGES
  // ──────────────────────────────────────────────────────

  async function sendMessage() {
    if (isGenerating) return;

    const input = document.getElementById('chat-input');
    const userText = input?.value?.trim();
    if (!userText) return;

    const apiKey = Storage.getApiKey();
    if (!apiKey) { App.openApiModal(true); return; }

    // Clear input
    input.value = '';
    autoResize(input);
    setGenerating(true);

    // Add user message to history
    const userMsg = { role: 'user', text: userText, timestamp: Date.now() };
    chatHistory.push(userMsg);

    // Render user message
    const container = document.getElementById('chat-messages');
    document.getElementById('chat-welcome')?.remove();
    container.appendChild(createUserMessageEl(userMsg));
    scrollToBottom();

    // Show typing indicator, then swap to streaming bubble
    addTypingIndicator();
    await new Promise(r => setTimeout(r, 400));
    removeTypingIndicator();

    // Create streaming element
    createStreamingMessageEl();

    // Build history for API (Gemini format)
    const apiHistory = PromptBuilder.toApiHistory(chatHistory);
    const systemPrompt = PromptBuilder.buildSystemPrompt(currentChar, Storage.getPersona());
    const model = Storage.getModel();

    let fullResponse = '';

    abortController = await GeminiAPI.streamChat({
      apiKey,
      model,
      systemPrompt,
      history: apiHistory,
      onChunk: (chunk) => {
        fullResponse += chunk;
        updateStreamingBubble(fullResponse);
      },
      onDone: (text) => {
        fullResponse = text;
        finalizeStreamingBubble(fullResponse);

        // Save to history
        const aiMsg = { role: 'model', text: fullResponse, timestamp: Date.now() };
        chatHistory.push(aiMsg);
        Storage.saveSession(currentChar.id, chatHistory);

        setGenerating(false);
      },
      onError: (err) => {
        document.getElementById('streaming-msg')?.remove();
        chatHistory.pop(); // Remove user message that failed

        App.showToast(`Error: ${err.message}`, 'error');
        setGenerating(false);

        // Restore input
        if (input) { input.value = userText; autoResize(input); }

        // Re-render (may need to show welcome again)
        if (chatHistory.length === 0) {
          renderWelcomeState(document.getElementById('chat-messages'));
        }
      }
    });
  }

  async function regenerate() {
    if (isGenerating) return;
    if (chatHistory.length < 1) return;

    const apiKey = Storage.getApiKey();
    if (!apiKey) { App.openApiModal(true); return; }

    // Remove last AI message if it exists
    if (chatHistory[chatHistory.length - 1]?.role === 'model') {
      chatHistory.pop();
    }

    // Remove last rendered AI message
    const container = document.getElementById('chat-messages');
    const aiGroups = container.querySelectorAll('.msg-group.ai');
    aiGroups[aiGroups.length - 1]?.remove();

    if (chatHistory.length === 0) { renderWelcomeState(container); return; }

    setGenerating(true);
    addTypingIndicator();
    await new Promise(r => setTimeout(r, 400));
    removeTypingIndicator();
    createStreamingMessageEl();

    const apiHistory = PromptBuilder.toApiHistory(chatHistory);
    const systemPrompt = PromptBuilder.buildSystemPrompt(currentChar, Storage.getPersona());
    const model = Storage.getModel();
    let fullResponse = '';

    abortController = await GeminiAPI.streamChat({
      apiKey, model, systemPrompt,
      history: apiHistory,
      onChunk: (chunk) => { fullResponse += chunk; updateStreamingBubble(fullResponse); },
      onDone: (text) => {
        fullResponse = text;
        finalizeStreamingBubble(fullResponse);
        chatHistory.push({ role: 'model', text: fullResponse, timestamp: Date.now() });
        Storage.saveSession(currentChar.id, chatHistory);
        setGenerating(false);
      },
      onError: (err) => {
        document.getElementById('streaming-msg')?.remove();
        App.showToast(`Error: ${err.message}`, 'error');
        setGenerating(false);
      }
    });
  }

  function confirmClear() {
    App.showConfirm({
      icon: '🗑️',
      title: 'Hapus Riwayat Chat?',
      message: `Seluruh riwayat percakapan dengan ${currentChar.name} akan dihapus. Sesi roleplay akan dimulai dari awal.`,
      confirmText: 'Hapus & Mulai Baru',
      onConfirm: () => {
        chatHistory = [];
        Storage.deleteSession(currentChar.id);
        renderAllMessages();
        App.showToast('Riwayat chat telah dihapus. Cerita baru dimulai. ✦', 'info');
      }
    });
  }

  // ──────────────────────────────────────────────────────
  // UI HELPERS
  // ──────────────────────────────────────────────────────

  function setGenerating(state) {
    isGenerating = state;
    const sendBtn = document.getElementById('send-btn');
    const regenBtn = document.getElementById('regen-btn');
    const input = document.getElementById('chat-input');
    if (sendBtn) sendBtn.disabled = state;
    if (regenBtn) regenBtn.disabled = state;
    if (input) input.disabled = state;
    if (!state && input) input.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }

  function handleBack() {
    if (isGenerating && abortController) {
      abortController.abort?.();
    }
    App.navigate('home');
  }

  // Add cursor blink CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes cursor-blink {
      0%, 100% { opacity: 1; } 50% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  return {
    render, sendMessage, regenerate, confirmClear,
    handleKeyDown, autoResize, handleBack,
  };
})();
