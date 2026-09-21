/* Copyright (c) 2024-2026 Mukund (The Antigle). All rights reserved. */
/* MC Bypasser - Link Bypass Engine v2 */

(function () {
  'use strict';

  const STORAGE_KEY = 'mc_bypasser_history';
  const MAX_HISTORY = 20;

  // CORS proxy (allorigins) — wraps any URL so fetch works from browser
  const PROXY = 'https://api.allorigins.win/raw?url=';

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
      patterns: [/sub2unlock\.(com|net)/i, /sub2get\.com/i, /sub4unlock\.io/i, /subfinal\.com/i],
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
    },
    paster: {
      patterns: [/paster\.so/i, /paster\.gg/i],
      name: 'Paster.so'
    },
    cuty: {
      patterns: [/cuty\.io/i, /cety\.io/i],
      name: 'Cuty.io'
    },
    socialunlock: {
      patterns: [/social-unlock\.com/i, /socialwolvez\.com/i],
      name: 'Social Unlock'
    },
    sub2get: {
      patterns: [/sub2get\.com/i],
      name: 'Sub2Get'
    },
    ytsubme: {
      patterns: [/ytsubme\.com/i],
      name: 'YtSubMe'
    },
    mendation: {
      patterns: [/mendationforc\.info/i],
      name: 'Mendation'
    },
    unlocknow: {
      patterns: [/unlocknow\.net/i],
      name: 'UnlockNow'
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
    return { id: 'unknown', name: 'Direct Link' };
  }

  // ==================== FETCH VIA PROXY ====================
  async function proxyFetch(url, options = {}) {
    const proxied = PROXY + encodeURIComponent(url);
    const res = await fetch(proxied, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  }

  // ==================== BYPASS.VIP API ====================
  async function bypassViaVip(url) {
    const api = `https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`;
    const res = await proxyFetch(api);
    const data = await res.json();
    if (data.status === 'success' && data.result) return data.result;
    throw new Error(data.message || 'bypass.vip failed');
  }

  // ==================== BYPASS.CITY API ====================
  async function bypassViaCity(url) {
    const api = `https://api.bypass.city/bypass?link=${encodeURIComponent(url)}`;
    const res = await proxyFetch(api);
    const data = await res.json();
    if (data.status === 'success' && data.destination) return data.destination;
    if (data.destination) return data.destination;
    throw new Error('bypass.city failed');
  }

  // ==================== BYPASS.TOOLS API ====================
  async function bypassViaTools(url) {
    const api = `https://api.bypass.tools/bypass?url=${encodeURIComponent(url)}`;
    const res = await proxyFetch(api);
    const data = await res.json();
    if (data.status === 'success' && data.result) return data.result;
    if (data.destination) return data.destination;
    throw new Error('bypass.tools failed');
  }

  // ==================== LINKVERTISE DIRECT BYPASS ====================
  async function bypassLinkvertiseDirect(url) {
    try {
      let cleanUrl = url
        .replace(/%3D/g, ' ')
        .replace(/&o=sharing/g, '')
        .replace(/\?o=sharing/g, '')
        .replace(/dynamic\?r=/g, 'dynamic/?r=');

      const pathMatch = cleanUrl.match(/\/\d+\/[^\/?]+/);
      if (!pathMatch) throw new Error('Invalid format');

      const path = pathMatch[0];

      // Step 1: Get link info via proxy
      const staticUrl = `https://publisher.linkvertise.com/api/v1/redirect/link/static${path}`;
      const staticRes = await proxyFetch(staticUrl);
      const staticData = await staticRes.json();

      if (!staticData?.data?.link?.id) throw new Error('No link ID');
      const linkId = staticData.data.link.id;

      // Step 2: Create serial
      const serial = btoa(JSON.stringify({
        timestamp: Date.now(),
        random: '6548307',
        link_id: linkId
      }));

      // Step 3: Get target via proxy
      const targetUrl = `https://publisher.linkvertise.com/api/v1/redirect/link${path}/target`;
      const targetRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
        },
        body: JSON.stringify({ serial })
      });

      const targetData = await targetRes.json();
      if (targetData?.data?.target) return targetData.data.target;
      throw new Error('No target');
    } catch (e) {
      throw new Error('Linkvertise direct failed');
    }
  }

  // ==================== MAIN BYPASS ====================
  async function bypass(url) {
    try { new URL(url); } catch { throw new Error('Invalid URL. Please paste a valid link.'); }

    const service = detectService(url);

    // Try Linkvertise direct first
    if (service.id === 'linkvertise') {
      try { return await bypassLinkvertiseDirect(url); } catch (e) { /* fall through */ }
    }

    // Try APIs in order
    const apis = [bypassViaVip, bypassViaCity, bypassViaTools];
    let lastError;

    for (const apiFn of apis) {
      try {
        const result = await apiFn(url);
        if (result && result.startsWith('http')) return result;
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    throw new Error(lastError?.message || 'Could not bypass this link. It may be expired or unsupported.');
  }

  // ==================== HISTORY ====================
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveToHistory(original, bypassed, service) {
    const history = getHistory();
    const entry = { id: Date.now(), original, bypassed, service: service.name, timestamp: new Date().toISOString() };
    const filtered = history.filter(h => h.original !== original);
    filtered.unshift(entry);
    if (filtered.length > MAX_HISTORY) filtered.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    renderHistory();
  }

  window.clearHistory = function () {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  };

  function renderHistory() {
    const container = document.getElementById('historyList');
    const section = document.getElementById('historySection');
    const history = getHistory();

    if (history.length === 0) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    container.innerHTML = history.map(item => `
      <div class="history-item">
        <span class="history-service">${esc(item.service)}</span>
        <a href="${esc(item.bypassed)}" target="_blank" rel="noopener" class="history-link">${esc(item.original)}</a>
        <button class="history-copy" onclick="copyText('${escJs(item.bypassed)}', this)">Copy</button>
      </div>`).join('');
  }

  // ==================== UI ====================
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function escJs(s) { return s.replace(/'/g, "\\'").replace(/"/g, '\\"'); }

  function showResult(url) {
    document.getElementById('error').classList.add('hidden');
    const link = document.getElementById('resultLink');
    link.href = url;
    link.textContent = url;
    document.getElementById('result').classList.remove('hidden');
  }

  function showError(msg) {
    document.getElementById('result').classList.add('hidden');
    document.getElementById('errorMsg').textContent = msg;
    document.getElementById('error').classList.remove('hidden');
  }

  function setLoading(on) {
    const btn = document.getElementById('bypassBtn');
    btn.querySelector('.btn-text').classList.toggle('hidden', on);
    btn.querySelector('.btn-loader').classList.toggle('hidden', !on);
    btn.disabled = on;
  }

  // ==================== COPY ====================
  window.copyLink = function () {
    copyText(document.getElementById('resultLink').href, document.querySelector('.copy-btn'), 'Copied!');
  };

  window.copyText = function (text, btn, ok = 'Copied!') {
    navigator.clipboard.writeText(text).then(() => {
      if (!btn) return;
      const orig = btn.textContent;
      btn.textContent = ok;
      setTimeout(() => btn.textContent = orig, 1500);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (btn) { btn.textContent = ok; setTimeout(() => btn.textContent = 'Copy', 1500); }
    });
  };

  // ==================== MAIN HANDLER ====================
  window.startBypass = async function () {
    const input = document.getElementById('linkInput');
    const url = input.value.trim();
    if (!url) { showError('Please paste a link first.'); return; }

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
  };

  // Enter key
  document.getElementById('linkInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') window.startBypass();
  });

  // ==================== PWA ====================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // ==================== INIT ====================
  renderHistory();

})();
