# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Project conventions

- Language: all content is Serbian — **latinica, ekavica**, warm teacher tone, technically precise. English terms in parentheses on first use (agent, tool use, RAG…). No Cyrillic in content files.
- License: content is **CC BY 4.0** (`LICENSE`, full legal code). Hard rule: do NOT copy, translate, or adapt anything from datawhalechina/hello-agents (CC BY-NC-SA) — only the general curriculum order is inspired by field consensus; README carries the credit note. All text/code/exercises here must be original.
- Layout: `MAPA-UCENJA.md` (11 modules 00–10, per-module outcomes/prereqs/time, ✅/🔜 status per module), `moduli/modul-NN-<slug>.md` (full modules 00–07 written; 08–10 planned), `REČNIK.md` (82-term Serbian–English glossary, linked from README/MAPA/module 00), `radionice/radionica-NN-<slug>.md` (01, 02, 04 and 06 complete with worked solutions; 03 and 05 skeletons), `O-AUTORU.md` (author bio; `[...]` placeholders must be filled before going public), `CONTRIBUTING.md` (Serbian contribution guide: language/technical rules, PR checks).
- Any API exercise must read credentials from environment variables (`Z_AI_API_KEY`, optional `Z_AI_BASE_URL`, `Z_AI_MODEL`; embeddings additionally `Z_AI_EMBED_MODEL`, default `embedding-3`) — never hardcode keys; keep `.env` out of Git. Shared code conventions in modules: z.ai GLM via OpenAI-compatible client (default base `https://api.z.ai/api/paas/v4`, model `glm-4.6`), tool use via `tools=`/`tool_calls`/`role:"tool"` messages, sandbox-restricted file tools, AST-based calculator (never `eval`), RAG pipeline = chunking (sentence split, ~900 chars, ~150 overlap) → embeddings → local vector store (`indeks.json`) → cosine k-NN → answer with mandatory `(odlomak N, izvor)` citations.
- Multi-exercise files: modules use digit-prefixed names (`06a_sema.py`, `07a_agent.py`) that the `import` statement cannot load — shared code is duplicated (module 04 pattern) or loaded via `importlib.import_module` (module 07's runner, with a comment); radionice use importable `rNN_vN_*.py` names and import across exercises (radionica 04 pattern). Module 06's protocol exercises are network-free by design (JSON-RPC-shaped dicts through an in-process `posalji` "transport"), so the mock handshake is testable without an API key; module 07's eval harness pattern = versioned `eval-skup.json` scenarios + runner with deterministic checks, pass rate, threshold as exit code, and `--diff` of two saved result files.
- Validation before commit: link-check relative links in .md files (strip fenced/inline code first — `](...)` inside code yields false positives), scan for leaked key patterns, confirm latinica/ekavica (ijekavica + Cyrillic scan). Python blocks in modules/radionice should compile: extract ```python fences and `py_compile` them; the agent-loop pattern is mock-testable without network.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
