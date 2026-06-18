/**
 * core/api.js
 * Handles all communication with the Google Gemini API.
 * Supports streaming responses via Server-Sent Events (SSE).
 */

const GeminiAPI = (() => {
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  /**
   * Streams a response from the Gemini API.
   * @param {object} params
   * @param {string} params.apiKey
   * @param {string} params.model
   * @param {string} params.systemPrompt
   * @param {Array}  params.history  - Array of {role, parts} objects
   * @param {function} params.onChunk - Called with each text chunk (string)
   * @param {function} params.onDone  - Called when stream is complete with full text
   * @param {function} params.onError - Called on error with Error object
   * @returns {AbortController} - Can be used to cancel the stream
   */
  async function streamChat({ apiKey, model, systemPrompt, history, onChunk, onDone, onError }) {
    const controller = new AbortController();
    const url = `${BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const body = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
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
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          errorMsg = errData?.error?.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
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
        // Keep the last potentially-incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunk) {
              fullText += chunk;
              onChunk && onChunk(chunk);
            }
          } catch (parseErr) {
            // Ignore malformed JSON chunks
          }
        }
      }

      onDone && onDone(fullText);
    } catch (err) {
      if (err.name === 'AbortError') return; // Cancelled by user
      onError && onError(err);
    }

    return controller;
  }

  /**
   * Simple non-streaming API call (for testing/validation).
   */
  async function generateContent({ apiKey, model, systemPrompt, history }) {
    const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: history,
      generationConfig: { temperature: 1.0, maxOutputTokens: 2048 },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData?.error?.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Validates an API key by making a minimal request.
   */
  async function validateApiKey(apiKey) {
    try {
      const url = `${BASE_URL}/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Halo' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });
      return response.ok || response.status === 400; // 400 = valid key but bad request
    } catch (_) {
      return false;
    }
  }

  return { streamChat, generateContent, validateApiKey };
})();
