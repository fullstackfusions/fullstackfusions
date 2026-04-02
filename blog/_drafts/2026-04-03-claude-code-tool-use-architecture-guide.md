---
title: "Claude Code — Tool Use Architecture, Context Management, and the Extensibility Model"
date: 2026-04-03
description: "A systems-level overview of how Claude Code works — the tool use mechanism that makes it genuinely useful, context management strategies, custom commands, MCP server integration, hooks for automated feedback loops, and the programmatic SDK."
tags: ["ai", "llm", "claude", "developer-tools", "automation", "architecture"]
---

*A practical deep-dive into Claude Code for engineers who want to understand the mechanism, not just the interface. This covers the full stack: tool use architecture, context control, extensibility via MCP servers, automated feedback loops with hooks, and the SDK integration pattern.*

---

## Why Coding Assistants Are a Tool Use Problem

The core constraint of any language model is simple: it only processes text input and produces text output. It cannot read a file, run a terminal command, or query an API on its own. Yet a coding assistant that can't read files is barely useful.

The solution is **tool use** — a communication protocol between the model and the host system:

```
User task arrives
  → System appends tool definitions to the request
  → LLM reasons about which tool to call and with what parameters
  → System executes the tool (reads file, runs command, etc.)
  → Result is returned to the LLM as context
  → LLM produces the final response or calls another tool
```

This loop is not a Claude-specific trick — every capable coding assistant uses it. What Claude brings is measurably better tool use *quality*: choosing the right tool, chaining tools correctly across multi-step tasks, and avoiding spurious tool calls that waste context tokens. Those properties compound. A small improvement in per-call tool selection accuracy produces a large improvement in complex multi-step task completion.

One often-overlooked advantage: Claude Code performs **direct code search** in your local environment rather than indexing the codebase and shipping it to an external server. For teams with proprietary code or compliance requirements, that distinction matters.

---

## What Claude Code Does

Claude Code ships with a default tool set: file reading and writing, command execution, grep, directory traversal. That default set covers the 80% case. The remainder of this post is about the 20% — the mechanisms that separate a well-configured Claude Code setup from a generic one.

Two concrete benchmarks to calibrate scope:

**Performance optimization**: Claude analyzed the Chalk JavaScript library (the 5th most downloaded JS package, ~429M weekly downloads), used profiling tools, identified bottlenecks, created a structured task plan, and implemented fixes. Result: **3.9× throughput improvement**. That's not chat — it's an autonomous multi-step engineering workflow.

**Data analysis**: Claude performed a churn analysis on a video streaming platform dataset (CSV), using a Jupyter notebook end-to-end. It executed code cells iteratively, read the outputs, then adapted subsequent analysis steps based on what it found — accumulating findings across cells the way a human analyst would across a working session.

---

## Context Management — The Critical Variable

Context quality determines output quality, more than almost any other configuration choice. Too little context and Claude misunderstands the codebase. Too much irrelevant context and accuracy degrades. The signal-to-noise ratio of what goes into the context window is the primary lever.

**The fundamental constraint**: Claude's context window holds your entire conversation — every message, every file it reads, every command output. A single debugging session or codebase exploration can consume tens of thousands of tokens. LLM performance degrades as the context window fills: Claude may start "forgetting" earlier instructions, lose track of constraints, or produce more mistakes. Managing context is not housekeeping — it's the core performance variable.

### CLAUDE.md — Persistent Project Context

The `/init` command analyzes the entire codebase on first run and generates a `CLAUDE.md` file: a compact summary of project architecture, key files, and conventions. Its contents are included in every subsequent request automatically.

Three scopes for `CLAUDE.md`:

| Scope | Location | Committed to source control? | Use case |
|---|---|---|---|
| Project-level | `./CLAUDE.md` | Yes | Shared team conventions, architecture overview, key file references |
| Local-level | `./.claude/CLAUDE.md` | No | Personal workflow preferences, personal tool shortcuts |
| Machine-level | `~/.claude/CLAUDE.md` | No | Global instructions applied to all projects |

**Best practice**: reference critical files — database schemas, API contracts, core type definitions — in the project-level `CLAUDE.md` so they are always available as context. Claude doesn't have to search for them on every request.

**Memory mode**: Use the `#` symbol shortcut inside Claude Code to edit any of the three `CLAUDE.md` files via natural language rather than opening them manually. Useful immediately after catching a recurring mistake — stop Claude with Escape, use `#` to record the correction, and it applies from that point forward.

### @ References — Targeted Context Injection

The `@filename` syntax injects a specific file into the current request. This is more efficient than letting Claude search speculatively when you already know which file is relevant.

```
# Instead of this (forces Claude to search)
"Update the authentication logic"

# Prefer this (targeted context)
"@src/auth/middleware.ts — update the JWT validation to check the 'aud' claim"
```

The principle: provide just enough relevant information for the task. Every token of irrelevant context is a token that could have been used for reasoning.

---

## Operating Modes — Plan, Thinking, and Auto

Three distinct operating modes address three distinct classes of task. Mixing them up — using Auto when you need a plan, or using Plan when you should just execute — is one of the most common sources of wasted cycles.

### The Full Mode Spectrum

Claude Code has six permission modes, selectable via `Shift+Tab` during a session or `--permission-mode <mode>` at startup:

| Mode | What Claude can do | When to use |
|---|---|---|
| `default` | Read files; prompts before every edit or shell command | Getting started, sensitive work, maximum oversight |
| `acceptEdits` | Read and edit files without prompting; prompts for shell commands | Iterating on code you're actively reviewing turn-by-turn |
| `plan` | Read files and run shell commands to explore — **no source edits** | Exploring a codebase, planning a complex refactor before touching anything |
| `auto` | All actions, with a background classifier replacing permission prompts | Long-running tasks, batch operations, reducing prompt fatigue |
| `bypassPermissions` | All actions, no checks whatsoever | Isolated containers and VMs only — never on a production host |
| `dontAsk` | Only pre-approved tools from your allow-list | Locked-down CI environments |

---

### Plan Mode — Read-Only Exploration and Proposal

**How to activate**: `Shift+Tab` to cycle through to `plan`, or `claude --permission-mode plan` at startup, or prefix any single request with `/plan`.

In Plan Mode, Claude **cannot edit source files**. It reads files, runs read-only shell commands to explore, asks clarifying questions via `AskUserQuestion`, and produces a written plan. That's the constraint and the point — you get Claude's full analytical capability applied to understanding your codebase without any risk of premature changes.

**The recommended four-phase workflow for non-trivial tasks:**

```
Phase 1 — Explore (Plan Mode)
  claude --permission-mode plan
  "Read src/auth/ and understand how sessions and login are handled.
   Also check how environment variables for secrets are managed."

Phase 2 — Plan (Plan Mode)
  "I want to add Google OAuth. What files need to change?
   What's the session flow? Write a detailed plan."

  → Press Ctrl+G to open the plan in your editor and edit it directly before Claude proceeds.

Phase 3 — Implement (Normal or acceptEdits Mode)
  "Implement the OAuth flow from your plan. Write tests for the
   callback handler, run the test suite and fix any failures."

Phase 4 — Commit
  "Commit with a descriptive message and open a PR."
```

When Claude finishes a plan, it presents it and asks how to proceed. Options: approve and continue in auto mode, approve with acceptEdits (you review each edit), approve with manual review per change, or keep refining the plan.

**Use Plan Mode when:**
- A feature touches many files and you're not sure what the impact surface is
- You're unfamiliar with the code being modified
- You want to iterate on the *approach* with Claude before any files change
- Correctness or reversibility matters — healthcare, financial systems, auth flows

**Skip Plan Mode when:**
- The task scope is clear and small (fixing a typo, renaming a variable, adding a log line)
- You can describe the intended diff in one sentence
- You're in an exploratory mode and comfortable course-correcting mid-execution

---

### Extended Thinking — Depth Reasoning

**How to activate**: Extended thinking is **on by default**. The `ultrathink` keyword in your prompt sets effort to *high* for that turn. Use `/effort` or `/model` to adjust the default effort level. Toggle thinking on/off for the session with `Option+T` (macOS) / `Alt+T` (Windows/Linux). View Claude's internal reasoning with `Ctrl+O` (displays as gray italic text in verbose mode).

Extended thinking allocates a reasoning token budget for Claude to work through a problem step-by-step before producing a response. On newer models (Sonnet 4.6, Opus 4.6), this is *adaptive* — the model dynamically allocates thinking tokens based on your effort level rather than a fixed budget.

**Important**: Phrases like "think", "think hard", or "think more" are treated as ordinary prompt instructions. Only `ultrathink` triggers the high-effort allocation on supported models.

**Use extended thinking when:**
- Evaluating architectural tradeoffs with non-obvious consequences
- Debugging a complex or intermittent issue where the root cause requires multi-step reasoning
- Designing a data model or API contract that will be hard to change later
- Working through an algorithm with subtle correctness requirements (concurrency, edge cases, invariants)
- Any problem where a fast answer is likely to be wrong

**Skip extended thinking (or lower the effort level) when:**
- Making routine changes where the path is clear
- Running Claude in a tight feedback loop where latency matters
- Running non-interactive `-p` pipelines where the task is well-defined

Cost note: thinking tokens are billed the same as output tokens. On Claude 4 models the thinking is summarized in the response, but you are charged for all tokens used.

**Combining Plan Mode and extended thinking**: You can use them together. Plan Mode maps the impact surface (breadth); extended thinking handles the correctness reasoning within each part (depth). Token cost is additive — combine only when the task genuinely has both dimensions.

---

### Auto Mode — Agentic Execution with Background Safety

**How to activate**: `claude --enable-auto-mode` at startup (required flag to make it appear in the `Shift+Tab` cycle), then cycle to it. Requires Sonnet 4.6 or Opus 4.6, and a Team/Enterprise/API plan.

Auto mode removes permission prompts and replaces them with a **background classifier model** that evaluates each action before it executes. You don't click through approval dialogs — the classifier does it, with a different threat model:

```
Default mode:  You review each action  →  You are the safety check
Auto mode:     Classifier reviews each action  →  Classifier is the safety check + you review outcomes
```

**What the classifier blocks by default:**
- Downloading and executing code: `curl | bash`, scripts from freshly-cloned repos
- Sending data to external endpoints that aren't matched by your env config
- Production deploys and database migrations
- Mass deletion on cloud storage
- Granting IAM or repository permissions
- Modifying shared infrastructure
- Force pushing or pushing directly to `main`

**What the classifier allows by default:**
- Local file operations in your working directory
- Installing dependencies already declared in lock files or manifests
- Reading `.env` and sending credentials to their matching API
- Read-only HTTP requests
- Pushing to the branch you started on, or one Claude created

**Use Auto Mode when:**
- Running a long-horizon task where reviewing every shell command is overhead, not oversight — e.g., migrating 200 files from one pattern to another
- Batch operations via `claude -p` in scripts or CI where you've already reviewed the intent
- The task is well-scoped and you trust the general direction, not every individual step
- You're in a feedback loop where prompt fatigue is making you rubber-stamp approvals anyway

**Do not use Auto Mode when:**
- The task involves production infrastructure, database migrations, or IAM changes
- You're working in a shared environment where mistakes have blast radius
- You haven't read what the task will do — Auto Mode reduces interruptions, not responsibility
- A classifier false-positive could abort a critical pipeline (it falls back to manual prompting after 3 consecutive blocks or 20 total blocks in a session)

**Auto mode in agentic loops**: When Claude spawns subagents, the classifier evaluates the delegated task at spawn time *and* reviews the full action history when the subagent returns. A subagent that was benign at spawn could have been steered mid-run by content it read — that return check is the defense against that class of prompt injection.

---

### Decision Framework

```
What kind of task is this?

Unfamiliar codebase / many files affected / want to iterate on approach before changing anything
  → Plan Mode
  → Use /plan or --permission-mode plan
  → Ctrl+G to edit the plan before approving

Well-defined scope, need deep correctness reasoning before or during implementation
  → Extended Thinking (ultrathink keyword, or raise /effort)
  → Ctrl+O to view the reasoning trace

Long-running, well-scoped, low-sensitivity task where prompt fatigue is the bottleneck
  → Auto Mode
  → --enable-auto-mode, then Shift+Tab to cycle to it

Small-scope, clear task, fast execution needed
  → Default or acceptEdits mode
  → No special mode needed

Isolated container / VM, no damage possible, scripted pipeline
  → bypassPermissions mode
  → Never on production or shared hosts
```

---

### Git Integration

Claude Code can stage changes, write descriptive commit messages, and commit — closing the loop from code change to version control without leaving the session. Useful as the final step of an Auto Mode workflow or a custom command that produces a well-scoped set of changes.

### Screenshot Integration

Paste screenshots directly into the request (Control-V on macOS, not Command-V). Useful for UI bugs, layout issues, or error dialogs — Claude can reason about visual state that would be tedious to describe in text.

---

## Controlling Context in Long Sessions

Long conversations accumulate noise. Stale debugging exchanges, abandoned approaches, and resolved errors all consume context that could be used for the current task. Four controls:

| Control | What it does | When to use |
|---|---|---|
| **Escape** | Stops Claude mid-response | Redirect when Claude heads in the wrong direction |
| **Escape + Memory** | Stop + write a `#` memory note | After a repeated mistake — encode the correction so it doesn't recur |
| **Double Escape** | Rewinds to a previous message | Skip irrelevant back-and-forth; jump back to the last good state |
| **Compact** | Summarizes conversation history, preserves learned context | Claude has gained expertise on the task but the conversation is cluttered |
| **Clear** | Deletes entire conversation history | Switching to an unrelated task |

The sharp one is **Compact** — it retains Claude's understanding of what it has learned about your codebase and task, without carrying forward the noisy exploration that produced that understanding.

**Scoped compaction**: `/compact Focus on the API changes` — the argument tells Claude what to prioritize when summarizing. Use this to ensure critical context (modified files, key decisions, active constraints) survives the compaction rather than getting averaged out.

**Rule of thumb**: if you've corrected Claude more than twice on the same issue in one session, the context is polluted with failed approaches. `/clear` and restart with a better-specified prompt that incorporates what you learned from the failures. A clean session with a sharper prompt almost always outperforms a long session with accumulated corrections.

---

## Custom Commands — Automating Repetitive Workflows

Claude Code supports user-defined slash commands.

**Setup**:
```
.claude/
  commands/
    audit.md        → /audit
    gen-tests.md    → /gen-tests
    fix-vulns.md    → /fix-vulns
```

Each `.md` file contains the instructions Claude should follow when the command is invoked. Commands support arguments via the `$arguments` placeholder:

```markdown
<!-- .claude/commands/gen-tests.md -->
Generate comprehensive unit tests for the file at $arguments.
Cover:
- Happy path
- Edge cases (null, empty, boundary values)
- Error conditions
- Any async timing issues

Use the existing test framework and naming conventions in the project.
```

Invoked as:
```
/gen-tests src/payments/processor.ts
```

The argument is passed as the `$arguments` string. Commands must be created before starting Claude; restart is required to pick them up.

---

## MCP Servers — Extending the Tool Set

The default tool set is not the ceiling. Claude Code accepts additional **MCP (Model Context Protocol) servers** — external services that expose new tools.

```bash
# Add a Playwright server for browser automation
claude mcp add playwright npx @playwright/mcp-server
```

Once added, Claude can control a real browser: navigate pages, take screenshots, interact with UI elements. This closes the loop between code changes and their visual output without a human in the middle.

**Practical workflow example**:
1. Claude writes a new UI component
2. Claude opens the dev server in a controlled browser via Playwright
3. Claude takes a screenshot, analyzes the rendered result
4. Claude updates the component based on what it sees
5. Claude iterates until the visual output matches intent

That's the kind of automated feedback loop that takes meaningful developer time to run manually.

**Concrete example — prompt-driven styling iteration**: Claude is given a landing page hero section and asked to improve the visual design. Without Playwright, it reads CSS and Tailwind class names and makes text-based guesses. With Playwright, it sees the rendered output — and the results are qualitatively different. Instead of defaulting to generic purple-to-blue gradients and stock Tailwind patterns, Claude's iterations move toward:

- Warm sunset gradients (`orange → pink → purple`)
- Ocean depth themes (`teal → emerald → cyan`)
- Asymmetric layouts with overlapping elements
- Non-uniform spacing that breaks the standard grid rhythm

The mechanism is simple: Claude evaluates whether a screenshot looks visually interesting before deciding what to change next. Every edit is grounded in rendered output rather than source inference. The feedback loop tightens from "update code, reload manually, assess" to "screenshot, reason, update, screenshot again" — all within a single session.

### Beyond Playwright — The MCP Ecosystem

Playwright is the most commonly cited example, but it's one data point in a larger ecosystem. MCP servers exist for most of the toolchain a development team already operates:

| Category | What it enables |
|---|---|
| **Database interactions** | Claude queries, inspects schemas, and runs migrations against live databases |
| **API testing and monitoring** | Claude sends requests, compares response contracts, checks for regressions |
| **File system operations** | Extended file access beyond the working directory — S3 buckets, remote mounts |
| **Cloud service integrations** | Claude reads CloudWatch logs, inspects infrastructure state, queries service health |
| **Development tool automation** | Claude opens Jira tickets, posts to Slack, triggers builds in CI |

The pattern is consistent across all of them: install the server, grant the tools, and Claude gains the ability to reason about and act on that system directly — not through copy-pasted output, but through live interaction.

The practical shift: Claude moves from a code assistant that answers questions about your codebase to a development partner that can interact with your entire toolchain in the same session that produced the code change.

### Permission Management

MCP server tools require individual permission grants. Add the server name to the `allow` array in `settings.local.json`:

```json
{
  "allow": ["MCP__playwright"]
}
```

---

## GitHub Integration — Claude in the CI Loop

Claude Code runs natively inside GitHub Actions, triggered by pull requests and issues. The integration installs Claude as an automated team member that can handle tasks, review code, and respond directly within the GitHub workflow.

### Setup

Run `/install-github-app` inside Claude Code. The command walks through three steps:

1. Install the Claude Code app on your GitHub account or organization
2. Add your API key
3. Claude opens a pull request that adds two workflow files to `.github/workflows/`

Merge the generated PR to activate both workflows.

### Default Workflows

| Workflow | Trigger | What Claude does |
|---|---|---|
| **Mention** | `@claude` in any issue or PR comment | Analyzes the request, creates a task plan, executes it with full codebase access, posts results |
| **PR Review** | New pull request opened | Reviews proposed changes, analyzes impact, posts a detailed report |

The PR review goes beyond syntax — it reasons about the full change in context. In one documented case, a developer added a user email field to a Lambda function's output. Claude, reviewing the PR, traced the Lambda's position in a Terraform-defined pipeline that shared data with an external partner and flagged the addition as a PII exposure. Static analysis tools don't cross that boundary.

### Customizing the Workflows

After merging the initial PR, the workflow files in `.github/workflows/` are yours to edit. Three customization points matter:

**1. Project setup steps** — run before Claude executes, so Claude finds the environment ready:

```yaml
- name: Project Setup
  run: |
    npm run setup
    npm run dev:daemon
```

**2. Custom instructions** — scoped context passed directly to Claude for that workflow, equivalent to an inline `CLAUDE.md`:

```yaml
custom_instructions: |
  The project is already set up with all dependencies installed.
  The server is running at localhost:3000. Logs are written to logs.txt.
  Query the database with the 'sqlite3' CLI if needed.
  Use the mcp__playwright tools to launch a browser and interact with the app.
```

**3. MCP server configuration** — give Claude additional capabilities inside the Action:

```yaml
mcp_config: |
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": [
          "@playwright/mcp@latest",
          "--allowed-origins",
          "localhost:3000;cdn.tailwindcss.com;esm.sh"
        ]
      }
    }
  }
```

### Tool Permissions in Actions

Unlike local sessions — where you can approve tools interactively or use broad allow rules — GitHub Actions requires **every tool to be explicitly listed**. No wildcards, no shortcut grants. This applies to both built-in tools and every tool exposed by each MCP server:

```yaml
allowed_tools: >-
  Bash(npm:*),
  Bash(sqlite3:*),
  mcp__playwright__browser_snapshot,
  mcp__playwright__browser_click,
  mcp__playwright__browser_navigate,
  mcp__playwright__browser_type
```

Each `mcp__<servername>__<toolname>` entry must be listed individually. If a tool isn't in the list, Claude cannot call it — the action fails silently from Claude's perspective rather than prompting for approval.

**MCP-augmented PR review**: combining project setup + Playwright MCP turns a code-only review into a code + behavior review. Claude spins up the dev server, navigates the running app in a controlled browser, tests the UI changes introduced by the PR, and produces a checklist of what it verified alongside the code analysis. This is the pattern that closes the gap between "the code looks right" and "the feature works."

---

## Hooks — Automated Feedback Loops

Hooks are commands that run before or after Claude executes a tool. They give you programmatic control over Claude's tool usage without modifying Claude's instructions.

```
Pre-tool use hook:  runs before tool execution → can inspect the call, block it (exit 2), send error feedback
Post-tool use hook: runs after tool execution  → performs follow-up operations, provides feedback (cannot block)
```

Hooks can be configured by manually editing the settings file, or by using the `/hooks` command inside Claude Code which guides the setup interactively.

**Restart required**: hook changes take effect only after restarting Claude Code. Changes to the settings file are not picked up mid-session.

**Common uses beyond blocking**: auto-format files immediately after creation, run the test suite after any edit, enforce code quality checks as a gate before writes land. The feedback loop is tight — Claude sees the result and can self-correct within the same session.

**Tool name discovery**: If you're not sure which tool name to use in a matcher, ask Claude directly. It knows its own tool names (`read`, `grep`, `edit`, `bash`, etc.) and can list them on request — no need to memorize or look them up in docs.

**Configuration** (`.claude/settings.local.json`):

```json
{
  "hooks": {
    "preToolUse": [
      {
        "matcher": "read|grep",
        "command": "node ./hooks/read_hook.js"
      }
    ],
    "postToolUse": [
      {
        "matcher": "edit",
        "command": "node ./hooks/typecheck_hook.js"
      }
    ]
  }
}
```

The hook script receives JSON via stdin:

```json
{
  "session_id": "abc123",
  "tool_name": "read",
  "tool_input": {
    "path": "/project/.env"
  }
}
```

### Exit Codes

| Code | Meaning |
|---|---|
| `0` | Allow the tool call to proceed |
| `2` | Block the tool call (pre-tool use only) — stderr output is sent back to Claude as feedback |

```javascript
// hooks/read_hook.js — block .env reads
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  const call = JSON.parse(Buffer.concat(chunks).toString());
  const path = call.tool_input?.path ?? '';
  if (path.includes('.env')) {
    console.error('Blocked: reading .env is not permitted in this project.');
    process.exit(2);
  }
  process.exit(0);
});
```

### Two High-Value Hook Patterns

**TypeScript type-checking hook** (post-tool use on edits):

```
Post-hook on edit tool → run `tsc --no-emit` → feed type errors back to Claude → Claude fixes call sites
```

Problem this solves: Claude updates a function signature but doesn't propagate the change to all call sites. The hook catches the type error immediately and feeds it back, triggering a correction in the same session. Works for any typed language with a type checker; substitute test runs for dynamically typed languages.

**Duplicate code prevention hook** (post-tool use on directory writes):

```
Post-hook on writes to queries/ → launch secondary Claude instance via SDK → compare new code
against existing code → if duplicate found, exit 2 with feedback → primary Claude reuses
existing code instead
```

Problem this solves: in complex multi-step tasks, Claude loses track of already-written utilities and creates duplicates. The hook enforces reuse without relying on Claude's attention span across a long session.

Trade-off: additional time and token cost per edit to the watched directory. Apply only to directories where duplication is costly.

---

## The Claude Code SDK — Programmatic Integration

For teams that want to embed Claude Code into larger pipelines, the SDK ships as three interfaces: **CLI** (`claude -p`), **TypeScript/Node**, and **Python**. All three expose the same underlying tools as the terminal version.

**TypeScript**:
```bash
npm install @anthropic/claude-code
```

```typescript
import { query } from '@anthropic/claude-code';

const result = await query({
  prompt: 'Analyze src/payments/ for N+1 query patterns and propose fixes.',
  options: {
    allowTools: ['read', 'grep', 'edit'],   // default is read-only; write requires explicit grant
    cwd: '/project'
  }
});

// result.messages = full turn-by-turn conversation between Claude Code and the model
// result.messages[result.messages.length - 1] = Claude's final response
```

**Python**:
```bash
pip install claude-code-sdk
```

```python
import asyncio
from claude_code_sdk import query, ClaudeCodeOptions

async def main():
    result = await query(
        prompt="Analyze src/payments/ for N+1 query patterns and propose fixes.",
        options=ClaudeCodeOptions(
            allow_tools=["read", "grep", "edit"],
            cwd="/project"
        )
    )
    # result is an async iterable of message objects
    # the last message is Claude's final response
    async for message in result:
        print(message)

asyncio.run(main())
```

**CLI (non-interactive)**:
```bash
# One-off analysis piped into another tool
claude -p "List all API endpoints" --output-format json | jq '.'

# Streaming output for real-time processing
claude -p "Analyze this log file" --output-format stream-json
```

**Default permissions are read-only** — `read`, `grep`, directory traversal. Write tools (`edit`, `bash`) must be explicitly included in `allowTools`. This is a sensible default for pipeline integration where you want Claude to analyze without side effects until a human reviews the plan.

The SDK output exposes the **raw turn-by-turn conversation** between the local Claude Code agent and the language model — not just a final answer. This is useful for auditing what tools were called, in what order, and what they returned. The final response is always the last message in the array.

The SDK is designed for helper scripts, hook implementations, and pipeline integrations rather than as a standalone interface.

```
Primary use cases:
  · Pre-commit hooks that invoke Claude for code review
  · CI pipeline steps that analyze changed files
  · Post-deploy scripts that summarize what changed and why
  · The duplicate-code prevention hook described above
```

---

## Summary — Configuration Surface Reference

| Mechanism | File / Location | What it controls |
|---|---|---|
| Project context | `CLAUDE.md` | Always-available codebase context |
| Targeted context | `@filename` in prompt | Per-request file injection |
| Plan Mode | `Shift+Tab` / `--permission-mode plan` | Read-only exploration and planning before any edits |
| Extended Thinking | `ultrathink` keyword / `/effort` | Depth reasoning budget for complex tasks |
| Auto Mode | `--enable-auto-mode` + `Shift+Tab` | Background classifier replaces manual permission prompts |
| Custom commands | `.claude/commands/*.md` | Repeatable task automation via slash commands |
| MCP servers | `claude mcp add` + `settings.local.json` | Additional tool capabilities |
| Hooks | `.claude/settings.local.json` | Pre/post tool call automation |
| GitHub Actions | `.github/workflows/` | CI and PR integration |
| SDK | npm (`@anthropic/claude-code`), pip (`claude-code-sdk`), CLI (`-p`) | Programmatic pipeline integration |

The common thread: every mechanism in this list is a way to give Claude **better signal** (context), **tighter feedback loops** (hooks, type checking), or **broader reach** (MCP servers, GitHub, SDK). The model itself is fixed. The configuration surface is where the real engineering happens.
