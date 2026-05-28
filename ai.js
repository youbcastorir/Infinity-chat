/**
 * Infinity AI — AI Module
 * Handles Groq API calls, streaming, and error handling
 */

const AI = (() => {
  // الرابط الخاص بـ Groq API
  const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

  function getApiKey() {
    const userKey = Storage.getSetting('apiKey');
    // إذا قام المستخدم بوضع مفتاح في الإعدادات يبدأ بـ gsk_ يتم استخدامه
    if (userKey && userKey.trim().startsWith('gsk_')) return userKey.trim();
    
    // المفتاح الافتراضي الخاص بك من Groq
    return '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';
  }

  const PERSONALITIES = {
    default: 'You are Infinity AI, a helpful, intelligent, and thoughtful assistant. Be clear, accurate, and genuinely helpful.',
    creative: 'You are Infinity AI in creative mode. Embrace imagination, offer unique perspectives, use vivid language, and think outside the box.',
    expert: 'You are Infinity AI in expert mode. Provide deep technical accuracy, cite reasoning, offer nuanced analysis, and assume a knowledgeable audience.',
    concise: 'You are Infinity AI in concise mode. Give brief, direct answers. Avoid filler. Lead with the answer.'
  };

  // أسماء النماذج الافتراضية المتوافقة مع خوادم Groq الحالية
  const MODEL_MAP = {
    'llama-3.3-70b-versatile':        'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant':           'llama-3.1-8b-instant',
    'mixtral-8x7b-32768':             'mixtral-8x7b-32768',
    'gemma2-9b-it':                   'gemma2-9b-it',
    'deepseek-r1-distill-llama-70b':  'deepseek-r1-distill-llama-70b',
    'qwen-qwq-32b':                   'qwen-qwq-32b'
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
    const model = MODEL_MAP[selectedModel] || 'llama-3.3-70b-versatile';
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
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // الاحتفاظ بالسطر الأخير غير المكتمل

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const dataStr = trimmed.slice(6).trim();
              if (!dataStr) continue;

              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) onChunk(delta);
            } catch (e) {
              // تخطي الحزم المشوهة دون تعطيل التطبيق
            }
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
              content: 'Generate a 2-4 word title for this chat. Return ONLY the title, no quotes, no punctuation.'
            },
            { role: 'user', content: userMessage.slice(0, 300) }
          ]
        })
      });

      if (!response.ok) return truncateTitle(userMessage);
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || truncateTitle(userMessage);
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
      
