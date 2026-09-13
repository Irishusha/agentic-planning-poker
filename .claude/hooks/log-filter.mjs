#!/usr/bin/env node
// Claude Code PreToolUse hook (matcher: "Bash|Read").
// Keeps the raw agent log OUT of the context window: same question, same tool, summary instead of the JSONL.
//   Bash branch: a raw dump of .agent-log/actions.jsonl (cat/head/tail/less/grep/type ...)
//                -> command rewritten to `node scripts/agent-log-summary.mjs`
//   Read branch: file_path .agent-log/actions.jsonl -> .agent-log/summary.txt (rebuilt when stale)
// The rewrite is returned as hookSpecificOutput.updatedInput — "Replacement tool input object", i.e. the SAME
// tool runs with a different input. A hook cannot turn a Read into a Bash call, which is exactly why the
// matcher has to cover both tools: the agent's choice of tool is not deterministic.
// Never blocks and never fails: any error -> exit 0 and silence, a broken filter must not stop the agent.
import { existsSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

let ev = {};
try {
  ev = JSON.parse(raw || "{}");
} catch {
  process.exit(0);
}

// updatedInput only exists on PreToolUse; on any other event there is nothing for this hook to say.
if (ev.hook_event_name && ev.hook_event_name !== "PreToolUse") process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || ev.cwd || process.cwd();
const ti = ev.tool_input ?? {};

// The same normalization as in log-action.mjs, so both hooks judge paths in one shape.
const norm = (p) =>
  String(p)
    .replace(/\\/g, "/")
    .replace(/^\/([a-zA-Z])\//, (_, d) => `${d.toUpperCase()}:/`)
    .replace(/^([a-zA-Z]):\//, (_, d) => `${d.toUpperCase()}:/`)
    .replace(/\/$/, "");

const LOG = ".agent-log/actions.jsonl";
const SUMMARY_CMD = "node scripts/agent-log-summary.mjs";
// Commands that dump a file into the window. grep belongs here too: it filters, but it easily
// returns thousands of lines. wc is deliberately NOT here — it returns a single number and does
// not fill the window, so a question about the log's line count stays answerable as asked.
// What to keep is still the agent's call; the point is that the decision happens BEFORE the window, not in it.
const DUMPERS = new Set(["cat", "head", "tail", "less", "more", "nl", "grep", "egrep", "fgrep", "rg", "type"]);

// systemMessage makes the substitution visible in the transcript: a rewrite should read as a hook, not a coincidence.
const emit = (input, message) => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", updatedInput: input },
      systemMessage: message,
    }),
  );
  process.exit(0);
};

// Rebuild the summary only when it is older than the log: stale numbers on screen are worse than a slow hook.
// Best effort — if it fails, redirect anyway: a Read error is visible, 1.4 MB of JSONL in the window is not.
const refresh = (target, source) => {
  try {
    if (existsSync(target) && existsSync(source) && statSync(target).mtimeMs >= statSync(source).mtimeMs) return;
    const script = join(root, "scripts", "agent-log-summary.mjs");
    if (!existsSync(script)) return;
    const r = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8", timeout: 5000 });
    if (r.status === 0 && r.stdout) writeFileSync(target, r.stdout);
  } catch {
    /* the summary is a convenience, not a precondition */
  }
};

try {
  if (ev.tool_name === "Bash" && typeof ti.command === "string" && norm(ti.command).includes(LOG)) {
    // Look at the FIRST word of every pipeline segment, not at the whole string: `cat … | grep …` is a dump too,
    // while `node scripts/agent-log-summary.mjs .agent-log/actions.jsonl` mentions the log and must stay untouched.
    const isDump = ti.command.split(/\|\||&&|[|;\n]/).some((segment) => {
      const first = segment.trim().split(/\s+/)[0] ?? "";
      const bin = (first.replace(/\\/g, "/").split("/").pop() ?? "").toLowerCase();
      return DUMPERS.has(bin);
    });
    if (isDump) {
      emit(
        { ...ti, command: SUMMARY_CMD },
        `Rewritten by hook (log-filter): the raw ${LOG} never enters the context window — running "${SUMMARY_CMD}" instead.`,
      );
    }
  }

  if (ev.tool_name === "Read" && typeof ti.file_path === "string" && norm(ti.file_path).endsWith(LOG)) {
    const summary = join(root, ".agent-log", "summary.txt");
    refresh(summary, join(root, ".agent-log", "actions.jsonl"));
    emit(
      { ...ti, file_path: summary },
      `Rewritten by hook (log-filter): Read redirected from ${LOG} to .agent-log/summary.txt — the summary enters the context window, not the log.`,
    );
  }
} catch {
  /* the filter never breaks a tool call */
}
process.exit(0);
