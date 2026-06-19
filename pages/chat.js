/**
 * pages/chat.js
 * Satu sesi roleplay utama (global).
 * AI berperan sebagai GM/Narator yang memainkan semua karakter dalam cast.
 */

const ChatPage = (() => {

  let chatHistory    = []; // [{role, text, timestamp}]
  let isGenerating   = false;
  let abortController = null;

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────

  function render() {
    chatHistory = Storage.getMainSession();
    const characters = Storage.getCharacters();

    const castBadges = characters.slice(0, 5).map(c => {
      const initial = (c.name || '?').charAt(0).toUpperCase();
      if (c.avatarUrl) {
        return `<div class="cast-badge" title="${escapeHtml(c.name)}"><img src="${escapeHtml(c.avatarUrl)}" alt="${escapeHtml(c.name)}" onerror="this.parentElement.textContent='${initial}'"></div>`;
      }
      return `<div class="cast-badge" title="${escapeHtml(c.name)}" style="font-family:var(--font-display);font-size:12px;">${initial}</div>`;
    }).join('');

    const moreBadge = characters.length > 5
      ? `<div class="cast-badge cast-badge-more" title="${characters.length - 5} karakter lainnya">+${characters.length - 5}</div>`
      : '';

    const provider = Storage.getProvider();
    const modelName = Storage.getModel().split('/').pop();

    const html = `
      <div class="page chat-page" id="chat-page">

        <!-- Header -->
        <div class="chat-header">
          <button class="btn-back" onclick="ChatPage.handleBack()" style="padding:6px 10px;margin-right:4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div class="chat-header-avatar" style="background:linear-gradient(135deg,#7c3aed,#c084fc);display:flex;align-items:center;justify-content:center;font-size:18px;" aria-hidden="true">✦</div>
          <div class="chat-header-info">
            <div class="chat-header-name">Aether Roleplay</div>
            <div class="chat-header-cast">
              ${characters.length > 0
                ? `${castBadges}${moreBadge}<span class="cast-label">${characters.length} karakter aktif</span>`
                : `<span class="cast-label" style="color:var(--text-muted)">Belum ada karakter — AI bebas berkreasi</span>`
              }
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="btn-icon" onclick="ChatPage.regenerate()" id="regen-btn" title="Buat ulang respons terakhir">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
            </button>
            <button class="btn-icon" onclick="ChatPage.confirmClear()" title="Hapus riwayat & mulai cerita baru">
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
              placeholder="Ceritakan aksi atau perkataanmu dalam dunia ini..."
              rows="1"
              onkeydown="ChatPage.handleKeyDown(event)"
              oninput="ChatPage.autoResize(this)"
            ></textarea>
            <button class="chat-send-btn" id="send-btn" onclick="ChatPage.sendMessage()" title="Kirim (Enter)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <p class="chat-input-info">Enter untuk kirim · Shift+Enter baris baru · ✦ ${escapeHtml(modelName)}</p>
        </div>

      </div>
    `;

    document.getElementById('app').innerHTML = html;
    renderAllMessages();
  }

  // ──────────────────────────────────────────────────────
  // MESSAGE RENDERING
  // ──────────────────────────────────────────────────────

  /**
   * Parse text: pisahkan narasi (*...*) dan dialog (**Nama:** "...")
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
      // Render bold **Name:** dalam dialog
      const dialogHtml = escapeHtml(part.text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      return `<div class="msg-dialog">${dialogHtml}</div>`;
    }).join('');
  }

  function createAiMessageEl(msg) {
    const div = document.createElement('div');
    div.className = 'msg-group ai';
    div.innerHTML = `
      <div class="msg-avatar narrator-avatar" title="Narator / GM" aria-hidden="true">✦</div>
      <div class="msg-content">
        <div class="msg-name">Narator</div>
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
      renderWelcomeState(container);
      return;
    }

    chatHistory.forEach(msg => {
      const el = msg.role === 'model' ? createAiMessageEl(msg) : createUserMessageEl(msg);
      container.appendChild(el);
    });

    scrollToBottom(false);
  }

  function renderWelcomeState(container) {
    const characters = Storage.getCharacters();
    const persona = Storage.getPersona();

    const castList = characters.length > 0
      ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:12px;">
          ${characters.map(c => `<span style="background:var(--bg-surface-2);border:1px solid var(--border);border-radius:20px;padding:3px 12px;font-size:12px;color:var(--text-secondary);">✦ ${escapeHtml(c.name)}</span>`).join('')}
         </div>`
      : `<p style="font-size:13px;color:var(--text-muted);font-style:italic;margin-top:8px;">Belum ada karakter — AI bebas berkreasi</p>`;

    const div = document.createElement('div');
    div.className = 'chat-welcome';
    div.id = 'chat-welcome';
    div.innerHTML = `
      <div style="font-size:48px;margin-bottom:12px;">✦</div>
      <div class="chat-welcome-name">Aether Roleplay</div>
      <p style="font-size:14px;color:var(--text-muted);font-family:var(--font-narrative);font-style:italic;margin-top:4px;">
        Selamat datang, <strong style="color:var(--primary-light)">${escapeHtml(persona.name || 'Petualang')}</strong>.<br>
        Ceritamu dimulai dari sini.
      </p>
      ${castList}
      <p style="font-size:12px;color:var(--text-muted);margin-top:20px;font-style:italic;">Ketik aksi atau perkataanmu untuk memulai petualangan...</p>
    `;
    container.appendChild(div);
  }

  function addTypingIndicator() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    document.getElementById('chat-welcome')?.remove();

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="msg-avatar narrator-avatar" aria-hidden="true">✦</div>
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
    div.innerHTML = `
      <div class="msg-avatar narrator-avatar" aria-hidden="true">✦</div>
      <div class="msg-content">
        <div class="msg-name">Narator</div>
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
    if (!apiKey) { App.showToast('API Key belum diisi di config.js', 'error'); return; }

    input.value = '';
    autoResize(input);
    setGenerating(true);

    const userMsg = { role: 'user', text: userText, timestamp: Date.now() };
    chatHistory.push(userMsg);

    const container = document.getElementById('chat-messages');
    document.getElementById('chat-welcome')?.remove();
    container.appendChild(createUserMessageEl(userMsg));
    scrollToBottom();

    addTypingIndicator();
    await new Promise(r => setTimeout(r, 400));
    removeTypingIndicator();
    createStreamingMessageEl();

    // Kirim semua karakter sebagai cast ke GM prompt
    const characters = Storage.getCharacters();
    const systemPrompt = PromptBuilder.buildSystemPrompt(characters, Storage.getPersona());
    const apiHistory   = PromptBuilder.toApiHistory(chatHistory);
    const model        = Storage.getModel();

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

        const aiMsg = { role: 'model', text: fullResponse, timestamp: Date.now() };
        chatHistory.push(aiMsg);
        Storage.saveMainSession(chatHistory);

        setGenerating(false);
      },
      onError: (err) => {
        document.getElementById('streaming-msg')?.remove();
        chatHistory.pop();
        App.showToast(`Error: ${err.message}`, 'error');
        setGenerating(false);
        if (input) { input.value = userText; autoResize(input); }
        if (chatHistory.length === 0) renderWelcomeState(document.getElementById('chat-messages'));
      }
    });
  }

  async function regenerate() {
    if (isGenerating) return;
    if (chatHistory.length < 1) return;

    const apiKey = Storage.getApiKey();
    if (!apiKey) { App.showToast('API Key belum diisi di config.js', 'error'); return; }

    if (chatHistory[chatHistory.length - 1]?.role === 'model') {
      chatHistory.pop();
    }

    const container = document.getElementById('chat-messages');
    const aiGroups = container.querySelectorAll('.msg-group.ai');
    aiGroups[aiGroups.length - 1]?.remove();

    if (chatHistory.length === 0) { renderWelcomeState(container); return; }

    setGenerating(true);
    addTypingIndicator();
    await new Promise(r => setTimeout(r, 400));
    removeTypingIndicator();
    createStreamingMessageEl();

    const characters   = Storage.getCharacters();
    const systemPrompt = PromptBuilder.buildSystemPrompt(characters, Storage.getPersona());
    const apiHistory   = PromptBuilder.toApiHistory(chatHistory);
    const model        = Storage.getModel();
    let fullResponse   = '';

    abortController = await GeminiAPI.streamChat({
      apiKey, model, systemPrompt,
      history: apiHistory,
      onChunk: (chunk) => { fullResponse += chunk; updateStreamingBubble(fullResponse); },
      onDone: (text) => {
        fullResponse = text;
        finalizeStreamingBubble(fullResponse);
        chatHistory.push({ role: 'model', text: fullResponse, timestamp: Date.now() });
        Storage.saveMainSession(chatHistory);
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
      title: 'Mulai Cerita Baru?',
      message: 'Seluruh riwayat roleplay akan dihapus dan cerita akan dimulai dari awal. Tindakan ini tidak bisa dibatalkan.',
      confirmText: 'Hapus & Mulai Baru',
      onConfirm: () => {
        chatHistory = [];
        Storage.deleteMainSession();
        renderAllMessages();
        App.showToast('Cerita baru dimulai. ✦', 'info');
      }
    });
  }

  // ──────────────────────────────────────────────────────
  // UI HELPERS
  // ──────────────────────────────────────────────────────

  function setGenerating(state) {
    isGenerating = state;
    const sendBtn  = document.getElementById('send-btn');
    const regenBtn = document.getElementById('regen-btn');
    const input    = document.getElementById('chat-input');
    if (sendBtn)  sendBtn.disabled  = state;
    if (regenBtn) regenBtn.disabled = state;
    if (input)    input.disabled    = state;
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

  // Cursor blink animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .narrator-avatar {
      background: linear-gradient(135deg, #7c3aed, #c084fc);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; color: white;
    }
    .cast-badge {
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--bg-surface-2); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; overflow: hidden; flex-shrink: 0;
    }
    .cast-badge img { width: 100%; height: 100%; object-fit: cover; }
    .cast-badge-more { background: var(--primary); border-color: var(--primary); color: white; font-size: 9px; }
    .chat-header-cast { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
    .cast-label { font-size: 11px; color: var(--text-muted); font-family: var(--font-body); }
  `;
  document.head.appendChild(style);

  return {
    render, sendMessage, regenerate, confirmClear,
    handleKeyDown, autoResize, handleBack,
  };
})();
