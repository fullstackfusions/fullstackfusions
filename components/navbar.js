// components/navbar.js
// Single source of truth for the site navigation bar.
// Usage: place <div id="site-nav"></div> where the nav belongs, then load this script.
(function () {
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
}());
