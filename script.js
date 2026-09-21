/* Copyright (c) 2024-2026 Mukund (The Antigle). All rights reserved. */
/* MC Bypasser - Link Bypass Engine */

(function() {
  'use strict';

  // ==================== CONFIG ====================
  const BYPASS_APIS = [
    'https://bypass.vip/api/bypass?link=',
    'https://bypass.city/api/bypass?link=',
    'https://api.bypass.tools/bypass?link='
  ];

  const STORAGE_KEY = 'mc_bypasser_history';
  const MAX_HISTORY = 20;

  // ==================== SERVICE DETECTION ====================
  const SERVICES = {
    linkvertise: {
      patterns: [/linkvertise\.com/i, /link-to\.net/i, /direct-link\.net/i, /up-to-down\.net/i, /linkvertise\.download/i],
      name: 'Linkvertise'
    },
    lootlink: {
      patterns: [/loot-link\.com/i, /lootlinks\.com/i, /lootdest\.com/i, /lootdest\.org/i, /lootlabs\.gg/i],
      name: 'LootLink'
    },
    workink: {
      patterns: [/work\.ink/i],
      name: 'Work.ink'
    },
    boost: {
      patterns: [/boost\.ink/i, /mboost\.me/i, /bst\.gg/i, /booo\.st/i],
      name: 'Boost.ink'
    },
    adfoc: {
      patterns: [/adfoc\.us/i],
      name: 'Adfoc.us'
    },
    rekonise: {
      patterns: [/rekonise\.com/i],
      name: 'Rekonise'
    },
    sub2unlock: {
      patterns: [/sub2unlock\.(com|net)/i, /sub2get\.com/i, /sub4unlock\.io/i],
      name: 'Sub2Unlock'
    },
    shortest: {
      patterns: [/shorte\.st/i, /sh\.st/i],
      name: 'Shorte.st'
    },
    cuttly: {
      patterns: [/cutt\.ly/i],
      name: 'Cutt.ly'
    },
    ouo: {
      patterns: [/ouo\.(io|press)/i],
      name: 'Ouo.io'
    },
    adfly: {
      patterns: [/adf\.ly/i, /j\.gs/i, /q\.gs/i],
      name: 'Adf.ly'
    },
    gplinks: {
      patterns: [/gplinks\.(co|in)/i],
      name: 'GPLinks'
    },
    try2link: {
      patterns: [/try2link\.com/i],
      name: 'Try2Link'
    }
  };

  // ==================== DETECT SERVICE ====================
  function detectService(url) {
    for (const [key, service] of Object.entries(SERVICES)) {
      for (const pattern of service.patterns) {
        if (pattern.test(url)) {
          return { id: key, name: service.name };
        }
      }
    }
    return { id: 'unknown', name: 'Unknown' };
  }

  // ==================== LINKVERTISE BYPASS ====================
  async function bypassLinkvertise(url) {
    try {
      // Clean URL
      let cleanUrl = url
        .replace(/%3D/g, ' ')
        .replace(/&o=sharing/g, '')
        .replace(/\?o=sharing/g, '')
        .replace(/dynamic\?r=/g, 'dynamic/?r=');

      // Extract path
      const pathMatch = cleanUrl.match(/\/\d+\/[^\/]+/);
      if (!pathMatch) throw new Error('Invalid Linkvertise URL format');

      const path = pathMatch[0];

      // Step 1: Trigger impression endpoints
      const impressionPaths = [
        '/captcha',
        '/countdown_impression?trafficOrigin=network',
        '/todo_impression?mobile=true&trafficOrigin=network'
      ];

      for (const impPath of impressionPaths) {
        try {
          await fetch(`https://publisher.linkvertise.com/api/v1/redirect/link${path}${impPath}`, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
              'Accept': 'application/json'
            }
          });
        } catch (e) { /* ignore */ }
      }

      // Step 2: Get link ID
      const staticResponse = await fetch(`https://publisher.linkvertise.com/api/v1/redirect/link/static${path}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'application/json'
        }
      });

      const staticData = await staticResponse.json();
      if (!staticData?.data?.link?.id) throw new Error('Could not get link ID');

      const linkId = staticData.data.link.id;

      // Step 3: Create serial
      const serial = btoa(JSON.stringify({
        timestamp: Date.now(),
        random: '6548307',
        link_id: linkId
      }));

      // Step 4: Get target
      const targetResponse = await fetch(`https://publisher.linkvertise.com/api/v1/redirect/link${path}/target`, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ serial })
      });

      const targetData = await targetResponse.json();
      if (targetData?.data?.target) {
        return targetData.data.target;
      }

      throw new Error('No target URL in response');
    } catch (e) {
      throw new Error(`Linkvertise bypass failed: ${e.message}`);
    }
  }

  // ==================== GENERIC API BYPASS ====================
  async function bypassViaAPI(url) {
    const encodedUrl = encodeURIComponent(url);

    for (const api of BYPASS_APIS) {
      try {
        const response = await fetch(api + encodedUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MCBypasser/1.0'
          }
        });

        if (!response.ok) continue;

        const data = await response.json();

        // Try different response formats
        if (data.destination) return data.destination;
        if (data.url) return data.url;
        if (data.target) return data.target;
        if (data.data?.destination) return data.data.destination;
        if (data.data?.url) return data.data.url;
        if (data.data?.target) return data.data.target;
        if (data.status === 'success' && data.link) return data.link;
      } catch (e) {
        continue;
      }
    }

    throw new Error('All bypass APIs failed');
  }

  // ==================== MAIN BYPASS FUNCTION ====================
  async function bypass(url) {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL. Please paste a valid link.');
    }

    const service = detectService(url);

    // Try service-specific bypass first
    if (service.id === 'linkvertise') {
      try {
        return await bypassLinkvertise(url);
      } catch (e) {
        // Fall through to generic API
      }
    }

    // Try generic APIs
    try {
      return await bypassViaAPI(url);
    } catch (e) {
      throw new Error(`Could not bypass this link. The service may be unsupported or the link may be expired.`);
    }
  }

  // ==================== HISTORY ====================
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveToHistory(originalUrl, bypassedUrl, service) {
    const history = getHistory();
    const entry = {
      id: Date.now(),
      original: originalUrl,
      bypassed: bypassedUrl,
      service: service.name,
      timestamp: new Date().toISOString()
    };

    // Remove duplicate
    const filtered = history.filter(h => h.original !== originalUrl);
    filtered.unshift(entry);

    // Limit
    if (filtered.length > MAX_HISTORY) filtered.pop();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    renderHistory();
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }
  window.clearHistory = clearHistory;

  function renderHistory() {
    const container = document.getElementById('historyList');
    const section = document.getElementById('historySection');
    const history = getHistory();

    if (history.length === 0) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');
    container.innerHTML = history.map(item => `
      <div class="history-item">
        <span class="history-service">${escapeHtml(item.service)}</span>
        <a href="${escapeHtml(item.bypassed)}" target="_blank" rel="noopener" class="history-link">${escapeHtml(item.original)}</a>
        <button class="history-copy" onclick="copyToClipboard('${escapeJs(item.bypassed)}', this)">Copy</button>
      </div>
    `).join('');
  }

  // ==================== UI HELPERS ====================
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeJs(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  function showResult(url) {
    const resultEl = document.getElementById('result');
    const linkEl = document.getElementById('resultLink');
    const errorEl = document.getElementById('error');

    errorEl.classList.add('hidden');
    linkEl.href = url;
    linkEl.textContent = url;
    resultEl.classList.remove('hidden');
  }

  function showError(msg) {
    const errorEl = document.getElementById('error');
    const resultEl = document.getElementById('result');
    const errorMsg = document.getElementById('errorMsg');

    resultEl.classList.add('hidden');
    errorMsg.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  function setLoading(loading) {
    const btn = document.getElementById('bypassBtn');
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');

    if (loading) {
      text.classList.add('hidden');
      loader.classList.remove('hidden');
      btn.disabled = true;
    } else {
      text.classList.remove('hidden');
      loader.classList.add('hidden');
      btn.disabled = false;
    }
  }

  // ==================== COPY ====================
  function copyLink() {
    const url = document.getElementById('resultLink').href;
    copyToClipboard(url, document.querySelector('.copy-btn'), 'Copied!');
  }

  function copyToClipboard(text, btn, successText = 'Copied!') {
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = successText;
      btn.style.borderColor = 'var(--accent)';
      btn.style.color = 'var(--accent)';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 1500);
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      btn.textContent = successText;
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  }
  window.copyLink = copyLink;
  window.copyToClipboard = copyToClipboard;

  // ==================== MAIN HANDLER ====================
  async function startBypass() {
    const input = document.getElementById('linkInput');
    const url = input.value.trim();

    if (!url) {
      showError('Please paste a link first.');
      return;
    }

    setLoading(true);
    document.getElementById('result').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');

    try {
      const result = await bypass(url);
      const service = detectService(url);

      showResult(result);
      saveToHistory(url, result, service);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }
  window.startBypass = startBypass;

  // Enter key support
  document.getElementById('linkInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startBypass();
  });

  // ==================== PWA ====================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // ==================== INIT ====================
  renderHistory();

})();
