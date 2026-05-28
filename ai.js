/**
 * Infinity AI — AI Module
 * Powered by OpenRouter API with streaming support
 */

const AI = (() => {
  const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

  function getApiKey() {
    const userKey = Storage.getSetting('apiKey');
    if (userKey && userKey.trim().length > 10) return userKey.trim();
    return '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';
  }

  const PERSONALITIES = {
    default: 'You are Infinity AI, a helpful, intelligent, and thoughtful assistant.',
    creative: 'You are Infinity AI in creative mode.',
    expert: 'You are Infinity AI in expert mode.',
    concise: 'You are Infinity AI in concise mode.'
  };

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

    // استخدام النموذج المجاني بشكل افتراضي لضمان العمل حتى لو لم تكن هناك أرصدة مشحونة
    const selectedModel = Storage.getSetting('model') || 'llama-3.1-8b-instant';
    const model = MODEL_MAP[selectedModel] || 'meta-llama/llama-3.1-8b-instruct:free';
    
    const temperature = parseFloat(Storage.getSetting('temperature') || '0.7');
    const maxTokens = parseInt(Storage.getSetting('maxTokens') || '2048');
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
          'HTTP-Referer': window.location.origin || 'https://llm.solar',
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
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // الاحتفاظ بالسطر الأخير غير المكتمل في البافر
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          
          // تجاهل الأسطر الفارغة تماماً
          if (!trimmed) continue;
          
          // إنهاء الـ Stream إذا أرسل السيرفر إشارة النهاية القياسية
          if (trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const dataStr = trimmed.slice(6).trim();
              if (!dataStr) continue;
              
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) onChunk(delta);
            } catch (e) {
              // تخطي أي حزمة JSON معطوبة دون التسبب في انهيار التطبيق
              console.log('Skipped chunk parse error');
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
        // تمرير نص الخطأ القادم من السيرفر مباشرة لواجهة المستخدم لرؤية السبب الحقيقي (مثل صلاحية المفتاح)
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
          'HTTP-Referer': window.location.origin || 'https://llm.solar',
          'X-Title': 'Infinity AI'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
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
                
