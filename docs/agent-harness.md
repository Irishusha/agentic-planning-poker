# Agent harness in planning-poker

What of the agent harness is installed here and how to use it. The portable half lives elsewhere — see
"Source of truth" at the end.

## Observability: log-action and `pnpm agent:log`

`.claude/hooks/log-action.mjs` appends one JSON line to `.agent-log/actions.jsonl` per hook event:
`PreToolUse` = the agent **proposed** an action, `PostToolUse` / `PostToolUseFailure` = it **ran**. A
`PreToolUse` line with no matching Post line means "proposed but not executed" — blocked by a hook, by a
permission rule, or by you. Field format: `.agent-log/README.md`.

Read it with `pnpm agent:log` (`node scripts/agent-log-summary.mjs`): a per-tool table of proposed /
executed / blocked / failed, then every action proposed but never executed and every non-zero exit code.

## log-filter: the raw JSONL never reaches the context window

`.claude/hooks/log-filter.mjs`, `PreToolUse` with matcher `Bash|Read`. It blocks nothing; it **rewrites the
tool input**, so the raw `actions.jsonl` — about two records per tool call, mostly noise — stays out of the
window.

- `Bash` whose first word in any pipeline segment is `cat`, `head`, `tail`, `less`, `more`, `nl`, `grep`,
  `egrep`, `fgrep`, `rg` or `type` → the command becomes `node scripts/agent-log-summary.mjs`. `wc` is
  deliberately absent: it returns one number and does not fill the window.
- `Read` of `.agent-log/actions.jsonl` → path swapped to `.agent-log/summary.txt`, rebuilt when stale.

`systemMessage` makes the substitution visible in the transcript, so it reads as a hook rather than a
coincidence. The hook never blocks and never fails: any error inside it is exit 0 and silence. Both tools are
covered on purpose — the agent's choice between `Bash` and `Read` is not deterministic, and a hook cannot
turn a `Read` into a `Bash` call. The same rule is stated for agents in `AGENTS.md`, §10.

## protect-env: secrets

`.claude/hooks/protect-env.mjs`, `PreToolUse` with matcher `Read|Edit|Write|NotebookEdit`. Exits **2** — call
blocked, stderr fed back to the agent as the reason — on `.env`, `.env.local`, `.env.production` and other
`.env.*`; `.env.example` stays open. The name is compared **case-insensitively**, because on Windows and
macOS `.ENV` resolves to the very same file. `PreToolUse` runs **before** the permission check and in
**every** permission mode, so this is the first line of defence; the `permissions.deny` lists in
`.claude/settings.json` are the second.

## Invariants: deliberately empty here

The same hook enforces rules the project declares for itself in `.claude/hooks/invariants.json`. Here the
list is `"invariants": []` — **empty, and it should stay empty** until there is product code worth pinning
down. A rule is `{ pathPattern, forbiddenPattern, message }`; the first two are regular-expression
**sources**, and all three fields are required. The path is normalized to forward slashes and is normally
absolute, so anchor a repository-relative segment as `(^|/)app/api/`, never `^app/api/`. One rule covers all
three writing tools, reading the new content from the field each one uses: `new_string` for `Edit`,
`content` for `Write`, `new_source` for `NotebookEdit`.

**An invalid config fails closed:**

| State | Result |
| --- | --- |
| No `invariants.json` at all | Not configured — nothing is enforced |
| Valid file, `"invariants": []` | Configured with no rules — nothing is enforced |
| Present but unreadable, not valid JSON, wrong shape, missing or empty field, or invalid regex | `Edit`, `Write` and `NotebookEdit` all **blocked** with `Blocked by hook: invalid invariants configuration — …` until fixed or removed |

A broken config cannot silently become "no rules". `Read` stays unaffected — an invariant is about what is
**written**, so a broken file must not cut the agent off from the repository. The block reason is one line
naming the fault and the path actually read, and never quotes the file's contents.

After any change to the hooks or to `invariants.json`, run `pnpm hooks:selftest`
(`node scripts/hooks-selftest.mjs`): it pipes realistic payloads through the hooks in a temporary directory,
with no agent and no network, and writes nothing into the repository.

## spec-reviewer

`.claude/agents/spec-reviewer.md` is a read-only subagent: its `tools:` line grants `Read`, `Grep` and `Glob`
and nothing else, so it can neither edit a file nor run a command. It works in its **own context window**, so
the long reading a review takes never settles in the window where the work continues. Name the **target** and
the **specification sources** — an unnamed source is one it will not open, and a request with no source at
all comes back as a single line saying so:

```
Use the spec-reviewer subagent to review app/page.tsx against docs/<spec>.md
```

The reply is bounded on purpose: at most eight discrepancies and four decisions, one line each. It runs on
`model: inherit`, i.e. the main session's model; details in `.claude/agents/README.md`. Beside it,
`.claude/rules/path-scoped-rule.md.example` is an inactive path-scoped rule template — the `.example` suffix
is what keeps it dormant; to activate, copy it to `.claude/rules/<area>.md`.

## Session handoff

A context window does not survive a session. `docs/session-notes.template.md` is the neutral form for the
state the next session has to see: branch, last commit and working-tree state; what was completed; what is
blocked and why; decisions proposed but not confirmed; what to start with; and which checks actually ran,
with their commands and exit codes. Copy it to `docs/session-notes.md` (or a dated file beside it) and fill
it in. This project's product decisions and autonomy boundaries are tracked separately in
`docs/autonomy-log.md`.

None of the commands below **writes, deletes or restores a file** — a cleared window leaves the working tree
exactly as it was. Only the notes file carries the state of the work across:

| Command | What it does |
| --- | --- |
| `/compact` | Summarizes the current conversation in place; the same thread continues. Takes optional focus instructions. |
| `/clear <name>` | Starts an empty context. The optional name labels the conversation you are leaving, so it is recognisable in `/resume`. Aliases: `/reset`, `/new`. |
| `/resume` | Returns to an earlier conversation, with its history. |
| `/btw <question>` | A side question about the current session, not added to the conversation. |

Compaction is lossy by design: write the notes **before** compacting, not after.

## A settings change needs a new session

Hook wiring is read at session start. After any change to `.claude/settings.json` — including the addition of
`log-filter` — open a **new** Claude Code session, or it keeps running the configuration it loaded at
startup. `pnpm hooks:selftest` verifies the scripts; only a fresh session proves they are wired in. The
current `PreToolUse` order, which matters:

1. `Read|Edit|Write|NotebookEdit` → `protect-env.mjs` — blocks first;
2. `Bash|Read` → `log-filter.mjs` — rewrites the input of whatever got through;
3. `*` → `log-action.mjs` — records however it ended.

`PostToolUse` and `PostToolUseFailure` keep a single catch-all `log-action.mjs`.

## Source of truth

The portable half — `.claude/hooks/`, `.claude/agents/`, `.claude/rules/`, `scripts/`, `.agents/skills/`,
`docs/session-notes.template.md` — comes from `../agent-harness-starter` and is edited **there**. Changes
travel here by copying, not by editing in place, or the next update from the starter overwrites them.
`.claude/settings.json`, `AGENTS.md` and `.gitignore` are the exception: they are **merged**, not copied,
because they also carry this project's own rules. `.claude/skills/` is generated output of `pnpm skills:sync`
from `.agents/skills/` — edit the source, never the copy.
