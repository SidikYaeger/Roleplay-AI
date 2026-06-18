/**
 * core/storage.js
 * Manages all local data persistence using localStorage.
 * Data: Characters, Chat Sessions, User Persona, App Settings.
 */

const Storage = (() => {
  const KEYS = {
    CHARACTERS: 'aether_characters',
    SESSIONS:   'aether_sessions',
    PERSONA:    'aether_persona',
    SETTINGS:   'aether_settings',
  };

  // --- Helpers ---
  function read(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Storage read error [${key}]:`, e);
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage write error [${key}]:`, e);
    }
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // --- Characters ---
  function getCharacters() {
    return read(KEYS.CHARACTERS) || [];
  }

  function getCharacterById(id) {
    return getCharacters().find(c => c.id === id) || null;
  }

  function saveCharacter(characterData) {
    const characters = getCharacters();
    const existing = characters.findIndex(c => c.id === characterData.id);
    if (existing >= 0) {
      characters[existing] = { ...characters[existing], ...characterData, updatedAt: Date.now() };
    } else {
      characters.unshift({
        ...characterData,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    write(KEYS.CHARACTERS, characters);
    return characters.find(c => c.id === characterData.id) || characters[0];
  }

  function deleteCharacter(id) {
    const characters = getCharacters().filter(c => c.id !== id);
    write(KEYS.CHARACTERS, characters);
    // Also delete session
    deleteSession(id);
  }

  // --- Sessions (Chat History) ---
  function getAllSessions() {
    return read(KEYS.SESSIONS) || {};
  }

  function getSession(characterId) {
    const sessions = getAllSessions();
    return sessions[characterId] || [];
  }

  function saveSession(characterId, history) {
    const sessions = getAllSessions();
    sessions[characterId] = history;
    write(KEYS.SESSIONS, sessions);
  }

  function deleteSession(characterId) {
    const sessions = getAllSessions();
    delete sessions[characterId];
    write(KEYS.SESSIONS, sessions);
  }

  function getLastSessionPreview(characterId) {
    const history = getSession(characterId);
    if (!history || history.length === 0) return null;
    const lastAiMsg = [...history].reverse().find(m => m.role === 'model');
    if (!lastAiMsg) return null;
    const text = lastAiMsg.parts?.[0]?.text || '';
    // Strip narrative markers and trim
    return text.replace(/\*[^*]+\*/g, '').trim().slice(0, 80) || null;
  }

  // --- Persona ---
  function getPersona() {
    return read(KEYS.PERSONA) || {
      name: 'Petualang',
      description: 'Seorang petualang misterius dengan masa lalu yang tidak diketahui.',
    };
  }

  function savePersona(persona) {
    write(KEYS.PERSONA, persona);
  }

  // --- Settings ---
  function getSettings() {
    const saved = read(KEYS.SETTINGS) || {};

    // Auto-migrate deprecated model names
    const deprecated = ['gemini-1.5-pro', 'gemini-1.5-pro-latest', 'gemini-pro'];
    if (deprecated.includes(saved.model)) {
      saved.model = 'gemini-2.0-flash';
      write(KEYS.SETTINGS, saved);
    }

    return {
      apiKey: '',
      model: 'gemini-2.0-flash',
      ...saved,
    };
  }

  function saveSettings(settings) {
    write(KEYS.SETTINGS, settings);
  }

  function getApiKey() {
    // Prioritaskan CONFIG dari config.js (file lokal)
    if (typeof CONFIG !== 'undefined' &&
        CONFIG.apiKey &&
        !CONFIG.apiKey.includes('MASUKKAN_')) {
      return CONFIG.apiKey;
    }
    return getSettings().apiKey || '';
  }

  function getModel() {
    // Prioritaskan CONFIG dari config.js (file lokal)
    if (typeof CONFIG !== 'undefined' && CONFIG.model) {
      return CONFIG.model;
    }
    return getSettings().model || 'gemini-2.0-flash';
  }

  function getProvider() {
    if (typeof CONFIG !== 'undefined' && CONFIG.provider) {
      return CONFIG.provider;
    }
    const key = getApiKey();
    if (key.startsWith('sk-')) return 'deepseek';
    return 'gemini';
  }

  return {
    generateId,
    getCharacters, getCharacterById, saveCharacter, deleteCharacter,
    getSession, saveSession, deleteSession, getLastSessionPreview,
    getPersona, savePersona,
    getSettings, saveSettings, getApiKey, getModel, getProvider,
  };
})();
