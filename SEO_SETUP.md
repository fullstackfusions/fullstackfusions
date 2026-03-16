# SEO Setup — fullstackfusions.com

A reference for everything done to make the blog and site SEO-ready.

---

## Files Created / Modified

| File | What changed |
|---|---|
| `scripts/build-blog.js` | Added all SEO generation logic + GA tag injection |
| `robots.txt` | Created at repo root |
| `sitemap.xml` | Auto-generated on every build |
| `feed.xml` | RSS 2.0 feed, auto-generated on every build |
| `index.html` | GA tag added |
| `projects/index.html` | GA tag added |
| `experience/index.html` | GA tag added |

---

## Tier 1 — Foundational (Done)

### 1. `robots.txt`
Located at the repo root, served at `https://fullstackfusions.com/robots.txt`.

```
User-agent: *
Allow: /
Disallow: /blog/_drafts/

Sitemap: https://fullstackfusions.com/sitemap.xml
```

- Allows all crawlers.
- Blocks the drafts folder from indexing.
- Points Googlebot directly to the sitemap.

---

### 2. `sitemap.xml`
Located at the repo root, served at `https://fullstackfusions.com/sitemap.xml`.
**Re-generated automatically on every `node scripts/build-blog.js` run.**

Includes:

| URL | Priority | Changefreq |
|---|---|---|
| `/` | 1.0 | monthly |
| `/blog/` | 0.9 | weekly |
| `/projects/` | 0.7 | monthly |
| `/experience/` | 0.7 | monthly |
| Each blog post | 0.8 | monthly |

Each blog post entry also includes a `<lastmod>` date pulled from the post's frontmatter.

**Next step:** Submit this URL in Google Search Console under *Indexing → Sitemaps*.

---

### 3. Canonical Tags
Every blog post `<head>` now contains:

```html
<link rel="canonical" href="https://fullstackfusions.com/blog/posts/<slug>/" />
```

This tells Google the authoritative URL for each post, preventing duplicate-content issues if the site is ever accessible via multiple domains (e.g. GitHub Pages URL vs custom domain).

---

### 4. Open Graph + Twitter Card Meta Tags
Every blog post `<head>` now contains:

```html
<!-- Open Graph (Facebook, LinkedIn, Slack previews) -->
<meta property="og:type"        content="article" />
<meta property="og:title"       content="<post title>" />
<meta property="og:description" content="<post description>" />
<meta property="og:url"         content="https://fullstackfusions.com/blog/posts/<slug>/" />
<meta property="og:site_name"   content="fullstackfusions" />

<!-- Twitter / X card -->
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:title"       content="<post title>" />
<meta name="twitter:description" content="<post description>" />
```

**Optional future enhancement:** Add `og:image` once you have a post cover image or OG image generator. Point it to `https://fullstackfusions.com/assets/og/<slug>.png`.

---

## Tier 2 — Rich Results & Signals (Done)

### 5. JSON-LD Schema Markup (`TechArticle`)
Every blog post embeds a `<script type="application/ld+json">` block in `<head>`:

```json
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "<post title>",
  "author": { "@type": "Person", "name": "Mihir" },
  "datePublished": "YYYY-MM-DD",
  "description": "<post description>",
  "url": "https://fullstackfusions.com/blog/posts/<slug>/"
}
```

This is what enables Google to show author name, publish date, and article type directly in search results (rich results). Test any post at [Google's Rich Results Test](https://search.google.com/test/rich-results).

---

### 6. RSS Feed (`feed.xml`)
Located at the repo root, served at `https://fullstackfusions.com/feed.xml`.
**Re-generated automatically on every build.**

- RSS 2.0 format with `atom:self` link.
- Includes up to 20 most recent posts with title, description, permalink, and `pubDate`.
- Every blog post and the blog index page autodiscover it via:
  ```html
  <link rel="alternate" type="application/rss+xml" title="fullstackfusions"
        href="https://fullstackfusions.com/feed.xml" />
  ```

**Use case:** When cross-posting to Dev.to or Hashnode, point their RSS importer at this URL. Always set the canonical back to `fullstackfusions.com`.

---

### 7. Internal Linking (Related Posts)
A "Related Posts" section is automatically appended to the bottom of every blog post, showing the 2 most recent other posts with links.

The build uses a **two-pass approach** — pass 1 collects all post metadata, pass 2 writes HTML — so every post always has accurate related-post links regardless of publish order.

---

## How the Build Works

```
node scripts/build-blog.js
```

**Pass 1** — Parse all `_posts/*.md`, collect slug + metadata.
**Pass 2** — Write each post's `index.html` (now with full related-posts context).
Then generates in order:
1. `blog/posts/<slug>/index.html` — with canonical, OG, Twitter, JSON-LD, related posts
2. `blog/index.html` — with canonical + RSS autodiscovery
3. `blog/feed.json` — for the homepage widget (existing)
4. `sitemap.xml` — all static pages + all blog posts
5. `feed.xml` — RSS 2.0

---

## Google Analytics 4

**Property ID:** `G-QWCQ7T2CM8`

The GA tag is placed immediately after `<meta name="viewport">` in every page's `<head>`.

**Where it lives:**
- Static pages (`index.html`, `projects/index.html`, `experience/index.html`) — added directly.
- Blog pages (`blog/index.html`, all `blog/posts/*/index.html`) — injected by `build-blog.js` via the `gaTag()` helper. The property ID is a single constant `GA_ID` at the top of the build script — one place to update if it ever changes.

**To verify it's firing:**
Open any page, open DevTools → Network tab, filter by `gtag` or `google-analytics`. You should see a request to `https://www.googletagmanager.com/gtag/js?id=G-QWCQ7T2CM8` on every page load.

Alternatively, install the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension.

---

## Tier 3 — Ongoing Checklist

- [ ] **Submit sitemap** in Google Search Console → *Indexing → Sitemaps* → paste `https://fullstackfusions.com/sitemap.xml`
- [ ] **Core Web Vitals** — run the site through [PageSpeed Insights](https://pagespeed.web.dev/). Watch for unoptimized images.
- [ ] **Cross-posting** — post on Dev.to / Hashnode but always set canonical URL back to `fullstackfusions.com`
- [ ] **Google Search Console habit** — after 4–6 weeks of indexing, check weekly:
  - *Performance → Queries* — what keywords surface your posts
  - *Coverage* — any indexing errors
  - *Core Web Vitals* — field data from real users
- [ ] **OG images** — add `og:image` meta tags once you have per-post cover images
- [ ] **Add new pages to sitemap** — if you add new static pages (e.g. `/about/`), add them to the `staticUrls` array in `buildSitemap()` in `scripts/build-blog.js`
