---
title: "Databases: A Lead Engineer's Field Guide to Picking the Right Tool"
date: 2026-03-15
description: "From OLTP to analytics, caches to graphs — how I think about database selection as a Lead Software Developer inching toward Principal."
tags: ["databases"]
---

## Why I'm Writing This

A few weeks ago a colleague asked me: *"Should we use MongoDB or Postgres for this new service?"*

My honest first instinct was to say *"it depends"* — which is the most unhelpful answer in engineering. So instead I walked them through my actual decision framework, and then thought: I should write this down.

This post is that write-up. It's the mental model I've built over years of real production experience — working across startups, scale-ups, and enterprise systems — captured through the lens of someone who is deliberately working toward a Principal Engineer role.

The jump from Lead to Principal isn't just about writing better code. It's about making *better bets at the system level*. And few bets matter more than: **which database do you trust your data to**?

---

## The Landscape (and Where Most Teams Live)

Before the trade-offs, a map. These are the categories that cover the vast majority of real-world needs today:

| Category | Common Choices |
|---|---|
| Relational OLTP | PostgreSQL, SQL Server, MySQL |
| Document | MongoDB, CouchDB |
| Search & Indexing | Elasticsearch, OpenSearch |
| Cache / Fast Key-Value | Redis, Memcached |
| Cloud-native NoSQL | DynamoDB, Cosmos DB, Firestore |
| Data Warehouse / Analytics | Snowflake, BigQuery, Redshift, ClickHouse |
| Graph | Neo4j, Amazon Neptune |
| Time-series | TimescaleDB, InfluxDB |
| Wide-column / High-scale | Cassandra, HBase |

Most teams I've worked on use 2–4 of these at once. The dangerous trap is using **one hammer for every nail** — or worse, adding every tool on this list "just in case."

---

## The Core Four: Where You'll Spend Most of Your Career

### PostgreSQL — The One You Can Always Trust

If I could only pick one database for a new product, it would be **PostgreSQL**. Every time.

**Why it wins:**
- ACID transactions with real guarantees
- Rich type system (JSONB, arrays, ranges, enums, UUIDs natively)
- JSONB lets you do document-style queries without giving up relational integrity
- Extensions like `pg_trgm` (fuzzy search), `PostGIS` (geospatial), `TimescaleDB` (time-series) — it stretches far
- Battle-tested at every scale from side project to Fortune 500

**When it struggles:**
- Horizontal write scaling beyond a single master (read replicas help reads, not writes)
- Schema migrations at scale require care — `ALTER TABLE` on 500M rows is a war story waiting to happen
- Full-text search is functional but loses to Elasticsearch at serious scale

**Stage it's best at:**
Early startup all the way to mid-stage enterprise. If you outgrow it for writes, you probably also have a team to handle something more complex.

**Real-world example:**
At a fintech I worked at, we ran the entire transactional core — accounts, ledgers, transfers — on PostgreSQL with read replicas. JSONB stored flexible product configurations. We didn't touch another DB for three years. That's how good it is.

---

### SQL Server — The Enterprise Workhorse

If PostgreSQL is the developer's darling, **SQL Server** is what's already running in your enterprise client's data center.

**Why it wins:**
- First-class integration with Azure and the Microsoft ecosystem (SSRS, SSIS, Power BI)
- Exceptional tooling — SQL Server Management Studio, Query Analyzer, Profiler
- Row-level security and advanced auditing built in
- Always On Availability Groups for HA are mature and reliable

**When it struggles:**
- Licensing costs are real — especially Enterprise edition
- Less portable outside the Windows / Azure world
- Open-source culture doesn't rally around it the way it does Postgres

**Stage it's best at:**
Mid-to-large enterprise, especially Microsoft-stack companies. Greenfield projects generally go PostgreSQL unless there's a strategic reason to stay in the Microsoft ecosystem.

**Real-world example:**
A healthcare client had a 15-year-old SQL Server installation. Every BI tool, every reporting dashboard, every stored proc was baked in. We didn't replace it — we built *around* it, using it as the source of truth and syncing to modern services where needed. Sometimes the right engineering call is staying.

---

### MongoDB — Flexible, Powerful, Misused

MongoDB gets a bad reputation, usually from teams that used it as a dumping ground with zero schema discipline. Used intentionally, it's excellent.

**Why it wins:**
- Schema-per-document flexibility is genuinely useful for highly variable content (think CMS, product catalogs with different attributes per category)
- Aggregation pipeline is expressive and powerful
- Horizontal scaling (sharding) is first-class and well-documented
- Rich geospatial support

**When it struggles:**
- Multi-document transactions exist but have overhead — if your data is highly relational, you will fight the model
- "Flexible schema" is often code for "no schema discipline" — without conventions, MongoDB collections become an archaeology dig
- Joins are awkward (`$lookup`) — you end up embedding things that should be normalized

**Stage it's best at:**
Startups with rapidly evolving data models, content-heavy platforms, catalogue services, user-generated data.

**The Lead Engineer's rule:**
*If you find yourself doing multi-collection joins constantly, your data wants to be relational. Switch.*

**Real-world example:**
An e-commerce platform used MongoDB for the product catalogue — each category had completely different attributes (a shirt has size/color, a laptop has RAM/CPU). Relational EAV tables would have been a mess. Mongo was the right call there.

---

### Redis — Speed as a Feature

Redis is not a primary database. Say it out loud. Write it on a sticky note. **Redis is not a primary database.**

It is, however, the best tool in the shed for several specific jobs.

**Why it wins:**
- Sub-millisecond latency — nothing else comes close
- Data structures (sorted sets, pub/sub, streams, hyperloglogs) are first-class primitives
- Session storage, leaderboards, rate limiting, distributed locks — all elegant with Redis
- Redis Streams is a lightweight event log / message bus

**When it struggles:**
- Data lives in memory — cost scales with dataset size
- Persistence (`AOF`/`RDB`) is there but recovery is more complex than a relational DB
- Not a source of truth — treat it as a cache, not a system of record

**Stage it's best at:**
Any stage as a caching and speed layer. Add Redis when you have hot read paths, session data, or need a fast pub/sub bus.

**Lead Engineer pattern:**
Cache-aside with a TTL. Write to Postgres (source of truth), populate Redis on read, expire with a sensible TTL. Add cache invalidation logic only where you need real-time consistency. 99% of the time, TTL-based expiry is enough.

---

### Elasticsearch — Search as a First-Class Citizen

When users type into a search box and expect Google-quality results, that's Elasticsearch's job.

**Why it wins:**
- Inverted index is purpose-built for full-text search
- Relevance scoring (BM25) and fuzzy matching out of the box
- Kibana makes it a great logging/observability platform
- Powerful aggregations for analytics over search results

**When it struggles:**
- Not a transactional store — don't write to Elastic as your primary storage
- Index mapping discipline matters a lot; mapping explosions are a real operational problem
- Operational complexity: cluster management, shard sizing, reindex operations
- Eventual consistency — data lags behind your source of truth

**Stage it's best at:**
Any product with meaningful search UX, log management (ELK stack), or analytics over text-heavy data.

**Common pattern:**
Primary data in Postgres → sync to Elasticsearch via CDC (Change Data Capture) or an event queue. Elasticsearch serves reads. Writes always go to Postgres first.

---

## The Broader Landscape: When Startups Become Platforms

Once your product matures, you'll encounter needs the Core Four don't cover natively.

### Cloud-native NoSQL: DynamoDB, Cosmos DB, Firestore

These are managed, serverless-by-default, and scale to near-infinite throughput — but they demand a completely different mental model.

**DynamoDB** (AWS) is the gold standard for single-table design. Mastering it means designing your access patterns *before* you define your schema — the inverse of relational thinking. When you get it right, it's nearly infinitely scalable at low cost. When you get it wrong, you're in a painful remodel.

**Cosmos DB** (Azure) is similar but with multiple consistency models (strong, bounded staleness, eventual) as a dial you can tune per operation. Useful when you need to trade consistency for latency globally.

**Firestore** (GCP) is the choice for mobile/real-time apps — its live subscription model syncs directly to clients with almost no backend code.

**When to reach for this tier:**
High-traffic, high-variability workloads at scale. API backends with known access patterns. Mobile apps needing real-time sync. Not for deeply relational data.

---

### Data Warehouse & Analytics: Snowflake, BigQuery, Redshift, ClickHouse

Your OLTP database is optimized for writes and point lookups. Analytics workloads — aggregate scans over billions of rows — will kill it.

| Tool | Sweet Spot |
|---|---|
| **Snowflake** | Multi-cloud, data sharing, strong ecosystem |
| **BigQuery** | Serverless, tight GCP integration, pay-per-query |
| **Redshift** | AWS-native, good for existing AWS shops |
| **ClickHouse** | Self-hosted, blazing fast, great for real-time analytics |

**The architectural pattern:**
OLTP writes to Postgres/SQL Server → events or CDC flows to a data warehouse → analysts and BI tools query the warehouse, never the OLTP system.

This separation is not optional at scale. I've seen OLTP databases brought to their knees by a single analyst running a GROUP BY over 200M rows. Don't let that be you.

---

### Graph: Neo4j

Graph databases model data as nodes and edges. They shine when **relationships themselves are the data**.

Classic use cases: social networks (who follows whom), fraud detection (shared devices, accounts, addresses), recommendation engines (users → products → categories), access control with complex role hierarchies.

SQL joins can model graphs, but the query complexity explodes with depth. "Give me all friends-of-friends-of-friends who bought product X" is 3 self-joins in SQL and one `MATCH` pattern in Cypher.

**When to reach for it:**
Adding "graph-like" features (recommendations, social, access hierarchies) to a product. Fraud analytics. Network topology.

---

### Time-series: TimescaleDB, InfluxDB

IoT sensors, application metrics, financial tick data — these are time-series workloads. They share properties: high insert rates, data ordered by timestamp, queries almost always involve time-range scans and aggregations.

**TimescaleDB** is a PostgreSQL extension — same SQL interface, automatic partitioning by time, compression, continuous aggregates. If your team already knows Postgres, this is the lowest-friction time-series solution.

**InfluxDB** is purpose-built: its query language (Flux) and data model are optimized for high-cardinality metric data.

**When to reach for it:**
Monitoring infrastructure, IoT data pipelines, financial market data. If your timestamps are just metadata (user created_at), you don't need this — Postgres handles that fine.

---

### Wide-column: Cassandra

Cassandra is built for one thing: **massive write throughput with linear horizontal scalability across datacenters**.

It sacrifices query flexibility (no joins, limited secondary indexes, partition-key-first design) in exchange for near-unlimited scale and multi-datacenter active-active replication.

Used by Netflix for watch history, Apple for iCloud backups, Discord for message storage.

**When to reach for it:**
Very high write volume (millions of writes/sec), multi-region active-active, time-series or append-heavy data. Almost never the right first choice for a startup — the operational complexity and data modeling constraints are high.

---

## The Decision Framework I Actually Use

When I encounter a new service or data problem, I run through this:

```
1. What are the access patterns?
   - Point lookups? → relational/key-value
   - Full-text search? → Elasticsearch
   - Time-range aggregations? → time-series
   - Relationship traversal? → graph
   - Analytical scans? → warehouse

2. What are the consistency requirements?
   - Financial / transactional? → strong consistency (Postgres, SQL Server)
   - Mostly read, some lag OK? → Elasticsearch, analytics stores
   - Real-time sync to clients? → Firestore / Redis pub/sub

3. What's the write volume?
   - < 10K writes/sec: Postgres handles it
   - > 100K writes/sec sustained: consider Cassandra, DynamoDB, or partition Postgres
   - Time-series high-cardinality writes: TimescaleDB or InfluxDB

4. What's the team's existing expertise?
   - Never underestimate operational burden of an unfamiliar DB
   - A slightly suboptimal choice the team knows well usually beats an "optimal" choice no one understands

5. What's the cost model?
   - Managed (RDS, Cloud SQL, Atlas): higher $/unit, lower ops cost
   - Self-hosted: lower $/unit, significant ops burden
   - Snowflake/BigQuery: per-query cost model — plan for query governance
```

---

## How I Frame This for My Portfolio

For a long time I wrote "PostgreSQL, MongoDB, Redis" on my resume and left it at that. A Principal Engineer I mentored with suggested a better frame:

> **Databases & Data Platforms:** PostgreSQL, SQL Server, MongoDB, Redis, Elasticsearch; hands-on experience designing OLTP and caching layers; familiar with Snowflake/BigQuery/Redshift for analytical workloads and DynamoDB for high-throughput cloud-native services.

That framing does a few things:
- Shows operational depth (OLTP design, caching patterns) not just "I used it"
- Covers both startup (Postgres/Mongo/Redis) and enterprise (SQL Server, data warehouse) patterns
- Signals awareness of the analytical tier without overstating production depth
- Reads well to both a startup CTO and an enterprise architecture committee

---

## What the Principal Engineer Lens Adds

The difference between a Senior Engineer picking a database and a Principal Engineer picking one comes down to **scope of consequence**:

- A Senior asks: "Does this solve the problem?"
- A Principal asks: "Does this solve the problem in a way that doesn't create a bigger problem in 18 months?"

That means thinking about:
- **Migration cost** — how hard will it be to move off this if we outgrow it?
- **Operational maturity** — who owns this at 2 AM when it falls over?
- **Team capability** — does the team have or can they build the skills to run this safely?
- **Data gravity** — once 500M rows live somewhere, moving them is a project, not a task
- **Coupling** — does this choice lock us into a cloud vendor / licensing model in a way that reduces future optionality?

I'm still building this instinct. But writing it down helps me see the gaps.

---

## Closing Thoughts

Databases are infrastructure decisions that compound. A bad database choice rarely kills a product on day one — it kills it when you're stressed, scaling, and don't have the bandwidth to fix foundational issues.

The goal isn't to know every database. The goal is to understand the *tradeoff landscape* well enough that you can make a defensible choice at any stage, communicate it clearly to your team, and know when to revisit it.

That, more than any specific technology, is what I'm working toward on this path to Principal.
