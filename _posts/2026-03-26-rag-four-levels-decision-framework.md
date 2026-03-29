---
title: "The Four RAG Levels — A Decision Framework for Enterprise Systems"
date: 2026-03-26
description: "L1 through L4 RAG — vanilla, hybrid, GraphRAG, and agentic — with a concrete decision framework for choosing the right retrieval level for any enterprise problem."
tags: ["llm", "ai", "rag", "distributed-systems", "architecture"]
series: "RAG Enterprise Series"
series_part: 1
---

*This is Part 1 of the RAG Enterprise Series — the anchor post. Parts 2–5 apply this framework to Travel & Tourism, Hospital Management, Wealth Management, and Personal Banking. Parts 6–8 cover the supporting stack, Mamba/SSMs, and PageIndex.*

> **Scope**: Four RAG sophistication levels applied across Travel & Tourism, Hospital Management, Wealth Management, and Personal Banking. Each section covers real-world use cases, domain-specific challenges, how LLM + RAG architecture addresses them, and the full supporting stack including memory, prompt engineering, fine-tuning, and embedding improvements.

*Quick note: this article covers four domains, four RAG levels each, plus the full supporting stack. It is intentionally long — bookmark it, come back with coffee, or read it in sections.*

---

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin:2rem 0;font-family:Inter,sans-serif">

<div style="background:linear-gradient(135deg,#0c2d4e 0%,#0f172a 100%);border:1px solid #1e4976;border-radius:12px;padding:1.25rem;position:relative;overflow:hidden">
  <div style="position:absolute;top:-8px;right:-8px;font-size:3rem;opacity:.07;line-height:1">✈</div>
  <div style="font-size:1.4rem;margin-bottom:.4rem">✈️</div>
  <div style="color:#38bdf8;font-weight:700;font-size:.88rem;letter-spacing:.04em;text-transform:uppercase">Travel &amp; Tourism</div>
  <div style="color:#7dd3fc;font-size:.75rem;margin:.35rem 0 .75rem;line-height:1.55;opacity:.85">Multi-source · Multilingual · Real-time pricing · Visa routing</div>
  <div style="display:flex;gap:.3rem;flex-wrap:wrap">
    <span style="background:rgba(56,189,248,.12);color:#38bdf8;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(56,189,248,.25)">GDS (Amadeus, Sabre)</span>
    <span style="background:rgba(56,189,248,.12);color:#38bdf8;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(56,189,248,.25)">Visa DB</span>
    <span style="background:rgba(56,189,248,.12);color:#38bdf8;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(56,189,248,.25)">Reviews</span>
    <span style="background:rgba(56,189,248,.12);color:#38bdf8;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(56,189,248,.25)">Pricing APIs</span>
  </div>
  <div style="margin-top:.85rem;padding-top:.75rem;border-top:1px solid rgba(56,189,248,.18);font-size:.7rem;color:#7dd3fc"><strong style="color:#38bdf8">Stakes:</strong> Medium &nbsp;·&nbsp; <strong style="color:#38bdf8">Hallucination risk:</strong> Moderate</div>
</div>

<div style="background:linear-gradient(135deg,#3b0a0a 0%,#0f172a 100%);border:1px solid #7f1d1d;border-radius:12px;padding:1.25rem;position:relative;overflow:hidden">
  <div style="position:absolute;top:-8px;right:-8px;font-size:3rem;opacity:.07;line-height:1">+</div>
  <div style="font-size:1.4rem;margin-bottom:.4rem">🏥</div>
  <div style="color:#fca5a5;font-weight:700;font-size:.88rem;letter-spacing:.04em;text-transform:uppercase">Hospital Management</div>
  <div style="color:#fca5a5;font-size:.75rem;margin:.35rem 0 .75rem;line-height:1.55;opacity:.8">Highest-stakes · HIPAA/PHIPA · HL7 FHIR · Clinical precision</div>
  <div style="display:flex;gap:.3rem;flex-wrap:wrap">
    <span style="background:rgba(252,165,165,.12);color:#fca5a5;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(252,165,165,.25)">EHR (Epic, Cerner)</span>
    <span style="background:rgba(252,165,165,.12);color:#fca5a5;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(252,165,165,.25)">HL7 FHIR</span>
    <span style="background:rgba(252,165,165,.12);color:#fca5a5;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(252,165,165,.25)">DICOM</span>
    <span style="background:rgba(252,165,165,.12);color:#fca5a5;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(252,165,165,.25)">SNOMED CT</span>
  </div>
  <div style="margin-top:.85rem;padding-top:.75rem;border-top:1px solid rgba(252,165,165,.18);font-size:.7rem;color:#fca5a5"><strong>Stakes:</strong> Life-critical &nbsp;·&nbsp; <strong>Hallucination tolerance:</strong> Zero</div>
</div>

<div style="background:linear-gradient(135deg,#052e16 0%,#0f172a 100%);border:1px solid #14532d;border-radius:12px;padding:1.25rem;position:relative;overflow:hidden">
  <div style="position:absolute;top:-8px;right:-8px;font-size:3rem;opacity:.07;line-height:1">$</div>
  <div style="font-size:1.4rem;margin-bottom:.4rem">📈</div>
  <div style="color:#86efac;font-weight:700;font-size:.88rem;letter-spacing:.04em;text-transform:uppercase">Wealth Management</div>
  <div style="color:#86efac;font-size:.75rem;margin:.35rem 0 .75rem;line-height:1.55;opacity:.8">Fiduciary duty · MiFID II/Reg BI · Suitability · Real-time markets</div>
  <div style="display:flex;gap:.3rem;flex-wrap:wrap">
    <span style="background:rgba(134,239,172,.12);color:#86efac;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(134,239,172,.25)">IPS Documents</span>
    <span style="background:rgba(134,239,172,.12);color:#86efac;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(134,239,172,.25)">Bloomberg/Refinitiv</span>
    <span style="background:rgba(134,239,172,.12);color:#86efac;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(134,239,172,.25)">KYC/AML</span>
    <span style="background:rgba(134,239,172,.12);color:#86efac;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(134,239,172,.25)">SEC Filings</span>
  </div>
  <div style="margin-top:.85rem;padding-top:.75rem;border-top:1px solid rgba(134,239,172,.18);font-size:.7rem;color:#86efac"><strong>Stakes:</strong> Regulatory + financial &nbsp;·&nbsp; <strong>Risk:</strong> Suitability violation</div>
</div>

<div style="background:linear-gradient(135deg,#1e1152 0%,#0f172a 100%);border:1px solid #3730a3;border-radius:12px;padding:1.25rem;position:relative;overflow:hidden">
  <div style="position:absolute;top:-8px;right:-8px;font-size:3rem;opacity:.07;line-height:1">⬡</div>
  <div style="font-size:1.4rem;margin-bottom:.4rem">🏦</div>
  <div style="color:#a5b4fc;font-weight:700;font-size:.88rem;letter-spacing:.04em;text-transform:uppercase">Personal Banking</div>
  <div style="color:#a5b4fc;font-size:.75rem;margin:.35rem 0 .75rem;line-height:1.55;opacity:.8">Broadest audience · FINTRAC/AML · PCI-DSS · Transaction intelligence</div>
  <div style="display:flex;gap:.3rem;flex-wrap:wrap">
    <span style="background:rgba(165,180,252,.12);color:#a5b4fc;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(165,180,252,.25)">Core Banking</span>
    <span style="background:rgba(165,180,252,.12);color:#a5b4fc;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(165,180,252,.25)">Transactions</span>
    <span style="background:rgba(165,180,252,.12);color:#a5b4fc;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(165,180,252,.25)">Open Banking APIs</span>
    <span style="background:rgba(165,180,252,.12);color:#a5b4fc;font-size:.64rem;font-weight:600;padding:.2rem .45rem;border-radius:4px;border:1px solid rgba(165,180,252,.25)">CRA Data</span>
  </div>
  <div style="margin-top:.85rem;padding-top:.75rem;border-top:1px solid rgba(165,180,252,.18);font-size:.7rem;color:#a5b4fc"><strong>Stakes:</strong> Consumer protection &nbsp;·&nbsp; <strong>Scale:</strong> 10M+ daily transactions</div>
</div>

</div>

## 1. The RAG Levels — Recap and Framing

| Level | Name | Core Mechanism | Accuracy Range | Primary Constraint |
|---|---|---|---|---|
| L1 | Vanilla RAG | Dense vector → top-k → prompt | 70–80% | Single retrieval pass, semantic drift |
| L2 | Hybrid RAG | Dense (semantic) + Sparse (BM25) → rerank → prompt | 82–90% | Static retrieval, no multi-document synthesis |
| L3 | GraphRAG | Vector + structured knowledge graph + ontology traversal | 92–99% | Ontology investment, relationship modeling |
| L4 | Agentic RAG | Retrieve → reflect → re-query loop → multi-hop synthesis | 95–99%+ | Latency, cost, loop-control complexity |

*In plain terms: L1 guesses, L2 narrows, L3 reasons, L4 debates with itself until it's confident. Pick your complexity based on what the problem actually needs — not what the architecture diagram looks coolest.*

**A note on the retrieval assumption**: All four levels above assume that retrieval works by *similarity* — embed the query, embed document chunks, find the nearest vectors. This is the right default for corpus-level search across thousands of documents. But for structured professional documents (financial filings, clinical guidelines, legal agreements, regulatory disclosures), there is an emerging alternative: reasoning-based retrieval, where the LLM navigates a document's structure directly instead of searching a vector space. Section 6.4 introduces this paradigm, and Section 10 applies it across all four domains.

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin:1.5rem 0;font-family:Inter,sans-serif">

<div style="background:#1e293b;border:1px solid #475569;border-radius:12px;padding:1.2rem;border-top:4px solid #64748b">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.7rem">
    <span style="background:#334155;color:#94a3b8;font-size:.68rem;font-weight:700;padding:.2rem .6rem;border-radius:6px;letter-spacing:.08em">L1</span>
    <span style="color:#e2e8f0;font-weight:700;font-size:.95rem">Vanilla RAG</span>
  </div>
  <div style="margin-bottom:.7rem">
    <div style="display:flex;justify-content:space-between;font-size:.72rem;color:#94a3b8;margin-bottom:.28rem"><span>Accuracy</span><span style="color:#f1f5f9;font-weight:700">70–80%</span></div>
    <div style="background:#0f172a;border-radius:99px;height:5px;overflow:hidden"><div style="background:linear-gradient(90deg,#475569,#64748b);width:75%;height:5px"></div></div>
  </div>
  <div style="font-size:.78rem;color:#94a3b8;line-height:1.5;margin-bottom:.6rem">Dense vector search → top-k → LLM prompt</div>
  <div style="font-size:.7rem;color:#64748b;background:#0f172a;padding:.35rem .6rem;border-radius:6px">⚠ Single pass · semantic drift risk</div>
</div>

<div style="background:#1e293b;border:1px solid #1d4ed8;border-radius:12px;padding:1.2rem;border-top:4px solid #3b82f6">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.7rem">
    <span style="background:#1e3a5f;color:#60a5fa;font-size:.68rem;font-weight:700;padding:.2rem .6rem;border-radius:6px;letter-spacing:.08em">L2</span>
    <span style="color:#e2e8f0;font-weight:700;font-size:.95rem">Hybrid RAG</span>
  </div>
  <div style="margin-bottom:.7rem">
    <div style="display:flex;justify-content:space-between;font-size:.72rem;color:#94a3b8;margin-bottom:.28rem"><span>Accuracy</span><span style="color:#f1f5f9;font-weight:700">82–90%</span></div>
    <div style="background:#0f172a;border-radius:99px;height:5px;overflow:hidden"><div style="background:linear-gradient(90deg,#1d4ed8,#3b82f6);width:86%;height:5px"></div></div>
  </div>
  <div style="font-size:.78rem;color:#94a3b8;line-height:1.5;margin-bottom:.6rem">Dense + BM25 → RRF fusion → reranker → LLM</div>
  <div style="font-size:.7rem;color:#60a5fa;background:#0f172a;padding:.35rem .6rem;border-radius:6px">✦ Exact + semantic · static retrieval</div>
</div>

<div style="background:#1e293b;border:1px solid #6d28d9;border-radius:12px;padding:1.2rem;border-top:4px solid #8b5cf6">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.7rem">
    <span style="background:#2e1065;color:#a78bfa;font-size:.68rem;font-weight:700;padding:.2rem .6rem;border-radius:6px;letter-spacing:.08em">L3</span>
    <span style="color:#e2e8f0;font-weight:700;font-size:.95rem">GraphRAG</span>
  </div>
  <div style="margin-bottom:.7rem">
    <div style="display:flex;justify-content:space-between;font-size:.72rem;color:#94a3b8;margin-bottom:.28rem"><span>Accuracy</span><span style="color:#f1f5f9;font-weight:700">92–99%</span></div>
    <div style="background:#0f172a;border-radius:99px;height:5px;overflow:hidden"><div style="background:linear-gradient(90deg,#6d28d9,#8b5cf6);width:95%;height:5px"></div></div>
  </div>
  <div style="font-size:.78rem;color:#94a3b8;line-height:1.5;margin-bottom:.6rem">Vector + knowledge graph + ontology traversal</div>
  <div style="font-size:.7rem;color:#a78bfa;background:#0f172a;padding:.35rem .6rem;border-radius:6px">◈ Multi-hop · ontology investment required</div>
</div>

<div style="background:#1e293b;border:1px solid #b45309;border-radius:12px;padding:1.2rem;border-top:4px solid #f59e0b">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.7rem">
    <span style="background:#451a03;color:#fbbf24;font-size:.68rem;font-weight:700;padding:.2rem .6rem;border-radius:6px;letter-spacing:.08em">L4</span>
    <span style="color:#e2e8f0;font-weight:700;font-size:.95rem">Agentic RAG</span>
  </div>
  <div style="margin-bottom:.7rem">
    <div style="display:flex;justify-content:space-between;font-size:.72rem;color:#94a3b8;margin-bottom:.28rem"><span>Accuracy</span><span style="color:#f1f5f9;font-weight:700">95–99%+</span></div>
    <div style="background:#0f172a;border-radius:99px;height:5px;overflow:hidden"><div style="background:linear-gradient(90deg,#b45309,#f59e0b);width:97%;height:5px"></div></div>
  </div>
  <div style="font-size:.78rem;color:#94a3b8;line-height:1.5;margin-bottom:.6rem">Retrieve → reflect → re-query → synthesis loop</div>
  <div style="font-size:.7rem;color:#fbbf24;background:#0f172a;padding:.35rem .6rem;border-radius:6px">⚡ Highest accuracy · 5–30s latency cost</div>
</div>

</div>

**Architectural framing**: The levels are not milestones to progress through linearly — they are *tools*. A production system at a bank might use L1 for FAQ deflection, L2 for product search, L3 for compliance checks, and L4 for portfolio incident analysis. The architectural decision is: *which level of retrieval sophistication does this specific problem require, and can the organization afford the ontology and latency cost of higher levels?*

<div id="rag26arch" style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:1.5rem;margin:1.5rem 0;font-family:Inter,sans-serif">
  <div style="font-size:.72rem;color:#64748b;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:.8rem">Retrieval Architecture — Select a Level</div>
  <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.3rem">
    <button id="rag26arch-bl1" onclick="rag26archShow('l1')" style="cursor:pointer;font-family:Inter,sans-serif;background:#334155;color:#e2e8f0;border:2px solid #64748b;border-radius:8px;padding:.4rem 1rem;font-size:.8rem;font-weight:700">L1 Vanilla</button>
    <button id="rag26arch-bl2" onclick="rag26archShow('l2')" style="cursor:pointer;font-family:Inter,sans-serif;background:#0f172a;color:#64748b;border:2px solid #334155;border-radius:8px;padding:.4rem 1rem;font-size:.8rem;font-weight:700">L2 Hybrid</button>
    <button id="rag26arch-bl3" onclick="rag26archShow('l3')" style="cursor:pointer;font-family:Inter,sans-serif;background:#0f172a;color:#64748b;border:2px solid #334155;border-radius:8px;padding:.4rem 1rem;font-size:.8rem;font-weight:700">L3 GraphRAG</button>
    <button id="rag26arch-bl4" onclick="rag26archShow('l4')" style="cursor:pointer;font-family:Inter,sans-serif;background:#0f172a;color:#64748b;border:2px solid #334155;border-radius:8px;padding:.4rem 1rem;font-size:.8rem;font-weight:700">L4 Agentic</button>
  </div>
  <div id="rag26arch-l1">
    <div style="display:flex;align-items:flex-start;flex-wrap:wrap;gap:.4rem;margin-bottom:1rem">
      <div style="text-align:center"><div style="background:#1e293b;border:1px solid #475569;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#e2e8f0;font-weight:600;white-space:nowrap"><div style="color:#64748b;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Input</div>User Query</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#60a5fa;font-weight:600;white-space:nowrap"><div style="color:#1d4ed8;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Encode</div>Embedding Model</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#60a5fa;font-weight:600;white-space:nowrap"><div style="color:#1d4ed8;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Search</div>Vector DB cosine</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#1e293b;border:1px solid #475569;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#94a3b8;font-weight:600;white-space:nowrap"><div style="color:#64748b;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Retrieve</div>Top-K Chunks</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#2e1065;border:1px solid #6d28d9;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#a78bfa;font-weight:600;white-space:nowrap"><div style="color:#6d28d9;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Generate</div>LLM Prompt</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#14532d;border:1px solid #166534;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#86efac;font-weight:600;white-space:nowrap"><div style="color:#166534;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Output</div>Response</div></div>
    </div>
    <div style="background:#1e293b;border-radius:8px;padding:.8rem 1rem;font-size:.78rem;color:#94a3b8;line-height:1.6"><strong style="color:#64748b">Constraint:</strong> Single retrieval pass. No feedback loop. If the answer spans multiple documents or requires reasoning across facts, this pipeline fails silently — the LLM hallucinates a plausible but wrong answer.</div>
  </div>
  <div id="rag26arch-l2" style="display:none">
    <div style="display:flex;align-items:flex-start;flex-wrap:wrap;gap:.4rem;margin-bottom:1rem">
      <div style="text-align:center"><div style="background:#1e293b;border:1px solid #475569;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#e2e8f0;font-weight:600;white-space:nowrap"><div style="color:#64748b;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Input</div>User Query</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#60a5fa;font-weight:600"><div style="color:#1d4ed8;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Dual Encode</div>Dense + BM25</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#60a5fa;font-weight:600;white-space:nowrap"><div style="color:#1d4ed8;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Merge</div>RRF Fusion</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#451a03;border:1px solid #b45309;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#fbbf24;font-weight:600;white-space:nowrap"><div style="color:#b45309;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Rerank</div>Cross-Encoder</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#2e1065;border:1px solid #6d28d9;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#a78bfa;font-weight:600;white-space:nowrap"><div style="color:#6d28d9;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Generate</div>LLM Prompt</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#14532d;border:1px solid #166534;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#86efac;font-weight:600;white-space:nowrap"><div style="color:#166534;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Output</div>Response</div></div>
    </div>
    <div style="background:#1e293b;border-radius:8px;padding:.8rem 1rem;font-size:.78rem;color:#94a3b8;line-height:1.6"><strong style="color:#60a5fa">Key advantage:</strong> BM25 enforces exact match on identifiers (IATA codes, drug names, tickers). RRF merges both rankings without tuning weights. Cross-encoder reranker adds 10–15% precision over bi-encoder alone. Still one retrieval pass — no synthesis across documents.</div>
  </div>
  <div id="rag26arch-l3" style="display:none">
    <div style="display:flex;align-items:flex-start;flex-wrap:wrap;gap:.4rem;margin-bottom:1rem">
      <div style="text-align:center"><div style="background:#1e293b;border:1px solid #475569;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#e2e8f0;font-weight:600;white-space:nowrap"><div style="color:#64748b;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Input</div>User Query</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#60a5fa;font-weight:600;white-space:nowrap"><div style="color:#1d4ed8;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Parallel</div>Vector + Graph</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#2e1065;border:1px solid #6d28d9;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#a78bfa;font-weight:600;white-space:nowrap"><div style="color:#6d28d9;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Traverse</div>Ontology Edges</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#2e1065;border:1px solid #6d28d9;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#a78bfa;font-weight:600;white-space:nowrap"><div style="color:#6d28d9;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Assemble</div>Multi-hop Results</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#2e1065;border:1px solid #6d28d9;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#a78bfa;font-weight:600;white-space:nowrap"><div style="color:#6d28d9;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Generate</div>LLM Synthesis</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#14532d;border:1px solid #166534;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#86efac;font-weight:600;white-space:nowrap"><div style="color:#166534;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Output</div>Response</div></div>
    </div>
    <div style="background:#1e293b;border-radius:8px;padding:.8rem 1rem;font-size:.78rem;color:#94a3b8;line-height:1.6"><strong style="color:#a78bfa">Key advantage:</strong> Graph traversal constructs facts that don't exist in any single document. "Canadian passport + Vietnam + Cambodia + Thailand + 14 days" = constructed from 3 visa rules + route feasibility + border crossing data. Ontology investment is the prerequisite — this is a data modeling problem, not a model problem.</div>
  </div>
  <div id="rag26arch-l4" style="display:none">
    <div style="display:flex;align-items:flex-start;flex-wrap:wrap;gap:.4rem;margin-bottom:1rem">
      <div style="text-align:center"><div style="background:#1e293b;border:1px solid #475569;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#e2e8f0;font-weight:600;white-space:nowrap"><div style="color:#64748b;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Input</div>Complex Query</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#60a5fa;font-weight:600;white-space:nowrap"><div style="color:#1d4ed8;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Step 1</div>Initial Retrieve</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#451a03;border:1px solid #b45309;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#fbbf24;font-weight:600;white-space:nowrap"><div style="color:#b45309;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Reflect</div>LLM: Sufficient?</div></div>
      <div style="color:#fbbf24;font-size:.9rem;padding-top:.55rem;font-weight:700">↺</div>
      <div style="text-align:center"><div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#60a5fa;font-weight:600;white-space:nowrap"><div style="color:#1d4ed8;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Re-query</div>Targeted Fetch</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#2e1065;border:1px solid #6d28d9;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#a78bfa;font-weight:600;white-space:nowrap"><div style="color:#6d28d9;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Synthesize</div>Multi-hop LLM</div></div>
      <div style="color:#475569;font-size:1.2rem;padding-top:.55rem">→</div>
      <div style="text-align:center"><div style="background:#14532d;border:1px solid #166534;border-radius:8px;padding:.55rem .8rem;font-size:.75rem;color:#86efac;font-weight:600;white-space:nowrap"><div style="color:#166534;font-size:.6rem;margin-bottom:.15rem;text-transform:uppercase">Output</div>Response</div></div>
    </div>
    <div style="background:#1e293b;border-radius:8px;padding:.8rem 1rem;font-size:.78rem;color:#94a3b8;line-height:1.6"><strong style="color:#fbbf24">Key advantage:</strong> The ↺ reflection loop is the defining feature. The agent asks "do I have enough?" after each retrieval turn, re-queries with a refined sub-question, and synthesizes across all turns. <strong style="color:#fca5a5">Key cost:</strong> 5–30s latency per query, token cost multiplies with loop depth, and loop termination logic is the hardest engineering problem.</div>
  </div>
</div>
<script>
function rag26archShow(level) {
  var configs = {
    l1: { bg: '#334155', color: '#e2e8f0', border: '#64748b' },
    l2: { bg: '#1e3a5f', color: '#60a5fa', border: '#3b82f6' },
    l3: { bg: '#2e1065', color: '#a78bfa', border: '#8b5cf6' },
    l4: { bg: '#451a03', color: '#fbbf24', border: '#f59e0b' }
  };
  ['l1','l2','l3','l4'].forEach(function(l) {
    var el = document.getElementById('rag26arch-' + l);
    var btn = document.getElementById('rag26arch-b' + l);
    if (l === level) {
      el.style.display = 'block';
      btn.style.background = configs[l].bg;
      btn.style.color = configs[l].color;
      btn.style.borderColor = configs[l].border;
    } else {
      el.style.display = 'none';
      btn.style.background = '#0f172a';
      btn.style.color = '#64748b';
      btn.style.borderColor = '#334155';
    }
  });
}
rag26archShow('l1');
</script>

---

## Decision Framework — Which Level for Which Problem?

Use this framework when designing a RAG system for any enterprise problem:

```
Question: Does the answer exist in a single document?
  YES → L1 is sufficient
  NO  → continue

Question: Does the query contain exact identifiers (codes, tickers, drug names, amounts)?
  YES → L2 minimum (hybrid required)
  NO  → L1 may suffice if purely semantic

Question: Does the answer require reasoning across multiple facts in relationship to each other?
  YES → L3 (GraphRAG) if relationships are pre-definable
  NO  → L2 sufficient

Question: Is the relationship structure pre-known and consistent?
  YES → L3 (invest in ontology)
  NO  → L4 (let the agent discover the retrieval path)

Question: Does answering require iterative refinement — "I need more context before I can answer"?
  YES → L4 (agentic loop)
  NO  → L3 sufficient

Question: Is the latency tolerance under 2 seconds AND context per turn under 4,000 tokens?
  YES → L1 or L2 with any backend
  NO  → Evaluate Mamba-backed L3/L4 before concluding infeasible
        (Mamba's 5× throughput + constant memory enables 3-5s L4 responses
         in configurations where Transformers require 15-20s due to KV cache pressure)

Question: Does answering require ingesting a document longer than 8,000 tokens in a single pass?
  (examples: full offering memorandum, complete EHR summary, full insurance policy)
  YES → Consider Mamba-based backend; chunk + average with Transformer will lose coherence
  NO  → Standard Transformer backend sufficient

Question: Is the answer in a specific known document with logical section structure?
  (examples: SEC filing, clinical guideline, fare manual, mortgage agreement)
  YES → Consider reasoning-based retrieval (PageIndex) instead of or alongside vector search
        — eliminates chunking artifacts, follows cross-references, provides audit trail
  NO  → Vector/hybrid retrieval is the right mechanism

Question: Is accuracy life-critical or regulatory-binding?
  YES → L3 minimum; L4 with human-in-the-loop for final decision
  NO  → L1/L2 with appropriate hedging
```

### Decision Matrix by Domain and Use Case

| Use Case | Domain | Recommended Level | Rationale |
|---|---|---|---|
| Policy FAQ | All | L1 | Single doc, static knowledge |
| Exact identifier lookup | Travel, Finance, Banking | L2 | BM25 required |
| Destination semantic search | Travel | L2 | Semantic + keyword fusion |
| Clinical protocol lookup | Healthcare | L2 | Exact drug/code matching critical |
| Drug interaction checking | Healthcare | L2–L3 | Exact names + relationship graph |
| Differential diagnosis | Healthcare | L3 | Multi-symptom → multi-condition reasoning |
| Visa route eligibility | Travel | L3 | Multi-hop nationality + route + transit rules |
| Visa regulation navigation | Travel | L2 + PageIndex | Known document, cross-referenced sections, conditional logic |
| Fare rules interpretation | Travel | PageIndex | Precise conditional logic in long fare manuals |
| Itinerary planning | Travel | L3–L4 | Constraint satisfaction + multi-source |
| Suitability assessment | Wealth | L3 | Regulatory rules as graph edges |
| SEC filing analysis | Wealth | L2 + PageIndex | Known document, cross-referenced notes, precise table extraction |
| IPS compliance check | Wealth | L3 + PageIndex | Portfolio state vs. constraint graph + IPS document navigation |
| Proactive portfolio review | Wealth | L4 | Multi-client × multi-event synthesis |
| Clinical guideline navigation | Healthcare | PageIndex | Multi-constraint lookup across sections of a known guideline |
| Cash flow diagnosis | Banking | L4 | Multi-hop transaction + income + product |
| Benefits guide navigation | Banking | PageIndex | Known document, cross-referenced coverage sections |
| Mortgage prepayment analysis | Banking | PageIndex | Known document, conditional penalty calculations |
| Sepsis warning | Healthcare | L4 | Multi-source patient data temporal synthesis |
| Incident post-mortem (network) | Infra/Ops | L4 | "Which Q3 changes contributed to today's incident?" |

---

## What's Next in This Series

This post is the map. The rest of the series is the territory.

| Part | Post | Topic |
|---|---|---|
| 1 | *You are here* | The Four RAG Levels — Decision Framework |
| 2 | [RAG in Travel & Tourism Systems](/blog/posts/2026-03-27-rag-travel-tourism-systems/) | GDS, visa routing, itinerary planning |
| 3 | [RAG in Hospital Management](/blog/posts/2026-03-28-rag-hospital-management-systems/) | Zero hallucination tolerance, clinical precision |
| 4 | [RAG in Wealth Management](/blog/posts/2026-03-29-rag-wealth-management-systems/) | Fiduciary constraints, suitability, MiFID II |
| 5 | [RAG in Personal Banking](/blog/posts/2026-03-30-rag-personal-banking-systems/) | Scale, AML, transaction intelligence |
| 6 | [The RAG Supporting Stack](/blog/posts/2026-03-31-rag-supporting-stack-memory-embeddings/) | Memory, prompt engineering, fine-tuning, embeddings |
| 7 | [Mamba and SSMs for RAG](/blog/posts/2026-04-01-mamba-ssm-rag-generation-backbone/) | What the generation backbone change means |
| 8 | [PageIndex and Vectorless RAG](/blog/posts/2026-04-02-pageindex-vectorless-rag-structured-documents/) | Reasoning-based retrieval for professional documents |
