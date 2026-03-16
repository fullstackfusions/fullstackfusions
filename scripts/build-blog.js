// scripts/build-blog.js
// Converts _posts/*.md  →  blog/posts/<slug>/index.html
// Regenerates           →  blog/index.html
// Writes                →  blog/feed.json  (for optional homepage widget)
//
// Run locally:  node scripts/build-blog.js
// Run in CI:    same command, added to static.yml

const fs   = require('fs');
const path = require('path');
const { marked }  = require('marked');
const matter      = require('gray-matter');

const POSTS_SRC  = path.join(__dirname, '../_posts');
const POSTS_OUT  = path.join(__dirname, '../blog/posts');
const BLOG_INDEX = path.join(__dirname, '../blog/index.html');
const FEED_OUT   = path.join(__dirname, '../blog/feed.json');
const SITEMAP_OUT = path.join(__dirname, '../sitemap.xml');
const RSS_OUT     = path.join(__dirname, '../feed.xml');

const SITE_URL = 'https://fullstackfusions.com';
const AUTHOR   = 'Mihir';
const GA_ID    = 'G-QWCQ7T2CM8';

function gaTag() {
  return `
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"><\/script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  <\/script>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugFromFilename(filename) {
  // "2026-04-01-how-dns-works.md" → "2026-04-01-how-dns-works"
  return filename.replace(/\.md$/, '');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  // gray-matter parses YAML dates as JS Date objects; normalize to YYYY-MM-DD first
  const s = (dateStr instanceof Date)
    ? dateStr.toISOString().slice(0, 10)
    : String(dateStr).slice(0, 10);
  const [year, month, day] = s.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function renderTags(tags = []) {
  return tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
}

// ── Site nav ──────────────────────────────────────────────────────────────────
// Navigation is rendered at runtime by /components/navbar.js.
// To change links or styling, edit that file — no rebuild needed.

function siteNav() {
  return `
  <div id="site-nav"></div>
  <script src="/components/navbar.js"><\/script>`;
}

// ── Post HTML template ────────────────────────────────────────────────────────

function postTemplate({ slug, title, date, tags = [], description = '', contentHtml, relatedPosts = [] }) {
  const rawDate   = (date instanceof Date) ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
  const canonical = `${SITE_URL}/blog/posts/${slug}/`;
  const jsonLd    = JSON.stringify({
    '@context':    'https://schema.org',
    '@type':       'TechArticle',
    headline:      title,
    author:        { '@type': 'Person', name: AUTHOR },
    datePublished: rawDate,
    description:   description,
    url:           canonical,
  }).replace(/</g, '\\u003c');

  const relatedHtml = relatedPosts.length ? `
    <aside style="margin-top:3rem;padding-top:2rem;border-top:1px solid #334155">
      <h3 style="font-size:1.05rem;font-weight:600;margin-bottom:.75rem">Related Posts</h3>
      <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:.6rem">
        ${relatedPosts.map(p => `<li><a href="/blog/posts/${p.slug}/" style="color:#2563eb;font-weight:500;text-decoration:none">${escapeHtml(p.title)}</a> <span style="color:#6b7280;font-size:.8rem">— ${formatDate(p.date)}</span></li>`).join('\n        ')}
      </ul>
    </aside>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${gaTag()}
  <meta name="description" content="${escapeHtml(description)}" />
  <title>${escapeHtml(title)} — fullstackfusions</title>
  <link rel="canonical" href="${canonical}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="fullstackfusions" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />

  <!-- RSS -->
  <link rel="alternate" type="application/rss+xml" title="fullstackfusions" href="${SITE_URL}/feed.xml" />

  <!-- JSON-LD -->
  <script type="application/ld+json">${jsonLd}<\/script>

  <link rel="icon" sizes="32x32" type="image/png" href="/images/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/tailwind.css" />
  <link rel="stylesheet" href="/blog/assets/blog.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css" />
  <script>(function(){const s=localStorage.getItem('theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}})();<\/script>
  <style>body{font-family:"Inter",ui-sans-serif,system-ui,sans-serif}.section-heading{position:relative;padding-bottom:.6rem}.section-heading::after{content:"";position:absolute;left:0;bottom:0;width:36px;height:3px;background:#3b82f6;border-radius:2px}#theme-toggle{position:fixed;bottom:1rem;right:1rem;z-index:999;width:2.25rem;height:2.25rem;border-radius:50%;border:none;background:#2563eb;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:background .2s}#theme-toggle:hover{background:#3b82f6}html.dark #theme-toggle{background:#2563eb;border:none}html.dark #theme-toggle:hover{background:#3b82f6}html.dark{color-scheme:dark}html.dark body{background-color:#0f172a;color:#e2e8f0}html.dark .bg-gray-50{background-color:#0f172a}html.dark .bg-white{background-color:#1e293b}html.dark .bg-gray-900{background-color:#020617}html.dark .text-gray-900{color:#f1f5f9}html.dark .text-gray-800{color:#e2e8f0}html.dark .text-gray-700{color:#cbd5e1}html.dark .text-gray-600{color:#94a3b8}html.dark .text-gray-500{color:#64748b}html.dark .border-gray-200{border-color:#334155}html.dark .shadow-sm{box-shadow:0 1px 2px rgba(0,0,0,.5)}html.dark .text-blue-600{color:#60a5fa}html.dark .section-heading::after{background:#60a5fa}<\/style>
</head>
<body class="bg-gray-50 text-gray-900">
  <button id="theme-toggle" onclick="toggleTheme()" aria-label="Toggle dark mode" title="Toggle dark/light mode"><span id="theme-icon">&#x1F319;</span></button>

  ${siteNav()}

  <main class="blog-container">
    <a class="back-link" href="/blog">&#8592; All posts</a>

    <article>
      <header class="post-header">
        <div class="post-meta">${formatDate(date)}</div>
        <h1 class="text-3xl font-bold mt-2">${escapeHtml(title)}</h1>
        ${description ? `<p class="text-gray-600 mt-2">${escapeHtml(description)}</p>` : ''}
        <div class="post-tags">${renderTags(tags)}</div>
      </header>

      <div class="post-content">
        ${contentHtml}
      </div>
      ${relatedHtml}
    </article>
  </main>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/nginx.min.js"><\/script>
  <script>hljs.highlightAll();<\/script>
  <script>
    function toggleTheme(){const d=document.documentElement.classList.toggle('dark');localStorage.setItem('theme',d?'dark':'light');document.getElementById('theme-icon').textContent=d?'\u2600\uFE0F':'\uD83C\uDF19';}
    document.getElementById('theme-icon').textContent=document.documentElement.classList.contains('dark')?'\u2600\uFE0F':'\uD83C\uDF19';
  <\/script>

</body>
</html>`;
}

// ── Blog index template ───────────────────────────────────────────────────────
// Posts are rendered dynamically from feed.json via JS so search + tag
// filtering work client-side without any server. The build script still
// regenerates this file on every run — only the shell/chrome is templated here.

function indexTemplate(_posts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${gaTag()}
  <title>Blog — fullstackfusions</title>
  <link rel="canonical" href="${SITE_URL}/blog/" />
  <link rel="alternate" type="application/rss+xml" title="fullstackfusions" href="${SITE_URL}/feed.xml" />
  <link rel="icon" sizes="32x32" type="image/png" href="/images/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/tailwind.css" />
  <link rel="stylesheet" href="/blog/assets/blog.css" />
  <script>(function(){const s=localStorage.getItem('theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}})();<\/script>
</head>
<body class="bg-gray-50 text-gray-900">
  <button id="theme-toggle" onclick="toggleTheme()" aria-label="Toggle dark mode" title="Toggle dark/light mode"><span id="theme-icon">&#x1F319;</span></button>

  ${siteNav()}

  <main class="blog-container">
    <h1 class="text-3xl font-bold section-heading mb-6">Blog</h1>

    <div class="blog-controls">
      <input
        id="search-input"
        type="search"
        placeholder="Search posts by title, topic, or tag\u2026"
        aria-label="Search blog posts"
        autocomplete="off"
        class="blog-search"
      />
      <div id="tag-filter" class="tag-filter-bar" aria-label="Filter by tag"></div>
    </div>

    <p id="no-results" class="no-results" hidden>No posts match your search.</p>
    <ul id="post-list" class="post-list"></ul>
  </main>

  <script>
    (function () {
      // \u2500\u2500 Theme \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      function toggleTheme() {
        const d = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', d ? 'dark' : 'light');
        document.getElementById('theme-icon').textContent = d ? '\u2600\uFE0F' : '\uD83C\uDF19';
      }
      window.toggleTheme = toggleTheme;
      document.getElementById('theme-icon').textContent =
        document.documentElement.classList.contains('dark') ? '\u2600\uFE0F' : '\uD83C\uDF19';

      // \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      function esc(s) {
        return String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function formatDate(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
      }

      // \u2500\u2500 State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      let allPosts = [];
      let activeTag = location.hash
        ? decodeURIComponent(location.hash.slice(1))
        : null;
      let searchQuery = '';

      // \u2500\u2500 Render posts \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      function renderPosts() {
        const list = document.getElementById('post-list');
        const noResults = document.getElementById('no-results');
        const q = searchQuery.trim().toLowerCase();

        const filtered = allPosts.filter((post) => {
          const matchesTag = !activeTag || post.tags.includes(activeTag);
          const matchesSearch =
            !q ||
            post.title.toLowerCase().includes(q) ||
            post.description.toLowerCase().includes(q) ||
            post.tags.some((t) => t.toLowerCase().includes(q));
          return matchesTag && matchesSearch;
        });

        if (filtered.length === 0) {
          list.innerHTML = '';
          noResults.hidden = false;
          return;
        }
        noResults.hidden = true;
        list.innerHTML = filtered
          .map(
            (post) => \`<li>
              <div class="post-meta">\${esc(formatDate(post.date))}</div>
              <div class="post-title"><a href="\${esc(post.url)}">\${esc(post.title)}</a></div>
              <p class="text-gray-600 mt-1">\${esc(post.description)}</p>
              <div class="post-tags">
                \${post.tags
                  .map(
                    (t) =>
                      \`<button class="tag tag-clickable\${t === activeTag ? ' tag-active' : ''}" data-tag="\${esc(t)}">\${esc(t)}</button>\`
                  )
                  .join('')}
              </div>
            </li>\`
          )
          .join('');

        list.querySelectorAll('.tag-clickable').forEach((btn) => {
          btn.addEventListener('click', () => setTag(btn.dataset.tag));
        });
      }

      // \u2500\u2500 Render tag bar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      function renderTagBar() {
        const bar = document.getElementById('tag-filter');
        const allTags = [...new Set(allPosts.flatMap((p) => p.tags))].sort();
        bar.innerHTML =
          \`<button class="tag-pill\${!activeTag ? ' active' : ''}" data-tag="">All</button>\` +
          allTags
            .map(
              (t) =>
                \`<button class="tag-pill\${t === activeTag ? ' active' : ''}" data-tag="\${esc(t)}">\${esc(t)}</button>\`
            )
            .join('');

        bar.querySelectorAll('.tag-pill').forEach((btn) => {
          btn.addEventListener('click', () => setTag(btn.dataset.tag || null));
        });
      }

      // \u2500\u2500 Set active tag \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      function setTag(tag) {
        activeTag = tag || null;
        history.replaceState(
          null, '',
          activeTag ? '#' + encodeURIComponent(activeTag) : location.pathname
        );
        renderTagBar();
        renderPosts();
      }

      // \u2500\u2500 Hash navigation (back/forward) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      window.addEventListener('hashchange', () => {
        activeTag = location.hash
          ? decodeURIComponent(location.hash.slice(1))
          : null;
        renderTagBar();
        renderPosts();
      });

      // \u2500\u2500 Search input \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderPosts();
      });

      // \u2500\u2500 Load feed.json \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      fetch('/blog/feed.json')
        .then((r) => r.json())
        .then((posts) => {
          allPosts = posts;
          renderTagBar();
          renderPosts();
        })
        .catch(() => {
          document.getElementById('post-list').innerHTML =
            '<li style="padding:1.5rem 0;color:#6b7280">Failed to load posts.</li>';
        });
    })();
  <\/script>

</body>
</html>`;
}

// ── Sitemap ───────────────────────────────────────────────────────────────────

function buildSitemap(postMeta) {
  const staticUrls = [
    { loc: `${SITE_URL}/`,            priority: '1.0', changefreq: 'monthly' },
    { loc: `${SITE_URL}/blog/`,       priority: '0.9', changefreq: 'weekly'  },
    { loc: `${SITE_URL}/projects/`,   priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE_URL}/experience/`, priority: '0.7', changefreq: 'monthly' },
  ];

  const postUrls = postMeta.map(p => ({
    loc:        `${SITE_URL}/blog/posts/${p.slug}/`,
    lastmod:    p.date,
    priority:   '0.8',
    changefreq: 'monthly',
  }));

  const entries = [...staticUrls, ...postUrls].map(u =>
    `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  ).join('\n');

  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  fs.writeFileSync(SITEMAP_OUT, xml);
  console.log('✓ Built: sitemap.xml');
}

// ── RSS feed ──────────────────────────────────────────────────────────────────

function buildRssFeed(postMeta) {
  function toRfc822(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toUTCString();
  }

  const items = postMeta.slice(0, 20).map(p =>
`  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${SITE_URL}/blog/posts/${p.slug}/</link>
    <guid isPermaLink="true">${SITE_URL}/blog/posts/${p.slug}/</guid>
    <description>${escapeHtml(p.description)}</description>
    <pubDate>${toRfc822(p.date)}</pubDate>
  </item>`
  ).join('\n');

  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>fullstackfusions</title>
    <link>${SITE_URL}</link>
    <description>Engineering blog — architecture, databases, and systems thinking by ${AUTHOR}.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  fs.writeFileSync(RSS_OUT, xml);
  console.log('✓ Built: feed.xml');
}

// ── Main ──────────────────────────────────────────────────────────────────────

function build() {
  if (!fs.existsSync(POSTS_SRC)) {
    console.log('No _posts/ directory found. Skipping blog build.');
    return;
  }

  const mdFiles = fs.readdirSync(POSTS_SRC)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse(); // newest first

  const postMeta = [];
  const mdParsed = []; // stash parsed content for pass 2

  // Pass 1: parse all Markdown and collect metadata
  for (const file of mdFiles) {
    const raw               = fs.readFileSync(path.join(POSTS_SRC, file), 'utf8');
    const { data, content } = matter(raw);
    const slug              = slugFromFilename(file);
    const contentHtml       = marked(content);
    const rawDate           = (data.date instanceof Date)
      ? data.date.toISOString().slice(0, 10)
      : String(data.date || new Date().toISOString().slice(0, 10)).slice(0, 10);

    postMeta.push({
      slug,
      title:       data.title       || slug,
      date:        rawDate,
      tags:        data.tags        || [],
      description: data.description || '',
    });
    mdParsed.push({ slug, rawDate, data, contentHtml });
  }

  // Scan for custom HTML posts with <!--blog-meta ... --> comments
  const mdSlugs = new Set(postMeta.map(p => p.slug));
  if (fs.existsSync(POSTS_OUT)) {
    for (const dir of fs.readdirSync(POSTS_OUT)) {
      if (mdSlugs.has(dir)) continue; // already built from Markdown
      const htmlPath = path.join(POSTS_OUT, dir, 'index.html');
      if (!fs.existsSync(htmlPath)) continue;
      const html = fs.readFileSync(htmlPath, 'utf8');
      const match = html.match(/<!--blog-meta\s*([\s\S]*?)\s*-->/);
      if (!match) continue;
      try {
        const meta = JSON.parse(match[1]);
        postMeta.push({
          slug:        dir,
          title:       meta.title       || dir,
          date:        meta.date        || new Date().toISOString().slice(0, 10),
          tags:        meta.tags        || [],
          description: meta.description || '',
        });
        console.log(`✓ Found custom post: blog/posts/${dir}/`);
      } catch (e) {
        console.warn(`⚠ Invalid blog-meta JSON in blog/posts/${dir}/index.html`);
      }
    }
  }

  // Sort all posts (markdown + custom) by date, newest first
  postMeta.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Pass 2: build HTML for Markdown posts (full postMeta now available for related posts)
  for (const { slug, rawDate, data, contentHtml } of mdParsed) {
    const outDir  = path.join(POSTS_OUT, slug);
    fs.mkdirSync(outDir, { recursive: true });
    const related = postMeta.filter(p => p.slug !== slug).slice(0, 2);
    fs.writeFileSync(
      path.join(outDir, 'index.html'),
      postTemplate({
        slug,
        title:        data.title       || slug,
        date:         rawDate,
        tags:         data.tags        || [],
        description:  data.description || '',
        contentHtml,
        relatedPosts: related,
      })
    );
    console.log(`✓ Built: blog/posts/${slug}/index.html`);
  }

  // Regenerate blog/index.html
  fs.mkdirSync(path.dirname(BLOG_INDEX), { recursive: true });
  fs.writeFileSync(BLOG_INDEX, indexTemplate(postMeta));
  console.log('✓ Built: blog/index.html');

  // Write feed.json for homepage widget
  const feed = postMeta.slice(0, 10).map(p => ({
    ...p,
    url: `/blog/posts/${p.slug}/`,
  }));
  fs.writeFileSync(FEED_OUT, JSON.stringify(feed, null, 2));
  console.log('✓ Built: blog/feed.json');

  // Generate sitemap.xml and RSS feed
  buildSitemap(postMeta);
  buildRssFeed(postMeta);

  console.log(`\nDone — ${mdFiles.length} Markdown post(s) built.`);
}

build();
