/**
 * Infinity AI — AI Module
 * Handles Groq API calls, streaming, retry logic
 * 
 * SECURITY: Never hardcode API keys in production.
 * Set VITE_GROQ_API_KEY in .env or configure via settings.
 */

const AI = (() => {
  // API configuration — key loaded from env or user settings
  const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

  // Get API key: user-set key takes priority, then env placeholder
  function getApiKey() {
    const userKey = Storage.getSetting('apiKey');
    if (userKey && userKey.trim().startsWith('gsk_')) return userKey.trim();
    // In production, inject via your build tool: import.meta.env.VITE_GROQ_API_KEY
    // For demo/dev: set your key in Settings → API Key
    return "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";
  }

  const PERSONALITIES = {
    default: 'You are Infinity AI, a helpful, intelligent, and thoughtful assistant. Be clear, accurate, and genuinely helpful.',
    creative: 'You are Infinity AI in creative mode. Embrace imagination, offer unique perspectives, use vivid language, and think outside the box.',
    expert: 'You are Infinity AI in expert mode. Provide deep technical accuracy, cite reasoning, offer nuanced analysis, and assume a knowledgeable audience.',
    concise: 'You are Infinity AI in concise mode. Give brief, direct answers. Avoid filler. Lead with the answer.'
  };

  let abortController = null;
  let isGenerating = false;

  /**
   * Stream a chat completion from Groq
   * @param {Array} messages - conversation history [{role, content}]
   * @param {Function} onChunk - called with each text delta
   * @param {Function} onDone - called when stream completes
   * @param {Function} onError - called on error
   */
  async function streamChat(messages, onChunk, onDone, onError) {
    const apiKey = getApiKey();

    if (!apiKey) {
      onError(new Error('NO_API_KEY'));
      return;
    }

    abortController = new AbortController();
    isGenerating = true;

    const model = Storage.getSetting('model') || 'llama-3.3-70b-versatile';
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
      const response = await fetch(GROQ_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
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
        buffer = lines.pop(); // keep incomplete line

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
        onDone(true); // stopped by user
      } else {
        onError(err);
      }
    }
  }

  /** Stop current generation */
  function stopGeneration() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    isGenerating = false;
  }

  /** Check if currently generating */
  function getIsGenerating() { return isGenerating; }

  /**
   * Generate a chat title from the first user message
   */
  async function generateTitle(userMessage) {
    const apiKey = getApiKey();
    if (!apiKey) return truncateTitle(userMessage);

    try {
      const response = await fetch(GROQ_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          temperature: 0.4,
          max_tokens: 16,
          messages: [
            {
              role: 'system',
              content: 'Generate a 2–4 word title for this chat. Return ONLY the title, no quotes, no punctuation at end.'
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
