# SEO & Analytics Setup — fullstackfusions.com

> A complete reference for everything done to make the blog and site SEO-ready, GA4-tracked, and Search Console-connected.

---

## Why This Matters

As a content creator and technical professional, your blog serves two purposes:

1. **Visibility** — ranking on Google for topics your target clients search for
2. **Credibility** — demonstrating expertise to potential clients and employers

SEO is the instrumentation layer for this. Think of it like your production observability stack — without it, you're flying blind on what's working.

---

## What Was Set Up

### Files Created / Modified

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

## Tier 1 — Foundational SEO

### 1. `robots.txt`

Served at `https://fullstackfusions.com/robots.txt`.

```
User-agent: *
Allow: /
Disallow: /blog/_drafts/

Sitemap: https://fullstackfusions.com/sitemap.xml
```

**What it does:** Tells Googlebot and all crawlers they can index your entire site, but to skip the drafts folder. Also points them directly to your sitemap — this is like a service registry for Googlebot.

---

### 2. `sitemap.xml`

Served at `https://fullstackfusions.com/sitemap.xml`.
**Auto-regenerated on every `node scripts/build-blog.js` run.**

| URL | Priority | Changefreq |
|---|---|---|
| `/` | 1.0 | monthly |
| `/blog/` | 0.9 | weekly |
| `/projects/` | 0.7 | monthly |
| `/experience/` | 0.7 | monthly |
| Each blog post | 0.8 | monthly |

Each blog post entry includes a `<lastmod>` date pulled from the post's frontmatter.

**What it does:** Gives Google a complete map of every page you want indexed. Without this, Google discovers pages by crawling links — slower and less reliable.

> **Action required:** Submit `https://fullstackfusions.com/sitemap.xml` in Google Search Console → *Indexing → Sitemaps*.

---

### 3. Canonical Tags

Every blog post `<head>` contains:

```html
<link rel="canonical" href="https://fullstackfusions.com/blog/posts/<slug>/" />
```

**What it does:** Tells Google which URL is the authoritative source for a page. Prevents duplicate-content penalties if your site is ever accessible from multiple domains (e.g. GitHub Pages URL vs custom domain). Also critical when you cross-post to Dev.to or Hashnode — set the canonical back to your site and Google gives you the SEO credit.

---

### 4. Open Graph + Twitter Card Meta Tags

Every blog post `<head>` contains:

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

**What it does:** Controls how your posts look when shared on LinkedIn, Twitter/X, Slack, and other platforms. Without these, social shares show a blank preview — with them, they show a rich card with your title and description.

> **Future enhancement:** Add `og:image` once you have per-post cover images. Point it to `https://fullstackfusions.com/assets/og/<slug>.png`. Rich image previews significantly increase click-through rates on social shares.

---

## Tier 2 — Rich Results & Engagement Signals

### 5. JSON-LD Schema Markup (`TechArticle`)

Every blog post embeds a structured data block in `<head>`:

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

**What it does:** This is your API contract with Google's search engine. It enables rich results — author name, publish date, and article type visible directly in the search results page, not just the blue link. Higher click-through rates from search.

> **Verify any post at:** [Google's Rich Results Test](https://search.google.com/test/rich-results)

---

### 6. RSS Feed (`feed.xml`)

Served at `https://fullstackfusions.com/feed.xml`.
**Auto-regenerated on every build.**

- RSS 2.0 format with `atom:self` link
- Includes up to 20 most recent posts with title, description, permalink, and `pubDate`
- Every blog post and the blog index page autodiscovers it via:

```html
<link rel="alternate" type="application/rss+xml" title="fullstackfusions"
      href="https://fullstackfusions.com/feed.xml" />
```

**What it does:** Enables syndication. When you cross-post to Dev.to or Hashnode, point their RSS importer at this URL for automatic import. Always set the canonical back to `fullstackfusions.com` to keep the SEO credit on your domain.

---

### 7. Internal Linking (Related Posts)

A "Related Posts" section is automatically appended to the bottom of every blog post, showing the 2 most recent other posts with links.

The build uses a **two-pass approach:**
- **Pass 1** — collects all post metadata (slug, title, date)
- **Pass 2** — writes HTML with full related-post context

**What it does:** Distributes "link equity" across your site, keeps readers on-site longer, and reduces bounce rate — all signals Google observes when ranking pages.

---

## Build Pipeline

```
node scripts/build-blog.js
```

**Pass 1** — Parse all `_posts/*.md`, collect slug + metadata.

**Pass 2** — Write each post's `index.html` with full related-posts context. Then generates in order:

1. `blog/posts/<slug>/index.html` — canonical, OG, Twitter, JSON-LD, related posts
2. `blog/index.html` — canonical + RSS autodiscovery
3. `blog/feed.json` — for the homepage widget
4. `sitemap.xml` — all static pages + all blog posts
5. `feed.xml` — RSS 2.0

> **Important:** Any time you add a new static page (e.g. `/about/`), add it to the `staticUrls` array in `buildSitemap()` inside `scripts/build-blog.js`.

---

## Google Analytics 4

**Property ID:** `G-QWCQ7T2CM8`

The GA tag is placed immediately after `<meta name="viewport">` in every page's `<head>`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QWCQ7T2CM8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-QWCQ7T2CM8');
</script>
```

**Where it lives:**
- Static pages (`index.html`, `projects/index.html`, `experience/index.html`) — added directly
- Blog pages — injected by `build-blog.js` via the `gaTag()` helper
- The property ID is a single constant `GA_ID` at the top of the build script — one place to update if it ever changes

**To verify it's firing:**
Open any page → DevTools → Network tab → filter by `gtag`. You should see a request to `https://www.googletagmanager.com/gtag/js?id=G-QWCQ7T2CM8` on every page load.

---

## The 3 Reports That Matter (Minimal Approach)

Once data flows in (48-72 hours after deploy), bookmark these and ignore everything else:

| Report | Path in GA4 | What it tells you |
|---|---|---|
| Traffic acquisition | Reports → Acquisition → Traffic acquisition | Search vs social vs direct |
| Pages & screens | Reports → Engagement → Pages and screens | Which posts get read |
| Search Console queries | Reports → Acquisition → Search Console | What keywords find you |

Check weekly, max. The signal you're looking for: *is organic traffic growing month over month as you publish more?*

---

## Search Console + GA4 Link

**Status: Done ✓**

**Why:** Surfaces which Google search queries drive traffic, directly inside GA4. The most actionable data you'll have for deciding what to write next.

**How:**
1. GA4 → Admin (gear icon, bottom left)
2. Property column → **Search Console Links**
3. Click **Link** → select your Search Console property (`fullstackfusions.com`)
4. Select your web stream → **Submit**

Allow 24-48 hours for data to populate.

---

## Blog Post Frontmatter Standard

Every post should include all four fields:

```yaml
---
title: "Your Post Title Here"
date: 2026-03-14
description: "One compelling sentence that appears in search results and social previews."
tags: ["tag1", "tag2", "tag3"]
---
```

**Why the description matters:** This is what appears under your link in Google search results (the meta description). It directly affects click-through rate — write it like ad copy, not a summary.

---

## Google Search Console — Verification

**Method used: DNS TXT record**

A `TXT` record was added to the `fullstackfusions.com` DNS configuration to prove domain ownership to Google Search Console. This is the recommended verification method for custom domains — it survives site rebuilds, template changes, and deploys because it lives in DNS, not in any HTML file.

**Where it's managed:** Your DNS provider (wherever you manage the `fullstackfusions.com` nameservers — e.g. Cloudflare, GoDaddy, Namecheap).

**To verify it's active at any time:**
```
dig TXT fullstackfusions.com
```
Look for a record starting with `google-site-verification=` in the output.

> **Do not delete this DNS TXT record.** If it's removed, Search Console will lose verification and stop reporting data for your property.

---

## Tier 3 — Ongoing Checklist

- [x] **DNS TXT record added** — domain ownership verified in Google Search Console via DNS TXT record.
- [x] **Submit sitemap** — submitted `https://fullstackfusions.com/sitemap.xml` to Search Console → *Indexing → Sitemaps*. Status shows "couldn't fetch" — this is normal on first submission; Google retries within 24–48 hours. Check back to confirm it moves to "Success".
- [x] **Search Console linked to GA4** — keyword query data will appear under Reports → Acquisition → Search Console after 24–48 hours.
- [ ] **Core Web Vitals** — run through [PageSpeed Insights](https://pagespeed.web.dev/). Watch for unoptimized images (biggest issue on static sites)
- [ ] **Cross-posting** — Dev.to / Hashnode with canonical URL set back to `fullstackfusions.com`
- [ ] **OG images** — add `og:image` meta tags once you have per-post cover images
- [ ] **Search Console weekly habit** (start after 4-6 weeks of indexing):
  - *Performance → Queries* — what keywords surface your posts
  - *Coverage* — any indexing errors
  - *Core Web Vitals* — field data from real users
- [ ] **New static pages** — add to `staticUrls` array in `buildSitemap()` in `scripts/build-blog.js`

---

## Monetization Options (When Ready)

| Method | Effort | When it makes sense |
|---|---|---|
| Affiliate links | Low — add once, passive | Now — fits naturally in technical posts |
| Google AdSense | Low setup, low yield | After ~10K monthly visitors |
| Digital products (Gumroad/Lemon Squeezy) | Medium — create product once | When you have a loyal audience |
| Sponsored posts | Low — negotiated per post | After consistent traffic + niche audience |

> **Principal Engineer framing:** At this stage, your blog's primary ROI is not ad revenue — it's inbound pipeline. One client inquiry from a ranking post is worth more than 6 months of AdSense. Build the audience first, monetize second.

---

## SEO as a System — Mental Model

| SEO Concept | Engineering Equivalent |
|---|---|
| `sitemap.xml` | Service registry — tells crawlers what exists |
| `robots.txt` | Access control — what to expose vs block |
| Canonical tags | Single source of truth — no duplicate content |
| Schema markup (JSON-LD) | API contract — structured data Google can parse |
| Core Web Vitals | SLA — performance as a ranking signal |
| Search Console | Observability layer — query and coverage monitoring |
| GA4 | Application metrics — traffic, engagement, attribution |
