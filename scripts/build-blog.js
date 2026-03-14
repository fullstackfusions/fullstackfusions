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

// ── Site nav (matches your homepage header) ───────────────────────────────────
// Update this block if you change navigation on index.html.

function siteNav() {
  return `
  <header class="bg-gray-900 text-white">
    <div class="container mx-auto px-4 py-4">
      <nav>
        <ul class="inline-flex flex-wrap justify-center gap-4 md:gap-6 text-sm md:text-base w-full">
          <li><a href="/" class="hover:text-blue-400 font-extrabold text-lg tracking-tight">Mihir Patel</a></li>
          <li><a href="/#about" class="hover:text-blue-400">About</a></li>
          <li><a href="/#skills" class="hover:text-blue-400">Skills</a></li>
          <li><a href="/#projects" class="hover:text-blue-400">Projects</a></li>
          <li><a href="/#experience" class="hover:text-blue-400">Experience</a></li>
          <li><a href="/blog" class="hover:text-blue-400">Blog</a></li>
        </ul>
      </nav>
    </div>
  </header>`;
}

// ── Post HTML template ────────────────────────────────────────────────────────

function postTemplate({ title, date, tags = [], description = '', contentHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(description)}" />
  <title>${escapeHtml(title)} — fullstackfusions</title>
  <link rel="icon" sizes="32x32" type="image/png" href="/images/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="/blog/assets/blog.css" />
  <script>(function(){const s=localStorage.getItem('theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}})();<\/script>
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
    </article>
  </main>

  <script>
    function toggleTheme(){const d=document.documentElement.classList.toggle('dark');localStorage.setItem('theme',d?'dark':'light');document.getElementById('theme-icon').textContent=d?'\u2600\uFE0F':'\uD83C\uDF19';}
    document.getElementById('theme-icon').textContent=document.documentElement.classList.contains('dark')?'\u2600\uFE0F':'\uD83C\uDF19';
  <\/script>

</body>
</html>`;
}

// ── Blog index template ───────────────────────────────────────────────────────

function indexTemplate(posts) {
  const listItems = posts.map(({ slug, title, date, tags = [], description = '' }) => `
    <li>
      <div class="post-meta">${formatDate(date)}</div>
      <div class="post-title"><a href="/blog/posts/${encodeURIComponent(slug)}/">${escapeHtml(title)}</a></div>
      ${description ? `<p class="text-gray-600 mt-1">${escapeHtml(description)}</p>` : ''}
      <div class="post-tags">${renderTags(tags)}</div>
    </li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog — fullstackfusions</title>
  <link rel="icon" sizes="32x32" type="image/png" href="/images/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="/blog/assets/blog.css" />
  <script>(function(){const s=localStorage.getItem('theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}})();<\/script>
</head>
<body class="bg-gray-50 text-gray-900">
  <button id="theme-toggle" onclick="toggleTheme()" aria-label="Toggle dark mode" title="Toggle dark/light mode"><span id="theme-icon">&#x1F319;</span></button>

  ${siteNav()}

  <main class="blog-container">
    <h1 class="text-3xl font-bold section-heading mb-8">Blog</h1>
    <ul class="post-list">
      ${listItems}
    </ul>
  </main>

  <script>
    function toggleTheme(){const d=document.documentElement.classList.toggle('dark');localStorage.setItem('theme',d?'dark':'light');document.getElementById('theme-icon').textContent=d?'\u2600\uFE0F':'\uD83C\uDF19';}
    document.getElementById('theme-icon').textContent=document.documentElement.classList.contains('dark')?'\u2600\uFE0F':'\uD83C\uDF19';
  <\/script>

</body>
</html>`;
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

  for (const file of mdFiles) {
    const raw               = fs.readFileSync(path.join(POSTS_SRC, file), 'utf8');
    const { data, content } = matter(raw);
    const slug              = slugFromFilename(file);
    const contentHtml       = marked(content);

    const outDir = path.join(POSTS_OUT, slug);
    fs.mkdirSync(outDir, { recursive: true });

    const rawDate = (data.date instanceof Date)
      ? data.date.toISOString().slice(0, 10)
      : String(data.date || new Date().toISOString().slice(0, 10)).slice(0, 10);

    fs.writeFileSync(
      path.join(outDir, 'index.html'),
      postTemplate({
        title:       data.title       || slug,
        date:        rawDate,
        tags:        data.tags        || [],
        description: data.description || '',
        contentHtml,
      })
    );
    console.log(`✓ Built: blog/posts/${slug}/index.html`);

    postMeta.push({
      slug,
      title:       data.title       || slug,
      date:        rawDate,
      tags:        data.tags        || [],
      description: data.description || '',
    });
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

  console.log(`\nDone — ${mdFiles.length} Markdown post(s) built.`);
}

build();
