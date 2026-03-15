// components/navbar.js
// Single source of truth for the site navigation bar.
// Usage: place <div id="site-nav"></div> where the nav belongs, then load this script.
(function () {
  function getQueryParam(name) {
    var query = window.location.search ? window.location.search.substring(1) : '';
    if (!query) return null;
    var pairs = query.split('&');
    for (var i = 0; i < pairs.length; i += 1) {
      var parts = pairs[i].split('=');
      var key = decodeURIComponent(parts[0] || '');
      if (key === name) {
        return decodeURIComponent((parts[1] || '').replace(/\+/g, ' '));
      }
    }
    return null;
  }

  var debugParam = getQueryParam('navdebug');
  var debugStorageKey = 'nav-debug-enabled';
  if (debugParam === '1') localStorage.setItem(debugStorageKey, '1');
  if (debugParam === '0') localStorage.removeItem(debugStorageKey);
  var navDebugEnabled = debugParam === '1' || localStorage.getItem(debugStorageKey) === '1';

  // Inject critical dark-mode base styles inline so pages that load their
  // dark-mode overrides from an external stylesheet (e.g. blog.css) don't
  // flash a light background before that file arrives.
  var style = document.createElement('style');
  style.textContent =
    'html.dark body{background-color:#0f172a!important;color:#e2e8f0}' +
    'html.dark .bg-gray-50{background-color:#0f172a!important}' +
    'html.dark .bg-white{background-color:#1e293b!important}' +
    'html.dark .bg-gray-900{background-color:#020617!important}';
  document.head.appendChild(style);

  var path = window.location.pathname.replace(/\/$/, '') || '/';

  var NAV_LINKS = [
    { label: 'About',          href: '/#about' },
    { label: 'Skills',         href: '/#skills' },
    { label: 'Projects',       href: '/projects' },
    { label: 'Experience',     href: '/experience' },
    { label: 'Education',      href: '/#education' },
    { label: 'Certifications', href: '/#certs' },
    { label: 'Blog',           href: '/blog' },
  ];

  function isActive(href) {
    // Anchor-only links are never highlighted as "active"
    if (href.startsWith('/#')) return false;
    var normalized = href.replace(/\/$/, '') || '/';
    return path === normalized || path.startsWith(normalized + '/');
  }

  var lis = NAV_LINKS.map(function (link) {
    var cls = isActive(link.href) ? 'text-blue-400 font-semibold' : 'hover:text-blue-400';
    return '<li><a href="' + link.href + '" class="' + cls + '">' + link.label + '</a></li>';
  }).join('');

  // Spacer uses no background class — inherits transparent body colour,
  // so there is nothing to flash regardless of which CSS file loads first.
  var html =
    '<div style="height:4rem"></div>' +
    '<header class="bg-gray-900 text-white">' +
      '<nav class="border-b border-gray-700">' +
        '<div class="container mx-auto px-4 py-3">' +
          '<ul class="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-base">' +
            '<li><a href="/" aria-label="Home" class="flex items-center">' +
              '<img src="/images/logo.png" alt="Home" class="w-6 h-6" />' +
            '</a></li>' +
            lis +
          '</ul>' +
        '</div>' +
      '</nav>' +
    '</header>';

  var el = document.getElementById('site-nav');
  if (el) el.outerHTML = html;

  function pickRect(node) {
    if (!node) return null;
    var r = node.getBoundingClientRect();
    return {
      x: Number(r.x.toFixed(2)),
      y: Number(r.y.toFixed(2)),
      width: Number(r.width.toFixed(2)),
      height: Number(r.height.toFixed(2)),
      area: Number((r.width * r.height).toFixed(2)),
    };
  }

  function collectNavMetrics() {
    var nav = document.querySelector('header nav');
    var ul = document.querySelector('header nav ul');
    var links = Array.prototype.slice.call(document.querySelectorAll('header nav ul li a'));
    if (!nav || !ul || links.length === 0) return null;

    var navStyle = window.getComputedStyle(nav);
    var ulStyle = window.getComputedStyle(ul);
    var htmlStyle = window.getComputedStyle(document.documentElement);
    var bodyStyle = window.getComputedStyle(document.body);
    var viewportArea = window.innerWidth * window.innerHeight;

    return {
      url: window.location.href,
      path: window.location.pathname,
      capturedAt: new Date().toISOString(),
      devicePixelRatio: window.devicePixelRatio,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        area: viewportArea,
      },
      root: {
        htmlFontSize: htmlStyle.fontSize,
        bodyFontSize: bodyStyle.fontSize,
        bodyFontFamily: bodyStyle.fontFamily,
        bodyLineHeight: bodyStyle.lineHeight,
        textSizeAdjust: bodyStyle.webkitTextSizeAdjust || bodyStyle.textSizeAdjust || 'n/a',
      },
      nav: {
        fontSize: navStyle.fontSize,
        lineHeight: navStyle.lineHeight,
        fontFamily: navStyle.fontFamily,
        letterSpacing: navStyle.letterSpacing,
        rect: pickRect(nav),
      },
      navCoverage: {
        widthPercent: Number(((nav.getBoundingClientRect().width / window.innerWidth) * 100).toFixed(2)),
        areaPercent: Number((((nav.getBoundingClientRect().width * nav.getBoundingClientRect().height) / viewportArea) * 100).toFixed(2)),
      },
      list: {
        fontSize: ulStyle.fontSize,
        lineHeight: ulStyle.lineHeight,
        columnGap: ulStyle.columnGap,
        rowGap: ulStyle.rowGap,
        rect: pickRect(ul),
      },
      links: links.map(function (a) {
        var s = window.getComputedStyle(a);
        return {
          label: (a.textContent || '').trim(),
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          fontWeight: s.fontWeight,
          letterSpacing: s.letterSpacing,
          fontFamily: s.fontFamily,
          rect: pickRect(a),
        };
      }),
      stylesheets: Array.prototype.slice.call(document.styleSheets)
        .map(function (sheet) { return sheet.href; })
        .filter(Boolean),
    };
  }

  function drawNavDebugOverlay() {
    var existing = document.querySelectorAll('.nav-debug-overlay-box');
    existing.forEach(function (node) { node.remove(); });

    var targets = Array.prototype.slice.call(document.querySelectorAll('header nav, header nav ul, header nav ul li a'));
    targets.forEach(function (target, idx) {
      var rect = target.getBoundingClientRect();
      var box = document.createElement('div');
      box.className = 'nav-debug-overlay-box';
      box.style.position = 'fixed';
      box.style.left = rect.left + 'px';
      box.style.top = rect.top + 'px';
      box.style.width = rect.width + 'px';
      box.style.height = rect.height + 'px';
      box.style.border = idx < 2 ? '2px solid #ef4444' : '1px solid #f59e0b';
      box.style.background = idx < 2 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)';
      box.style.zIndex = '2147483647';
      box.style.pointerEvents = 'none';
      document.body.appendChild(box);
    });
  }

  function safeParsePx(value) {
    var n = parseFloat(value);
    return isFinite(n) ? n : 0;
  }

  function buildBaselineDiff(current, baseline) {
    if (!current || !baseline || !baseline.links) return null;
    return {
      baselinePath: baseline.path,
      currentPath: current.path,
      htmlFontPxDiff: Number((safeParsePx(current.root.htmlFontSize) - safeParsePx(baseline.root.htmlFontSize)).toFixed(2)),
      bodyFontPxDiff: Number((safeParsePx(current.root.bodyFontSize) - safeParsePx(baseline.root.bodyFontSize)).toFixed(2)),
      navFontPxDiff: Number((safeParsePx(current.nav.fontSize) - safeParsePx(baseline.nav.fontSize)).toFixed(2)),
      navHeightDiff: Number((current.nav.rect.height - baseline.nav.rect.height).toFixed(2)),
      navWidthDiff: Number((current.nav.rect.width - baseline.nav.rect.width).toFixed(2)),
      navAreaDiff: Number((current.nav.rect.area - baseline.nav.rect.area).toFixed(2)),
      navCoverageAreaDiff: Number((current.navCoverage.areaPercent - baseline.navCoverage.areaPercent).toFixed(2)),
      navCoverageWidthDiff: Number((current.navCoverage.widthPercent - baseline.navCoverage.widthPercent).toFixed(2)),
    };
  }

  function exportNavDebugToClipboard(payload) {
    var text = JSON.stringify(payload, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        console.info('[nav-debug] Metrics copied to clipboard.');
      }).catch(function () {
        console.log('[nav-debug] Clipboard write blocked; copy payload below:');
        console.log(text);
      });
      return;
    }
    console.log('[nav-debug] Clipboard API unavailable; copy payload below:');
    console.log(text);
  }

  function logNavDebug() {
    if (!navDebugEnabled) return;

    var metrics = collectNavMetrics();
    if (!metrics) {
      console.warn('[nav-debug] Unable to capture navbar metrics.');
      return;
    }

    var baselineKey = 'nav-debug-baseline';
    var saveBaseline = getQueryParam('navbaseline') === '1';
    var compareBaseline = getQueryParam('navcompare') !== '0';
    var drawOverlay = getQueryParam('navoverlay') === '1';
    var baseline = null;

    if (saveBaseline) {
      localStorage.setItem(baselineKey, JSON.stringify(metrics));
      console.info('[nav-debug] Baseline saved for cross-page comparison.');
    }

    try {
      baseline = JSON.parse(localStorage.getItem(baselineKey) || 'null');
    } catch (e) {
      baseline = null;
    }

    console.groupCollapsed('[nav-debug] Navbar metrics: ' + metrics.path);
    console.log('Summary', {
      url: metrics.url,
      htmlFontSize: metrics.root.htmlFontSize,
      bodyFontSize: metrics.root.bodyFontSize,
      navFontSize: metrics.nav.fontSize,
      navLineHeight: metrics.nav.lineHeight,
      navCoverage: metrics.navCoverage,
    });
    console.table(metrics.links.map(function (link) {
      return {
        label: link.label,
        fontSize: link.fontSize,
        lineHeight: link.lineHeight,
        fontWeight: link.fontWeight,
        width: link.rect ? link.rect.width : null,
        height: link.rect ? link.rect.height : null,
      };
    }));
    console.log('Raw metrics', metrics);

    var delta = buildBaselineDiff(metrics, baseline);
    if (compareBaseline && delta && baseline.path !== metrics.path) {
      console.log('[nav-debug] Baseline comparison', delta);
    }

    var payload = {
      metrics: metrics,
      baseline: baseline,
      baselineDiff: delta,
    };
    window.__navDebugLastCapture = payload;
    window.copyNavDebug = function () {
      return exportNavDebugToClipboard(window.__navDebugLastCapture || payload);
    };
    console.info('[nav-debug] Run copyNavDebug() to copy the latest metrics JSON.');

    console.groupEnd();

    if (drawOverlay) drawNavDebugOverlay();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(logNavDebug);
      });
    });
  } else {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(logNavDebug);
    });
  }
}());
