"use strict";

(function() {
  // Paranoid Check: Ensure environment is safe
  if (typeof window === 'undefined' || !window.document) return;

  const params = new URLSearchParams(location.search);
  const rawUrl = params.get("url");

  // Fail closed if no URL
  if (!rawUrl) {
    document.body.textContent = "Missing url parameter";
    return;
  }

  let target;
  try {
    // 1. Parse URL
    const urlObj = new URL(rawUrl);

    // 2. Protocol Whitelist (Strict equality)
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error('Forbidden protocol');
    }

    // 3. Hostname check
    const hostname = urlObj.hostname;
    if (!hostname) {
      throw new Error('Missing hostname');
    }

    // 4. Block Private Networks / Localhost (Prevent Client-Side Scanning)
    // IPv4 private ranges: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    // Localhost domains: localhost, *.local, *.test, *.example, *.invalid
    const isPrivateIP = (host) => {
      // Check for IPv4
      if (/^127\.\d+\.\d+\.\d+$/.test(host)) return true;
      if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
      if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
      if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)) return true;
      
      // Check for IPv6 (Loopback & Unique Local)
      if (/^\[?::1\]?$/.test(host)) return true;
      if (/^\[?fc00:/.test(host)) return true;

      // Check for localhost domains
      if (host === 'localhost' || host.endsWith('.localhost')) return true;
      if (host.endsWith('.local') || host.endsWith('.test') || host.endsWith('.example') || host.endsWith('.invalid')) return true;

      return false;
    };

    if (isPrivateIP(hostname)) {
      throw new Error('Forbidden destination');
    }

    // 5. Serialize back to string to ensure normalization (Punycode, etc.)
    target = urlObj.href;
  } catch (e) {
    document.body.textContent = "Invalid url";
    console.error(e);
    return;
  }

  // Immutable I18N configuration
  const I18N = Object.freeze({
    en: {
      title: "Leaving This Site",
      warn: "You are about to visit an external website. The destination is not controlled by us. Please make sure the link is safe before continuing.",
      go: "Continue"
    },
    zh: {
      title: "即将离开本站",
      warn: "你即将访问一个外部网站，该站点不受本站控制。请确认链接安全后再继续访问。",
      go: "继续访问"
    }
  });

  // Safe Language Detection
  const getLang = () => {
    try {
      const candidates = [params.get("lang")];
      if (navigator.languages) candidates.push(...navigator.languages);
      if (navigator.language) candidates.push(navigator.language);

      for (const lang of candidates) {
        if (!lang) continue;
        const short = lang.split('-')[0].toLowerCase();
        if (Object.prototype.hasOwnProperty.call(I18N, short)) {
          return short;
        }
      }
    } catch {}
    return 'en';
  };

  const langKey = getLang();
  const t = I18N[langKey];

  // DOM Updates
  document.documentElement.lang = langKey;
  
  const setSafeText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setSafeText("title", t.title);
  setSafeText("warn", t.warn);
  setSafeText("url", target);

  const link = document.getElementById("go");
  if (link) {
    link.textContent = t.go;
    link.href = target;
    link.rel = "noopener noreferrer";
  }
})();
