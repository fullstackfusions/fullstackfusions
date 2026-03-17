# Mihir Patel

**Lead Software Engineer** · AI & Data Engineering · Network Automation · Distributed Systems

Portfolio: **[fullstackfusions.com](https://fullstackfusions.com/)**

---

## About Me

I am a **Lead Software Engineer** with **7+ years** of experience designing and delivering **enterprise-scale systems** across **AI/ML pipelines, data engineering, backend architecture, and network automation**.

At **Royal Bank of Canada (RBC)**, I lead the development of GenAI-powered solutions within the Technology & Operations division — building RAG systems, LLM-backed compliance tools, real-time data platforms, and agentic pipelines that operate at enterprise scale.

Beyond my core role, I'm actively building:
- **FullStackFusions** — a YouTube channel and technical brand for deep-dive engineering content
- **Localz** — an AI-native SaaS platform for local service providers
- **Open-source tooling** around agentic AI and LangGraph architectures

---

## Core Technology Stack

### Application Engineering

**Programming & Frameworks**
- Tools: Python (FastAPI, Flask, Django), JavaScript/TypeScript (React, Next.js), Go (Gin, Echo, Fiber)
- Value I Add: Clean service design, reusable architecture patterns, maintainable codebases, and faster feature delivery

**APIs & Messaging**
- Tools: REST, GraphQL, gRPC, WebSockets, Webhooks
- Value I Add: Contract-first API design, secure integrations, versioning, performance tuning, and API security with OAuth2/OIDC, JWT, RBAC/ABAC, rate limiting, and auditability

**Databases**
- Tools: PostgreSQL, MongoDB, Elasticsearch, Redis, SQL Server, Cassandra
- Value I Add: Schema and data modeling, query optimization, indexing strategy, and reliability-oriented data architecture

### Data, AI & Platform

**Data Engineering**
- Tools: Apache Kafka, Apache Airflow, AWS S3, AWS Glue
- Value I Add: Resilient batch/stream pipelines, data quality guardrails, and production-ready analytics foundations

**GenAI Features**
- Tools: Agentic RAG, fine-tuning, function/tool calling, prompt chaining, orchestration, and re-ranking
- Value I Add: Business-ready AI workflows that improve accuracy, automate operations, and reduce manual effort

**Platform & Environment Span**
- Tools: On-prem, cloud-native, hybrid-cloud, multi-cloud, containerized workloads, Kubernetes/OpenShift
- Value I Add: Platform standardization, secure-by-default architecture, and smooth modernization across mixed environments

### Operations & Delivery

**DevOps & Cloud**
- Tools: AWS (ECS, EKS, EC2, Lambda, S3), Docker, Kubernetes, GitHub Actions, Jenkins, Terraform
- Value I Add: Faster release cycles, stable CI/CD, secure delivery controls, and cost-aware cloud operations

**Network & Observability**
- Tools: Grafana, Dynatrace, NetBrain, ExtraHop, Corvil, Elasticsearch
- Value I Add: End-to-end visibility, faster incident triage, proactive performance tuning, and measurable reliability improvement

**Leadership & Delivery**
- Tools: Architecture reviews, mentoring, shell scripting, CI/CD, delivery automation
- Value I Add: Clear technical direction, stronger engineering practices, and higher team execution velocity

---

## Featured Work

**Paginated API Matching Pipeline**
Cross-dataset record matching between NetBrain and Hasura — built with retry logic, paginated API orchestration, and Airflow DAG scheduling. Focused on production-grade reliability and cross-system data integrity.

**Enterprise Data Platform (MVP)**
End-to-end ETL pipelines extracting from Grafana, Postgres, ElasticSearch, and Dynatrace — streaming via Kafka, loading into AWS S3 data lakes — orchestrated with Airflow and GitHub Actions. Designed as a cohesive platform, not a collection of isolated pipelines.

**LLM Chatbot Pipeline**
LangGraph-powered multi-agent chatbot with `message_id` tracking, real-time status streaming via FastAPI, and a custom `MessageRenderer` frontend supporting dynamic response types (`TEXT`, `TEMPLATE`, `FORM`). Built for structured state management and a responsive streaming UX.

**Investigative RAG v2 & Compliance RAG v2**
LangGraph + LangChain RAG systems with hybrid retrieval (Qdrant + Postgres FTS), Cohere reranking, and evidence-first response design — purpose-built for compliance and network domain investigation at RBC (12 CFR Part 30 alignment). Designed for auditability, retrieval precision, and regulatory defensibility.

**Localz** *(In Progress)*
AI-native SaaS platform for local service providers — featuring AI chat, seller/customer portfolios, analytics, and payment integration. Built on FastAPI + Pydantic with a monolith-first, microservices-ready architecture.

---

## Live Portfolio

**[fullstackfusions.com](https://fullstackfusions.com/)**

---

## Run Locally

```bash
git clone https://github.com/fullstackfusions/fullstackfusions.git
cd fullstackfusions
open index.html    # Mac
start index.html   # Windows
```

### Blog

Blog posts are generated from `_posts/*.md`. After adding or removing a post, rebuild:

```bash
node scripts/build-blog.js
```

Preview locally:

```bash
node scripts/build-blog.js && python3 -m http.server 8080
# http://localhost:8080/blog/
```

See [BLOG_SETUP.md](BLOG_SETUP.md) for the full authoring reference.

---

## Connect

| Platform | Link |
|---|---|
| 📧 Email | [fullstackfusions@gmail.com](mailto:fullstackfusions@gmail.com) |
| 💼 LinkedIn | [linkedin.com/in/fullstackfusions](https://linkedin.com/in/fullstackfusions) |
| 🎥 YouTube | [youtube.com/@fullstackfusions](https://www.youtube.com/@fullstackfusions) |
