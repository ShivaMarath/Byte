# byte-agent

A CLI-first AI agent with GitHub authentication. One command to wake up your agent, three modes to get things done.

```bash
byte wakeup
```

---

## Modes

**`agent`** — Agentic mode that plans, writes, and builds software end-to-end. Give it a goal, it figures out the rest.

**`chat`** — Conversational AI in your terminal. Context-aware, session-persistent.

**`tools`** — Augmented AI with live capabilities:
- 🔍 Google Search
- ⚙️ Code Execution
- 🌐 URL Context Fetcher

---

## Stack

| Layer | Tech |
|---|---|
| CLI (`byte`) | Node.js + TypeScript |
| Backend | Express + Better Auth v1.5.5 |
| Web | Next.js (App Router) |
| Auth | GitHub OAuth · Device Authorization Flow · Bearer tokens |

---

## Quick Start

```bash

byte login      # GitHub device flow — no browser redirects
byte wakeup     # pick a mode and go
```

## Commands

```bash
byte login      # authenticate via GitHub (device flow)
byte logout     # clear local session
byte whoami     # show current authenticated user
byte wakeup     # start agent — choose agent / chat / tools mode
byte config     # view or edit agent configuration
```

---

## Auth

Uses the device authorization flow — your terminal gets a code, you authorize on GitHub, done. Sessions are Bearer-token backed via Better Auth.



