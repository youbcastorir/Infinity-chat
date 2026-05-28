/**
 * Infinity AI — AI Module
 * Powered by OpenRouter API with streaming support
 */

const AI = (() => {
  const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const API_KEY = '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';

  function getApiKey() {
    const userKey = Storage.getSetting('apiKey');
    if (userKey && userKey.trim().length > 10) return userKey.trim();
    return API_KEY;
  }

  const PERSONALITIES = {
    default: 'You are Infinity AI, a helpful, intelligent, and thoughtful assistant. Be clear, accurate, and genuinely helpful.',
    creative: 'You are Infinity AI in creative mode. Embrace imagination, offer unique perspectives, use vivid language, and think outside the box.',
    expert: 'You are Infinity AI in expert mode. Provide deep technical accuracy, cite reasoning, offer nuanced analysis, and assume a knowledgeable audience.',
    concise: 'You are Infinity AI in concise mode. Give brief, direct answers. Avoid filler. Lead with the answer.'
  };

  // Map model names to OpenRouter model IDs
  const MODEL_MAP = {
    'llama-3.3-70b-versatile':        'meta-llama/llama-3.3-70b-instruct',
    'llama-3.1-8b-instant':           'meta-llama/llama-3.1-8b-instruct:free',
    'mixtral-8x7b-32768':             'mistralai/mixtral-8x7b-instruct',
    'gemma2-9b-it':                   'google/gemma-2-9b-it:free',
    'deepseek-r1-distill-llama-70b':  'deepseek/deepseek-r1-distill-llama-70b:free',
    'qwen-qwq-32b':                   'qwen/qwq-32b:free'
  };

  let abortController = null;
  let isGenerating = false;

  async function streamChat(messages, onChunk, onDone, onError) {
    const apiKey = getApiKey();

    if (!apiKey) {
      onError(new Error('NO_API_KEY'));
      return;
    }

    abortController = new AbortController();
    isGenerating = true;

    const selectedModel = Storage.getSetting('model') || 'llama-3.3-70b-versatile';
    const model = MODEL_MAP[selectedModel] || 'meta-llama/llama-3.3-70b-instruct';
    const temperature = parseFloat(Storage.getSetting('temperature') || '0.7');
    const maxTokens = parseInt(Storage.getSetting('maxTokens') || '4096');
    const personality = Storage.getSetting('personality') || 'default';
    const systemPromptOverride = Storage.getSetting('systemPrompt') || '';

    const systemContent = systemPromptOverride.trim()
      ? systemPromptOverride.trim()
      : PERSONALITIES[personality] || PERSONALITIES.default;

    const payload = {
      model,
      temperature,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: 'system', content: systemContent },
        ...messages
      ]
    };

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Infinity AI'
        },
        body: JSON.stringify(payload),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) onChunk(delta);
          } catch (e) {
            // skip malformed chunk
          }
        }
      }

      isGenerating = false;
      onDone();

    } catch (err) {
      isGenerating = false;
      if (err.name === 'AbortError') {
        onDone(true);
      } else {
        onError(err);
      }
    }
  }

  function stopGeneration() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    isGenerating = false;
  }

  function getIsGenerating() { return isGenerating; }

  async function generateTitle(userMessage) {
    const apiKey = getApiKey();
    if (!apiKey) return truncateTitle(userMessage);

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Infinity AI'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          temperature: 0.4,
          max_tokens: 16,
          messages: [
            {
              role: 'system',
              content: 'Generate a 2-4 word title for this chat. Return ONLY the title, no quotes, no punctuation at end.'
            },
            { role: 'user', content: userMessage.slice(0, 300) }
          ]
        })
      });

      if (!response.ok) return truncateTitle(userMessage);
      const data = await response.json();
      const title = data.choices?.[0]?.message?.content?.trim();
      return title || truncateTitle(userMessage);
    } catch {
      return truncateTitle(userMessage);
    }
  }

  function truncateTitle(text) {
    const clean = text.replace(/\n/g, ' ').trim();
    return clean.length > 40 ? clean.slice(0, 40) + '…' : clean;
  }

  return { streamChat, stopGeneration, getIsGenerating, generateTitle, getApiKey };
})();
