// ============================================================
//  config.example.js — Template Konfigurasi
//  Salin file ini menjadi config.js, lalu isi API key Anda.
//  File ini AMAN untuk di-commit ke GitHub.
// ============================================================

const CONFIG = {

  // ── OPSI 1: OpenRouter (GRATIS & TERBAIK SAAT INI) ─────────
  // OpenRouter menyediakan model Gemini 2.0 Flash secara GRATIS 100%
  // tanpa perlu kartu kredit.
  // API Key: https://openrouter.ai/settings/keys (dimulai sk-or-v1-...)
  provider: 'openai',
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  apiKey: 'MASUKKAN_API_KEY_OPENROUTER_DI_SINI',
  model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
  // model gratis lainnya di OpenRouter:
  // - google/gemini-2.0-pro-exp-02-05:free
  // - meta-llama/llama-3-8b-instruct:free

  // ── OPSI 2: Google Gemini (Direct API) ────────────────────
  // Butuh kartu kredit/billing aktif untuk menghindari Quota 0
  // API Key: https://aistudio.google.com/app/apikey (dimulai AIzaSy... atau AQ.Ab8...)
  // provider: 'gemini',
  // apiKey: 'AIzaSy...',
  // model: 'gemini-2.0-flash',

  // ── OPSI 3: DeepSeek ─────────────────────────────────────
  // API Key: https://platform.deepseek.com/api_keys (dimulai sk-...)
  // provider: 'openai',
  // baseUrl: 'https://api.deepseek.com/chat/completions',
  // apiKey: 'sk-...',
  // model: 'deepseek-chat',

};
