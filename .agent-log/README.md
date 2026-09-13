# .agent-log

Observability layer of this repo. `actions.jsonl` gets ONE JSON line per hook event, written by
`.claude/hooks/log-action.mjs` (wired in `.claude/settings.json`):

    {"ts":"2026-09-08T16:31:07.000Z","event":"PreToolUse","id":"toolu_01","session":"7d3c1a2f","mode":"default","tool":"Edit","path":"app/page.tsx"}
    {"ts":"2026-09-08T16:31:07.412Z","event":"PostToolUse","id":"toolu_01","session":"7d3c1a2f","mode":"default","tool":"Edit","path":"app/page.tsx","exit":0,"ms":14}

- `PreToolUse`  = the agent PROPOSED an action (before the permission check and any hook decision).
- `PostToolUse` / `PostToolUseFailure` = the action actually RAN (`exit` 0, or N from "Exit code N", "error", "interrupted").
- A PreToolUse line whose `id` never gets a Post line = proposed but not executed: blocked by a hook, a permission rule, or you.

Fields: ts, event, id (tool_use_id), session (first 8 chars), mode (permission mode), tool, path | cmd | pattern | url, exit, ms.

Read it with `pnpm agent:log` (per-tool proposed / executed / blocked / failed). Verify the hooks without an agent: `pnpm hooks:selftest`.

The raw `actions.jsonl` is local and git-ignored — it is this checkout's own history, not a shared artefact, so read it
through `pnpm agent:log` rather than opening it. In Claude Code the `log-filter.mjs` `PreToolUse` hook enforces that:
a raw dump (`cat`, `head`, `grep`, `type` …) is rewritten to `node scripts/agent-log-summary.mjs` and a `Read` of the
log is redirected to `.agent-log/summary.txt`, so the file never fills the context window. This `README.md` is the only
tracked file here.
