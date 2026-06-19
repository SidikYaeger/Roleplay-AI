/**
 * core/api.js
 * Multi-provider AI API module.
 * Supports: Google Gemini, DeepSeek (OpenAI-compatible)
 */

const GeminiAPI = (() => {

  // ──────────────────────────────────────────────────────
  // PROVIDER DETECTION
  // ──────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────
  // PROVIDER DETECTION
  // ──────────────────────────────────────────────────────

  function getProvider() {
    if (typeof CONFIG !== 'undefined' && CONFIG.provider) {
      return CONFIG.provider; // 'gemini' | 'openai'
    }
    const key = Storage.getApiKey();
    if (key.startsWith('sk-or-')) return 'openai'; // OpenRouter
    if (key.startsWith('sk-')) return 'openai';    // DeepSeek / Groq
    return 'gemini';
  }

  function getBaseUrl() {
    if (typeof CONFIG !== 'undefined' && CONFIG.baseUrl) {
      return CONFIG.baseUrl;
    }
    const key = Storage.getApiKey();
    if (key.startsWith('sk-or-')) return 'https://openrouter.ai/api/v1/chat/completions';
    return 'https://api.deepseek.com/chat/completions'; // Default fallback
  }

  // ──────────────────────────────────────────────────────
  // MAIN STREAM FUNCTION
  // ──────────────────────────────────────────────────────

  async function streamChat({ apiKey, model, systemPrompt, history, onChunk, onDone, onError }) {
    const provider = getProvider();

    if (provider === 'openai') {
      return streamOpenAICompatible({ apiKey, model, systemPrompt, history, onChunk, onDone, onError });
    } else {
      return streamGemini({ apiKey, model, systemPrompt, history, onChunk, onDone, onError });
    }
  }

  // ──────────────────────────────────────────────────────
  // GOOGLE GEMINI (SSE / v1beta)
  // ──────────────────────────────────────────────────────

  async function streamGemini({ apiKey, model, systemPrompt, history, onChunk, onDone, onError }) {
    const controller = new AbortController();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: history,
      generationConfig: {
        temperature: 1.05,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        let msg = `Error ${response.status}`;
        try { const e = await response.json(); msg = e?.error?.message || msg; } catch (_) {}
        throw new Error(msg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunk) { fullText += chunk; onChunk && onChunk(chunk); }
          } catch (_) {}
        }
      }

      onDone && onDone(fullText);
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError && onError(err);
    }

    return controller;
  }

  // ──────────────────────────────────────────────────────
  // OPENAI-COMPATIBLE (OpenRouter, DeepSeek, Groq)
  // ──────────────────────────────────────────────────────

  async function streamOpenAICompatible({ apiKey, model, systemPrompt, history, onChunk, onDone, onError }) {
    const controller = new AbortController();
    const targetUrl = getBaseUrl();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts?.[0]?.text ?? msg.text ?? '',
      })),
    ];

    const body = {
      model,
      messages,
      stream: true,
      max_tokens: typeof CONFIG !== 'undefined' && CONFIG.maxTokens ? CONFIG.maxTokens : 2048,
      temperature: 1.0,
      top_p: 0.95,
      ...(typeof CONFIG !== 'undefined' && CONFIG.extraBody ? CONFIG.extraBody : {})
    };

    const fwdHeaders = {
      'Authorization': `Bearer ${apiKey}`,
    };

    // OpenRouter specific headers (opsional tapi disarankan)
    if (targetUrl.includes('openrouter.ai')) {
      fwdHeaders['HTTP-Referer'] = 'http://localhost:8000';
      fwdHeaders['X-Title'] = 'Aether AI Roleplay';
    }

    // Jika NVIDIA NIM — kirim lewat proxy lokal untuk menghindari CORS
    const useProxy = targetUrl.includes('nvidia.com');
    const fetchUrl = useProxy ? '/api/chat' : targetUrl;
    const fetchHeaders = { 'Content-Type': 'application/json' };
    const fetchBody = useProxy
      ? JSON.stringify({ targetUrl, headers: fwdHeaders, payload: body })
      : JSON.stringify(body);

    if (!useProxy) fetchHeaders['Authorization'] = `Bearer ${apiKey}`;

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: fetchBody,
        signal: controller.signal,
      });

      if (!response.ok) {
        let msg = `Error ${response.status}`;
        try { const e = await response.json(); msg = e?.error?.message || msg; } catch (_) {}
        throw new Error(msg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed?.choices?.[0]?.delta?.content;
            if (chunk) { fullText += chunk; onChunk && onChunk(chunk); }
          } catch (_) {}
        }
      }

      onDone && onDone(fullText);
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError && onError(err);
    }

    return controller;
  }

  // ──────────────────────────────────────────────────────
  // VALIDATE API KEY
  // ──────────────────────────────────────────────────────

  async function validateApiKey(apiKey) {
    try {
      const provider = getProvider();
      if (provider === 'deepseek') {
        const response = await fetch('https://api.deepseek.com/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        return response.ok;
      } else {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        });
        return response.ok || response.status === 400;
      }
    } catch (_) {
      return false;
    }
  }

  return { streamChat, validateApiKey, getProvider };
})();
