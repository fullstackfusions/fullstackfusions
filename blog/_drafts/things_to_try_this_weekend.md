Great plan — and yes, it absolutely works on a static portfolio hosted on GitHub Pages. Let me give you a proper blueprint.

---

## The Mental Model First

Before anything else, internalize this: your Jekyll blog and your React portfolio are **two separate concerns** that can live in the same GitHub Pages ecosystem.

```
github.com/mihir/
├── mihir.github.io          ← React CSR portfolio (root domain)
└── mihir.github.io/blog     ← Jekyll static blogs (subdirectory or separate repo)
```

Everything below applies to both — React components can be embedded into Jekyll blogs via Web Components or iframes, or you run them as standalone pages within the same repo.

---

## Category 1 — Animations with Framer Motion

**What you can build:**

**Portfolio hero section** — Your name, title, and tagline animate in on page load with staggered reveal. Each word or letter enters independently with spring physics. Not CSS keyframes — actual physics-based motion that feels alive.

**Project cards entrance** — As you scroll down to your projects section, each card animates in from below using Framer Motion's `whileInView` trigger. The card only animates when it enters the viewport, not on page load.

**Hover interactions on project cards** — Cards lift slightly on hover with a subtle scale and shadow shift. The tech stack badges inside slide up and reveal on hover. All driven by Framer Motion's `whileHover` with zero custom CSS needed.

**Page transition animations** — When navigating between `/about`, `/projects`, `/blog` using React Router, each page slides or fades in and out smoothly. Framer Motion's `AnimatePresence` wraps your router outlet and handles the enter/exit states.

**Skill bars or radial progress indicators** — Animate from 0 to their final value when they scroll into view. The animation itself communicates confidence and draws attention naturally.

**How to build this:**

Start by wrapping your entire app in `AnimatePresence` at the router level. Then treat every major section as a `motion.div` with `initial`, `animate`, and `exit` props. Build the hero first since it's the first thing visitors see. Then add scroll-triggered animations to project cards using `whileInView`. Keep physics values (stiffness, damping) consistent across the whole site so motion feels coherent, not random.

---

## Category 2 — API Fetching with useEffect

**What you can build:**

**Live GitHub stats section** — Fetch from the GitHub public API (`api.github.com/users/mihir`) on page load using `useEffect` and display your real follower count, public repo count, and total stars dynamically. No backend needed — GitHub's API is public and CORS-friendly.

**GitHub pinned repositories** — Fetch your repos, sort by stars or recent activity, and render them as project cards automatically. Every time you create a new repo and star it, your portfolio updates without you touching the portfolio code.

**Live blog post feed** — If your Jekyll blog generates an RSS feed or a `feed.json` (which it does by default), fetch it from your React portfolio and render your latest 3 posts dynamically. Your portfolio always shows fresh content without manual updates.

**Dev.to or Hashnode article feed** — Both platforms have public APIs. If you cross-post FullStackFusions content there, fetch your articles and surface them on your portfolio automatically.

**Real-time GitHub contribution graph** — Fetch your contribution data and render a custom heatmap using D3 or a lightweight library. Much more on-brand than embedding the default GitHub widget.

**How to build this:**

Create a dedicated `hooks/` folder. Each data source gets its own custom hook — `useGitHubProfile`, `useGitHubRepos`, `useBlogFeed`. Each hook manages its own loading, error, and data state internally using `useState` and `useEffect`. Your components just call the hook and render the result. This keeps components clean and makes each data source independently testable. Always handle loading and error states — show skeleton placeholders while fetching, not blank spaces.

---

## Category 3 — React Router with Hash Routing

**What you can build:**

**Multi-page portfolio** — Proper separate pages for Home, About, Projects, Blog, Contact — each with its own URL. Visitors can bookmark `/projects` or share `/about` directly.

**Project detail pages** — Each project gets its own route like `/#/projects/tracelense` or `/#/projects/localz` with a full dedicated page — architecture diagram, tech stack, problem statement, outcome. Far more impressive than a modal.

**Blog post reader** — If you want some blog posts to live inside the portfolio itself (not Jekyll), render them as routes. The post content can be markdown files imported at build time.

**Filtered project views** — Route params like `/#/projects?filter=ai` or `/#/projects?filter=saas` that filter and animate the project grid. Shareable filtered URLs.

**How to build this:**

Set up `HashRouter` at the root. Define your routes in a single `routes.tsx` file — keeps navigation logic centralized. Use `useParams` for dynamic routes like project detail pages. Use `useSearchParams` for filter/sort state so filters are shareable via URL. Wrap the route outlet in `AnimatePresence` from Framer Motion for page transitions. Keep route components thin — they should just compose smaller components, not contain business logic.

---

## Category 4 — State Management (Context / Zustand)

**What you can build:**

**Dark/light mode toggle** — Persistent theme across all pages. User's preference saved to `localStorage` and restored on next visit. The toggle animates the sun/moon icon. All colors transition smoothly via CSS variables driven by a class on the root element.

**Blog reading progress** — A thin progress bar at the top of the page that fills as you scroll through a blog post. Global state tracks scroll position, progress bar reads it.

**Multi-step contact form** — A contact form broken into steps (Who are you → What do you need → Send). Zustand holds the form state across steps. Each step animates in. Final step sends to a free form service like Formspree (no backend needed).

**Notification/toast system** — Global toast notifications that appear when actions complete — form submitted, link copied, etc. A Zustand store holds the notification queue, a single `ToastContainer` component at the root renders them.

**Filter and sort state for projects** — Active filters (AI, SaaS, Open Source), active sort (Recent, Stars, Complexity) stored in Zustand. Any component can read or update filters without prop drilling.

**How to build this:**

Use React Context for truly global, low-frequency state — theme, user preferences. Use Zustand for anything that updates frequently or needs to be accessed from many unrelated components — toasts, filters, form state. Keep Zustand stores small and focused — one store per domain, not one giant store. Persist theme and preferences to `localStorage` using Zustand's `persist` middleware — one line of code.

---

## Category 5 — Interactive Blog Widgets (The Big Opportunity)

This is where FullStackFusions can genuinely stand out. Most technical blogs are static text and images. Interactive widgets make concepts tangible.

**What you can build:**

**RAG pipeline cost calculator** — Sliders for number of queries per day, document count, embedding model choice. Outputs estimated monthly cost across providers in real time. Directly relevant to your GRC RAG work at RBC.

**LangGraph agent flow visualizer** — An interactive diagram where clicking a node explains what that agent does, shows sample input/output, and highlights the edges (connections) to other agents. Built with React state and SVG.

**Kafka throughput simulator** — Input fields for message size, partition count, replication factor. Outputs estimated throughput and latency. Animates a mini data flow diagram as values change.

**Docker vs VM resource comparison** — A side-by-side animated visualization showing how containers share the kernel vs VMs having separate OS layers. Toggles and sliders to show memory and CPU overhead differences.

**Algorithm visualizer** — For any CS fundamentals post. Step through binary search, sorting, BFS/DFS with play/pause/speed controls. Each step highlights the relevant data structure element.

**Network topology explorer** — Relevant to your RBC network automation work. An interactive graph where nodes are network devices, edges are connections. Click a node to see its properties. Drag to rearrange. Built with D3 or React Flow.

**How to build this:**

Each widget is a self-contained React component that lives in a `/widgets` folder. It has its own state, its own styles, and no external dependencies beyond React and maybe one visualization library. For Jekyll integration, build each widget as a Web Component using React's `createRoot` — then drop a single custom HTML tag into your markdown file and it renders. This is the cleanest bridge between Jekyll and React.

---

## The Build Order

Don't try to build all of this at once. Here's the sequence that makes sense:

**Phase 1 — Foundation**
Set up the React portfolio with Vite, configure GitHub Actions for auto-deploy, get hash routing working, implement dark mode with Context. This is your scaffolding — everything else builds on it.

**Phase 2 — Live Data**
Add GitHub API integration. Your portfolio now shows real stats and real repos without manual updates. Add the Jekyll blog feed fetch so your latest posts appear on the portfolio homepage.

**Phase 3 — Motion**
Add Framer Motion. Animate the hero, add scroll-triggered card entrances, add page transitions. This is the layer that makes the portfolio feel premium.

**Phase 4 — Blog Widgets**
Build your first interactive widget — start with something directly tied to a blog post you're already writing. The RAG cost calculator or the Docker vs VM visualizer are natural fits for your niche. Ship the widget and the blog post together — the widget becomes the reason people share the post.

**Phase 5 — Polish**
Multi-step contact form, toast system, project detail pages, filter/sort state. These are quality-of-life features that round out the experience.

---

## The Principal Engineer Angle

The reason this matters beyond just "cool portfolio" — you're demonstrating **full-stack thinking on a constrained platform**. Anyone can spin up a Vercel app with a backend. Building a rich, dynamic, data-driven experience on a purely static host using only CSR, public APIs, and build-time generation shows you understand the rendering spectrum deeply and make deliberate architectural choices. That's exactly the kind of judgment that signals PE-level thinking to anyone reviewing your portfolio.
