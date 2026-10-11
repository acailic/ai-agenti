# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Project conventions

- Language: all content is Serbian — **latinica, ekavica**, warm teacher tone, technically precise. English terms in parentheses on first use (agent, tool use, RAG…). No Cyrillic in content files.
- License: content is **CC BY 4.0** (`LICENSE`, full legal code). Hard rule: do NOT copy, translate, or adapt anything from datawhalechina/hello-agents (CC BY-NC-SA) — only the general curriculum order is inspired by field consensus; README carries the credit note. All text/code/exercises here must be original.
- Layout: `MAPA-UCENJA.md` (11 modules 00–10, per-module outcomes/prereqs/time, ✅/🔜 status per module), `moduli/modul-NN-<slug>.md` (full modules 00–03 written; 04–10 planned), `REČNIK.md` (44-term Serbian–English glossary, linked from README/MAPA/module 00), `radionice/radionica-NN-<slug>.md` (01 and 02 complete — 02 includes full worked solutions; 03–05 skeletons), `O-AUTORU.md` (author bio; `[...]` placeholders must be filled before going public).
- Any API exercise must read credentials from environment variables (`Z_AI_API_KEY`, optional `Z_AI_BASE_URL`, `Z_AI_MODEL`) — never hardcode keys; keep `.env` out of Git. Shared code conventions in modules: z.ai GLM via OpenAI-compatible client (default base `https://api.z.ai/api/paas/v4`, model `glm-4.6`), tool use via `tools=`/`tool_calls`/`role:"tool"` messages, sandbox-restricted file tools, AST-based calculator (never `eval`).
- Validation before commit: link-check relative links in .md files (strip fenced/inline code first — `](...)` inside code yields false positives), scan for leaked key patterns, confirm latinica/ekavica (ijekavica + Cyrillic scan). Python blocks in modules/radionice should compile: extract ```python fences and `py_compile` them; the agent-loop pattern is mock-testable without network.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
