/**
 * Infinity AI — Markdown Module
 * Renders markdown with syntax highlighting and code copy buttons
 */

const MarkdownRenderer = (() => {

  // Configure marked
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // Custom renderer for code blocks
    const renderer = new marked.Renderer();

    renderer.code = function(code, language) {
      const lang = language || 'text';
      const safeCode = escapeHtml(typeof code === 'object' ? code.text || '' : code);
      const safeLang = escapeHtml(lang);

      return `<div class="code-block-wrap">
        <div class="code-block-header">
          <span class="code-lang">${safeLang}</span>
          <button class="code-copy-btn" onclick="MarkdownRenderer.copyCode(this)" title="Copy code">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
        </div>
        <pre><code class="language-${safeLang}">${safeCode}</code></pre>
      </div>`;
    };

    renderer.codespan = function(code) {
      const text = typeof code === 'object' ? code.text || '' : code;
      return `<code>${escapeHtml(text)}</code>`;
    };

    marked.use({ renderer });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Render markdown string to HTML
   */
  function render(text) {
    if (typeof marked === 'undefined') return escapeHtml(text).replace(/\n/g, '<br>');

    try {
      const html = marked.parse(text);
      return html;
    } catch (e) {
      return escapeHtml(text).replace(/\n/g, '<br>');
    }
  }

  /**
   * Apply Prism highlighting to all code blocks in an element
   */
  function highlight(el) {
    if (typeof Prism === 'undefined') return;
    requestAnimationFrame(() => {
      el.querySelectorAll('pre code').forEach(block => {
        Prism.highlightElement(block);
      });
    });
  }

  /**
   * Copy code block content
   */
  function copyCode(btn) {
    const pre = btn.closest('.code-block-wrap').querySelector('pre code');
    const text = pre ? pre.textContent : '';
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      btn.style.color = 'var(--accent-cyan)';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.color = '';
      }, 2000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  /**
   * Render text content for plain display (strips markdown)
   */
  function renderPlain(text) {
    return text
      .replace(/```[\s\S]*?```/g, '[code block]')
      .replace(/`[^`]+`/g, match => match.slice(1, -1))
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_{1,2}/g, '')
      .trim();
  }

  return { render, highlight, copyCode, escapeHtml, renderPlain };
})();
