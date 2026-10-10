# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Project conventions

- Language: all content is Serbian — **latinica, ekavica**, warm teacher tone, technically precise. English terms in parentheses on first use (agent, tool use, RAG…). No Cyrillic in content files.
- License: content is **CC BY 4.0** (`LICENSE`, full legal code). Hard rule: do NOT copy, translate, or adapt anything from datawhalechina/hello-agents (CC BY-NC-SA) — only the general curriculum order is inspired by field consensus; README carries the credit note. All text/code/exercises here must be original.
- Layout: `MAPA-UCENJA.md` (11 modules 00–10, per-module outcomes/prereqs/time), `moduli/modul-NN-<slug>.md` (full modules, only 00 and 01 written so far), `radionice/radionica-NN-<slug>.md` (workshop skeletons: cilj, agenda po satima, vežbe, domaći, materijali checklist — 01–05 written), `O-AUTORU.md` (author bio; `[...]` placeholders must be filled before going public).
- Any API exercise must read credentials from environment variables (`Z_AI_API_KEY`, optional `Z_AI_BASE_URL`, `Z_AI_MODEL`) — never hardcode keys; keep `.env` out of Git.
- Validation before commit: link-check relative links in .md files, scan for leaked key patterns, confirm latinica/ekavica.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
