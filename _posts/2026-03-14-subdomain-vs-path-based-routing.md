---
title: "Subdomains vs Path-Based Routing: The Architecture Decision Nobody Talks About"
date: 2026-03-14
description: "One routing choice quietly shapes your security posture, deployment pipeline, and scaling strategy. Here's how banks, hospitals, and big tech think about it — and how you should too."
tags: ["security", "system-design"]
---

## The Hospital That Got Hacked

Imagine you're a developer at a hospital. You just shipped a patient portal. It lives at `hospital.com/patient-portal`. Everything's fine — until one morning, a nurse finds a cross-site scripting bug in the internal scheduling tool, sitting at `hospital.com/scheduler`.

Here's the terrifying part: because both apps share the same origin, that single XSS vulnerability just handed an attacker access to **every patient's session cookie** — their medical records, prescription data, all of it. One bug. Total compromise.

That's not a hypothetical. That's what happens when you choose the wrong routing architecture.

This post breaks down one of the most underrated architectural decisions you'll make: **subdomains versus path-based routing**. I'll show you how banks, hospitals, big tech, and ecommerce companies actually think about it — because this one choice quietly shapes your security, deployment pipeline, scaling strategy, and career.

---


## What Are We Actually Choosing Between?

On the surface, this looks cosmetic. Who cares if it's `shop.amazon.com` or `amazon.com/shop`?

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem;margin:2rem 0;font-size:.9rem">
  <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:1.5rem">
    <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:1rem">
      <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;flex-shrink:0"></span>
      <span style="width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block;flex-shrink:0"></span>
      <span style="width:10px;height:10px;border-radius:50%;background:#10b981;display:inline-block;flex-shrink:0"></span>
      <span style="margin-left:.5rem;color:#38bdf8;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700">Subdomain Routing</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:.5rem">
      <div style="background:#1e293b;border-radius:6px;padding:.45rem .75rem;font-family:monospace;font-size:.8rem"><span style="color:#475569">https://</span><span style="color:#38bdf8;font-weight:700">shop</span><span style="color:#cbd5e1">.amazon.com</span></div>
      <div style="background:#1e293b;border-radius:6px;padding:.45rem .75rem;font-family:monospace;font-size:.8rem"><span style="color:#475569">https://</span><span style="color:#38bdf8;font-weight:700">docs</span><span style="color:#cbd5e1">.amazon.com</span></div>
      <div style="background:#1e293b;border-radius:6px;padding:.45rem .75rem;font-family:monospace;font-size:.8rem"><span style="color:#475569">https://</span><span style="color:#38bdf8;font-weight:700">aws</span><span style="color:#cbd5e1">.amazon.com</span></div>
    </div>
    <div style="margin-top:1rem;padding:.6rem .75rem;background:#052e16;border:1px solid #166534;border-radius:6px;color:#86efac;font-size:.775rem">🛡️ Each subdomain = its own browser origin</div>
  </div>
  <div style="background:#0f172a;border:1px solid #431307;border-radius:12px;padding:1.5rem">
    <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:1rem">
      <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;flex-shrink:0"></span>
      <span style="width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block;flex-shrink:0"></span>
      <span style="width:10px;height:10px;border-radius:50%;background:#10b981;display:inline-block;flex-shrink:0"></span>
      <span style="margin-left:.5rem;color:#f97316;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700">Path Routing</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:.5rem">
      <div style="background:#1e293b;border-radius:6px;padding:.45rem .75rem;font-family:monospace;font-size:.8rem"><span style="color:#475569">https://amazon.com</span><span style="color:#f97316;font-weight:700">/shop</span></div>
      <div style="background:#1e293b;border-radius:6px;padding:.45rem .75rem;font-family:monospace;font-size:.8rem"><span style="color:#475569">https://amazon.com</span><span style="color:#f97316;font-weight:700">/docs</span></div>
      <div style="background:#1e293b;border-radius:6px;padding:.45rem .75rem;font-family:monospace;font-size:.8rem"><span style="color:#475569">https://amazon.com</span><span style="color:#f97316;font-weight:700">/aws</span></div>
    </div>
    <div style="margin-top:1rem;padding:.6rem .75rem;background:#450a0a;border:1px solid #7f1d1d;border-radius:6px;color:#fca5a5;font-size:.775rem">⚠️ All paths share the same browser origin</div>
  </div>
</div>

With **subdomain routing**, each application gets its own address — its own front door. `shop.amazon.com` and `docs.amazon.com` share the parent domain, but the browser treats them as **separate origins**.

With **path routing**, everything lives under one roof. One domain, one origin — you carve up apps using URL paths. `/shop`, `/docs`, `/aws` are just rooms inside the same house.

This single decision ripples through six critical dimensions: security, cost, infrastructure, application code, SEO, and authentication. And once you ship with one approach, switching is painful. Let's walk through each one.

---

## 1. Security: The Blast Radius Problem

This is the one that matters most. To explain it properly, you need one concept: **browser origin policy**.

The browser treats each unique combination of protocol, domain, and port as a separate "origin." The key rule: **JavaScript running in one origin cannot access cookies, localStorage, or the DOM of another origin.** That's the browser's security wall.

Watch what happens with our two approaches.

**With subdomains** — `scheduler.hospital.com` and `patient.hospital.com` are two different origins. If an attacker exploits an XSS vulnerability in the scheduler, they can steal the scheduler's cookies. Bad — but they *cannot* reach the patient portal's cookies, localStorage, or session data. The damage is **contained**.

**With paths** — `hospital.com/scheduler` and `hospital.com/patient-portal` are the *same* origin. No wall. That one XSS bug in the scheduler? The attacker now has access to every cookie, every piece of localStorage, every DOM element across every app on the domain. Patient records. Admin panels. Billing data. Everything.

This is what security engineers call the **blast radius** — how far does damage spread when something goes wrong?

<div id="blast-demo" style="background:#0a0f1a;border:1px solid #1e293b;border-radius:14px;padding:1.75rem;margin:2rem 0;font-size:.875rem">
  <p style="text-align:center;color:#94a3b8;margin:0 0 1.5rem;font-size:.8rem;font-style:italic">Click the button below to visualize how an XSS attack propagates in each architecture.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.25rem">
    <div>
      <div style="text-align:center;color:#38bdf8;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.875rem">🛡️ Subdomain Routing</div>
      <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:1rem;display:flex;flex-direction:column;gap:.5rem">
        <div id="xss-sub-sched" style="background:#1e293b;border:2px solid #334155;border-radius:8px;padding:.75rem;text-align:center;transition:background .4s,border-color .4s">
          <div style="font-size:.62rem;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-family:monospace">scheduler.hospital.com</div>
          <div style="font-size:.8rem;color:#e2e8f0;margin-top:.25rem;font-weight:500">Scheduling App</div>
        </div>
        <div style="text-align:center;padding:.3rem 0;border-top:1px dashed #1e3a5f;border-bottom:1px dashed #1e3a5f">
          <span style="color:#22c55e;font-size:.72rem;font-weight:700">✦ ORIGIN WALL ✦</span>
        </div>
        <div id="xss-sub-patient" style="background:#1e293b;border:2px solid #334155;border-radius:8px;padding:.75rem;text-align:center;transition:background .4s,border-color .4s">
          <div style="font-size:.62rem;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-family:monospace">patient.hospital.com</div>
          <div style="font-size:.8rem;color:#e2e8f0;margin-top:.25rem;font-weight:500">Patient Portal</div>
        </div>
      </div>
      <div id="xss-sub-result" style="display:none;margin-top:.75rem;padding:.7rem .875rem;background:#052e16;border:1px solid #166534;border-radius:8px;color:#86efac;font-size:.78rem;text-align:center">✅ Blast radius contained — patient data is safe</div>
    </div>
    <div>
      <div style="text-align:center;color:#f97316;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.875rem">⚠️ Path Routing</div>
      <div style="background:#0f172a;border:1px solid #431307;border-radius:10px;padding:1rem;display:flex;flex-direction:column;gap:.5rem">
        <div id="xss-path-sched" style="background:#1e293b;border:2px solid #334155;border-radius:8px;padding:.75rem;text-align:center;transition:background .4s,border-color .4s">
          <div style="font-size:.62rem;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-family:monospace">hospital.com/scheduler</div>
          <div style="font-size:.8rem;color:#e2e8f0;margin-top:.25rem;font-weight:500">Scheduling App</div>
        </div>
        <div style="text-align:center;padding:.3rem 0;border-top:1px dashed #431307;border-bottom:1px dashed #431307">
          <span style="color:#ef4444;font-size:.72rem;font-weight:700">— same origin, no wall —</span>
        </div>
        <div id="xss-path-patient" style="background:#1e293b;border:2px solid #334155;border-radius:8px;padding:.75rem;text-align:center;transition:background .4s,border-color .4s">
          <div style="font-size:.62rem;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-family:monospace">hospital.com/patient-portal</div>
          <div style="font-size:.8rem;color:#e2e8f0;margin-top:.25rem;font-weight:500">Patient Portal</div>
        </div>
      </div>
      <div id="xss-path-result" style="display:none;margin-top:.75rem;padding:.7rem .875rem;background:#450a0a;border:1px solid #7f1d1d;border-radius:8px;color:#fca5a5;font-size:.78rem;text-align:center">💥 Full breach — attacker owns all session data</div>
    </div>
  </div>
  <div style="text-align:center;margin-top:1.5rem;display:flex;align-items:center;justify-content:center;gap:.75rem;flex-wrap:wrap">
    <button onclick="xssSimulate()" id="xss-attack-btn" style="background:#dc2626;color:#fff;border:none;border-radius:8px;padding:.6rem 1.5rem;font-size:.825rem;font-weight:600;cursor:pointer;letter-spacing:.02em">⚡ Simulate XSS Attack</button>
    <button onclick="xssReset()" id="xss-reset-btn" style="display:none;background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:8px;padding:.6rem 1.25rem;font-size:.825rem;font-weight:600;cursor:pointer">↺ Reset</button>
  </div>
</div>
<script>
function xssSimulate(){var btn=document.getElementById('xss-attack-btn');btn.disabled=true;btn.textContent='⚡ Attacking...';setTimeout(function(){var s=document.getElementById('xss-sub-sched');s.style.background='#450a0a';s.style.borderColor='#ef4444';var p=document.getElementById('xss-path-sched');p.style.background='#450a0a';p.style.borderColor='#ef4444';},500);setTimeout(function(){document.getElementById('xss-sub-result').style.display='block';},1300);setTimeout(function(){var p2=document.getElementById('xss-path-patient');p2.style.background='#450a0a';p2.style.borderColor='#ef4444';},1600);setTimeout(function(){document.getElementById('xss-path-result').style.display='block';btn.textContent='⚡ Simulate XSS Attack';document.getElementById('xss-reset-btn').style.display='inline-block';},2200);}
function xssReset(){['xss-sub-sched','xss-sub-patient','xss-path-sched','xss-path-patient'].forEach(function(id){var el=document.getElementById(id);el.style.background='#1e293b';el.style.borderColor='#334155';});document.getElementById('xss-sub-result').style.display='none';document.getElementById('xss-path-result').style.display='none';var btn=document.getElementById('xss-attack-btn');btn.disabled=false;document.getElementById('xss-reset-btn').style.display='none';}
</script>

### Real-World Examples

**Banking.** Chase has `secure.chase.com` for banking and `creditcards.chase.com` for credit cards. Wells Fargo runs `connect.secure.wellsfargo.com`. They don't put their trading platform and mortgage portal on the same origin. If a vulnerability hits one product, regulators ask: "Could this have compromised accounts in your other products?" With path-based routing, the answer is yes — by design.

**Ecommerce.** Shopify gives every merchant their own subdomain: `yourstore.myshopify.com`. If every Shopify store shared the same origin, one compromised store could access session data from every other store — affecting millions of merchants.

**Healthcare.** HIPAA compliance isn't optional. If patient data leaks through a vulnerability in a co-located app that you could have isolated with subdomains, that's an audit finding.

> **One nuance:** Even with subdomains, if you set your auth cookie to `Domain=.hospital.com` (with the leading dot), that cookie becomes accessible across all subdomains. You still need intentional cookie scoping — but the *default posture* is isolation, and that's always where you want to start.

**Verdict: subdomains win, and it's not close.**

---

## 2. Cost: The Myth That Subdomains Are Expensive

Many developers avoid subdomains assuming it costs more. Let's bust that myth.

**Subdomains are free.** If you own `yourdomain.com`, you can create unlimited subdomains at zero additional cost.

**SSL certificates?** Let's Encrypt gives you wildcard certificates — one cert covers `*.yourdomain.com` — for free. Certbot handles per-subdomain certs automatically with auto-renewal.

**DNS records?** One A record per subdomain. Cloudflare's free tier supports unlimited subdomains with DNS and proxying.

**VPS cost?** Identical. Whether Nginx routes on subdomain or path, the compute cost is the same.

The actual cost difference between subdomains and paths is effectively **zero**.

**Verdict: it's a tie.**

---

## 3. Infrastructure & Deployment: Where It Gets Real

This is where the architectural difference becomes tangible, especially at the senior and principal level.

Compare two Nginx configurations side by side.

**Subdomain config** — each app gets its own `server` block. Clean and isolated. Changing the marketplace config cannot break the chatbot.

```nginx
server {
    server_name marketplace.yourdomain.com;
    location / { proxy_pass http://marketplace:3000; }
}

server {
    server_name chatbot.yourdomain.com;
    location / { proxy_pass http://chatbot:4000; }
}
```

**Path config** — everything lives in one block with `location` directives, and you need **path rewriting**. Your app doesn't know it's mounted at `/marketplace` — it thinks it's at `/`. Nginx strips the prefix before forwarding, and that rewriting breaks in subtle ways: nested routes, static assets, API paths — all need to be rewrite-aware.

```nginx
server {
    server_name yourdomain.com;
    location /marketplace/ {
        rewrite ^/marketplace/(.*)$ /$1 break;
        proxy_pass http://marketplace:3000;
    }
    location /chatbot/ {
        rewrite ^/chatbot/(.*)$ /$1 break;
        proxy_pass http://chatbot:4000;
    }
}
```

### The Deployment Story

It's Friday afternoon. Marketplace has a critical bug fix. With subdomains, you redeploy that one container. The chatbot, LMS, and blog are completely unaffected — different server blocks, different containers, different pipelines.

With paths, you're touching the same Nginx config, the same server block. A bad rewrite rule during the marketplace deploy can take down routing for the chatbot too. **Everything is coupled.**

### Scale and Team Structure

AWS Console lives at `console.aws.amazon.com`. AWS Documentation at `docs.aws.amazon.com`. S3 uses `s3.console.aws.amazon.com`. Each service is owned by a different team, deployed on its own schedule, on its own infrastructure. When the S3 team needs to scale, they don't coordinate with the Lambda team. **The subdomain boundary is also an organizational boundary.**

Google does the same: `mail.google.com`, `docs.google.com`, `drive.google.com`, `calendar.google.com` — separate products, separate teams, separate release cycles.

**Migration path:** if your chatbot becomes wildly popular and needs a dedicated server, with subdomains you change one DNS record — a five-minute operation. With paths, you'd need to refactor your entire routing layer.

**Verdict: subdomains win decisively.**

---

## 4. Application Code: The Hidden Prefix Tax

You don't feel this pain upfront. You feel it six months later when things are subtly broken everywhere.

**With subdomains**, your React app thinks it lives at `/`. Routes are clean:

```jsx
<Route path="/products" component={Products} />
<Route path="/cart" component={Cart} />
```

API calls are simple: `fetch('/api/products')`. Every asset reference starts from `/`. It just works — because from the app's perspective, it *is* the entire website.

**With paths**, every app needs to know its mounted prefix. React Router needs a `basename`:

```jsx
<BrowserRouter basename="/marketplace">
  <Route path="/products" component={Products} />
</BrowserRouter>
```

Every API call needs the prefix: `fetch('/marketplace/api/products')`. Every image tag, stylesheet link, and asset must include the prefix. Miss one? Broken image. Broken route. Broken API call. And these bugs only surface in production, because in development your app IS at root.

I call this the **prefix tax** — a constant low-grade complexity that every developer on every team has to carry, forever.

Stripe runs `dashboard.stripe.com` and `docs.stripe.com` — not `stripe.com/dashboard` and `stripe.com/docs`. Their dashboard is a complex React SPA; their docs site is a completely different static site generator. Forcing both into the same origin with path prefixes would create constant friction for both teams.

**Verdict: subdomains win.**

---

## 5. SEO and Auth: Where Paths Fight Back

In fairness, path-based routing has a genuine edge in two areas.

### SEO: Domain Authority

Google treats subdomains as semi-separate websites. A backlink to `blog.yourdomain.com` strengthens your blog subdomain, but that authority doesn't fully flow to `shop.yourdomain.com`. With paths, every backlink to `yourdomain.com/anything` strengthens the same root domain.

For content-heavy businesses — media companies, content marketing sites — this matters. If organic search is your primary growth channel, paths consolidate authority faster.

The nuance: Google has gotten much better at associating subdomains with their parent. Companies like HubSpot run `blog.hubspot.com` and still dominate search. Google Search Console lets you explicitly link your subdomains. It's manageable — but paths do have a natural advantage.

### Auth: Zero Configuration Overhead

With paths, authentication is trivially simple. Everything is the same origin — set a cookie and every app reads it. No CORS. No cookie tricks.

With subdomains, you need two things:

1. Set your auth cookie with `Domain=.yourdomain.com` so it's shared across subdomains.
2. Configure CORS so that `marketplace.yourdomain.com` can make credentialed requests to `auth.yourdomain.com`.

About 15 lines of config — not hard, but extra work, and if you get it wrong your login flow breaks.

**Paths win on SEO and auth simplicity.** Worth acknowledging.

But notice the pattern: **paths win on convenience; subdomains win on isolation and scalability.** In production systems serving real users with real data, convenience takes a back seat to resilience.

---

## 6. The Enterprise Pattern: Use Both

What do companies actually do in practice? They use **both**.

The answer isn't "always subdomains" or "always paths." It's: **subdomains between applications, paths within them.**

**GitHub:** `gist.github.com` and `docs.github.com` are separate products → subdomains. Inside `github.com`, `/pulls`, `/issues`, and `/settings` are features of one product → paths.

**AWS:** `console.aws.amazon.com` and `docs.aws.amazon.com` are separate products → subdomains. Inside the console, `/s3`, `/ec2`, `/lambda` are sections of one UI → paths.

This hybrid maps cleanly to a concept from Domain-Driven Design: **bounded contexts**. Each subdomain is a self-contained business capability with its own models, data, and team. Within that context, paths organize the internal features.

```
Subdomain per app         →  Bounded Context
Nginx reverse proxy       →  API Gateway
Shared auth service       →  Identity Provider (Okta, Auth0)
Docker network            →  Service Mesh
```

If you can explain this architecture in a system design interview and connect it to enterprise equivalents, you're demonstrating principal-engineer-level thinking. Not because of the tooling — because you understood **why the boundaries exist**.

---

## Quick Verdict Scorecard

<div style="margin:1.5rem 0;overflow-x:auto">
  <table style="width:100%;border-collapse:collapse;background:#0f172a;border-radius:12px;overflow:hidden;font-size:.875rem;border:1px solid #1e293b;min-width:480px">
    <thead>
      <tr style="background:#1e293b">
        <th style="text-align:left;padding:.875rem 1.25rem;color:#94a3b8;font-weight:600;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em">Dimension</th>
        <th style="text-align:center;padding:.875rem 1rem;color:#38bdf8;font-weight:700;font-size:.9rem">Subdomains</th>
        <th style="text-align:center;padding:.875rem 1rem;color:#f97316;font-weight:700;font-size:.9rem">Paths</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-top:1px solid #1e293b">
        <td style="padding:.8rem 1.25rem;color:#e2e8f0">🔒 Security</td>
        <td style="padding:.8rem;text-align:center"><span style="background:#052e16;color:#4ade80;padding:.2rem .75rem;border-radius:20px;font-size:.75rem;font-weight:700">WINS</span></td>
        <td style="padding:.8rem;text-align:center"><span style="color:#475569;font-size:.85rem">—</span></td>
      </tr>
      <tr style="border-top:1px solid #1e293b;background:#0a0f1a">
        <td style="padding:.8rem 1.25rem;color:#e2e8f0">💰 Cost</td>
        <td style="padding:.8rem;text-align:center"><span style="background:#172554;color:#93c5fd;padding:.2rem .75rem;border-radius:20px;font-size:.75rem;font-weight:700">TIE</span></td>
        <td style="padding:.8rem;text-align:center"><span style="background:#172554;color:#93c5fd;padding:.2rem .75rem;border-radius:20px;font-size:.75rem;font-weight:700">TIE</span></td>
      </tr>
      <tr style="border-top:1px solid #1e293b">
        <td style="padding:.8rem 1.25rem;color:#e2e8f0">🚀 Infrastructure & Deployment</td>
        <td style="padding:.8rem;text-align:center"><span style="background:#052e16;color:#4ade80;padding:.2rem .75rem;border-radius:20px;font-size:.75rem;font-weight:700">WINS</span></td>
        <td style="padding:.8rem;text-align:center"><span style="color:#475569;font-size:.85rem">—</span></td>
      </tr>
      <tr style="border-top:1px solid #1e293b;background:#0a0f1a">
        <td style="padding:.8rem 1.25rem;color:#e2e8f0">⚙️ App Code Simplicity</td>
        <td style="padding:.8rem;text-align:center"><span style="background:#052e16;color:#4ade80;padding:.2rem .75rem;border-radius:20px;font-size:.75rem;font-weight:700">WINS</span></td>
        <td style="padding:.8rem;text-align:center"><span style="color:#475569;font-size:.85rem">—</span></td>
      </tr>
      <tr style="border-top:1px solid #1e293b">
        <td style="padding:.8rem 1.25rem;color:#e2e8f0">📈 SEO</td>
        <td style="padding:.8rem;text-align:center"><span style="color:#475569;font-size:.85rem">—</span></td>
        <td style="padding:.8rem;text-align:center"><span style="background:#052e16;color:#4ade80;padding:.2rem .75rem;border-radius:20px;font-size:.75rem;font-weight:700">WINS</span></td>
      </tr>
      <tr style="border-top:1px solid #1e293b;background:#0a0f1a">
        <td style="padding:.8rem 1.25rem;color:#e2e8f0">🔑 Auth Simplicity</td>
        <td style="padding:.8rem;text-align:center"><span style="color:#475569;font-size:.85rem">—</span></td>
        <td style="padding:.8rem;text-align:center"><span style="background:#052e16;color:#4ade80;padding:.2rem .75rem;border-radius:20px;font-size:.75rem;font-weight:700">WINS</span></td>
      </tr>
    </tbody>
  </table>
</div>

---

## The Decision Framework

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.25rem;margin:1.5rem 0">
  <div style="background:#0f172a;border:1px solid #431307;border-radius:12px;padding:1.5rem">
    <div style="color:#f97316;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:.75rem">Use Paths When</div>
    <p style="color:#cbd5e1;font-size:.875rem;line-height:1.65;margin:0 0 1rem">You're building <strong style="color:#f97316">one application</strong> with multiple pages. Settings, profile, dashboard — these are features of the same product, built by the same team, deployed together.</p>
    <div style="display:flex;flex-wrap:wrap;gap:.4rem">
      <span style="background:#1e293b;color:#94a3b8;padding:.2rem .55rem;border-radius:4px;font-size:.7rem;font-family:monospace">/settings</span>
      <span style="background:#1e293b;color:#94a3b8;padding:.2rem .55rem;border-radius:4px;font-size:.7rem;font-family:monospace">/dashboard</span>
      <span style="background:#1e293b;color:#94a3b8;padding:.2rem .55rem;border-radius:4px;font-size:.7rem;font-family:monospace">/profile</span>
    </div>
  </div>
  <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:1.5rem">
    <div style="color:#38bdf8;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:.75rem">Use Subdomains When</div>
    <p style="color:#cbd5e1;font-size:.875rem;line-height:1.65;margin:0 0 1rem">You're building <strong style="color:#38bdf8">multiple applications</strong> — different codebases, tech stacks, or deployment cycles. Or when security isolation matters, which is basically always in production.</p>
    <div style="display:flex;flex-wrap:wrap;gap:.4rem">
      <span style="background:#1e293b;color:#94a3b8;padding:.2rem .55rem;border-radius:4px;font-size:.7rem;font-family:monospace">shop.domain.com</span>
      <span style="background:#1e293b;color:#94a3b8;padding:.2rem .55rem;border-radius:4px;font-size:.7rem;font-family:monospace">api.domain.com</span>
    </div>
  </div>
  <div style="background:#0f172a;border:1px solid #4a1d96;border-radius:12px;padding:1.5rem">
    <div style="color:#a78bfa;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:.75rem">At Scale: The Hybrid</div>
    <p style="color:#cbd5e1;font-size:.875rem;line-height:1.65;margin:0 0 1rem"><strong style="color:#a78bfa">Subdomains between apps</strong>, paths within each app. GitHub, AWS, and Google all use this pattern in practice.</p>
    <div style="background:#1e1b4b;border-radius:6px;padding:.6rem .85rem;font-family:monospace;font-size:.75rem;color:#c4b5fd">shop.amazon.com<span style="color:#475569">/products/detail</span></div>
  </div>
</div>

---

The routing choice you make today echoes through your system's security posture, your team's deployment velocity, and your platform's ability to scale. It's one of those decisions that feels small but compounds over time.

Pick intentionally.
