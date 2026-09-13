#!/usr/bin/env node
// Self-test for the Claude Code hooks in .claude/hooks/ — no agent needed.
// Pipes realistic hook payloads through the hook scripts against a TEMP project dir and checks:
//   1. protect-env.mjs blocks Read/Edit/Write of .env, .env.local, .env.production (exit 2) and allows .env.example +
//      normal files — the name is matched case-insensitively, so .ENV is blocked and .Env.Example is allowed
//   1b. protect-env.mjs enforces the invariants declared in .claude/hooks/invariants.json through Edit (new_string),
//       Write (content) AND NotebookEdit (new_source); the config is found from the project root or by walking up
//       from the event's cwd, so a nested cwd does not disable it; a missing or empty config changes nothing, while a
//       config that is present but invalid (bad JSON, bad shape, bad regex, missing message) blocks all three tools
//   2. log-action.mjs appends one JSON line per event (PreToolUse = proposed, Post* = executed) with repo-relative paths
//   3. a PreToolUse line without a Post line for the same id is reported as "proposed but not executed"
//   4. log-filter.mjs rewrites the tool input so the raw .agent-log/actions.jsonl never reaches the context window:
//      a Bash dump becomes `node scripts/agent-log-summary.mjs`, a Read becomes a Read of .agent-log/summary.txt,
//      and everything else is left untouched
// Usage: node scripts/hooks-selftest.mjs
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const here = process.cwd();
const tmp = mkdtempSync(join(tmpdir(), "hooks-selftest-"));
const env = { ...process.env, CLAUDE_PROJECT_DIR: tmp };
// envOverride exists for the one case that must run WITHOUT CLAUDE_PROJECT_DIR: finding the config by walking up.
const run = (script, payload, envOverride = env) =>
  spawnSync(process.execPath, [join(here, ".claude", "hooks", script)], { input: JSON.stringify(payload), env: envOverride, encoding: "utf8" });

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
};

const base = { session_id: "selftest-0001", cwd: tmp, permission_mode: "default" };

// 1. guard. The case variants are not cosmetic: on Windows and macOS .ENV opens the very same file as .env,
// so a case-sensitive guard would hand the agent the secrets under a different spelling.
for (const [tool, file, expect] of [
  ["Edit", join(tmp, ".env"), 2],
  ["Write", join(tmp, ".env.local"), 2],
  ["Read", tmp + "\\.env.production", 2],
  ["Read", join(tmp, ".ENV"), 2],
  ["Edit", join(tmp, ".Env.local"), 2],
  ["Edit", join(tmp, ".env.example"), 0],
  ["Edit", join(tmp, ".Env.Example"), 0],
  ["Read", join(tmp, "lib", "env.ts"), 0],
]) {
  const r = run("protect-env.mjs", { ...base, hook_event_name: "PreToolUse", tool_name: tool, tool_input: { file_path: file } });
  check(`protect-env ${tool} ${file.split(/[\\/]/).pop()} -> exit ${expect}`, r.status === expect, r.status === 2 ? r.stderr.trim() : "");
}

// 1b. custom invariants: the rule lives in .claude/hooks/invariants.json, never in the hook's source, so this
// section writes its own configs into the temp project and drives every case from them. The "allowed" cases
// matter most — they are what catches a pattern that has grown wider than the rule it came from.
const invPath = join(tmp, ".claude", "hooks", "invariants.json");
mkdirSync(join(tmp, ".claude", "hooks"), { recursive: true });

const dirty = "export const value = 1; // HAND_EDIT\n";
const clean = "export const value = 1;\n";
const guarded = join(tmp, "generated", "report.ts");
const guardedNb = join(tmp, "generated", "report.ipynb");

// The same body arrives in a different field per tool, and a notebook carries its path under another key too.
// All three have to be covered, or the hook goes quiet the moment the agent picks a different tool.
const inputFor = (tool, file, body) =>
  tool === "NotebookEdit"
    ? { notebook_path: file, new_source: body }
    : tool === "Write"
      ? { file_path: file, content: body }
      : { file_path: file, new_string: body };
const guard = (tool, file, body) =>
  run("protect-env.mjs", { ...base, hook_event_name: "PreToolUse", tool_name: tool, tool_input: inputFor(tool, file, body) });

// No config at all means "not configured", not "invalid": a project that copied the harness without one stays usable.
rmSync(invPath, { force: true });
let r = guard("Edit", guarded, dirty);
check("missing invariants.json leaves an ordinary Edit alone", r.status === 0 && r.stderr === "", r.stderr.trim());

const rule = {
  pathPattern: "(^|/)generated/",
  forbiddenPattern: "\\bHAND_EDIT\\b",
  message: "generated/** is build output; change the source instead",
};
writeFileSync(invPath, JSON.stringify({ invariants: [rule] }, null, 2));

for (const [tool, file, body, note, expect] of [
  ["Edit", guarded, dirty, "", 2],
  ["Write", guarded, dirty, "", 2],
  ["NotebookEdit", guardedNb, dirty, "", 2],
  ["Edit", join(tmp, "src", "report.ts"), dirty, "(outside generated/)", 0],
  ["Write", guarded, clean, "(no forbidden marker)", 0],
  ["NotebookEdit", guardedNb, clean, "(no forbidden marker)", 0],
]) {
  r = guard(tool, file, body);
  const label = `invariant ${tool} ${file.split(/[\\/]/).pop()}${note ? " " + note : ""} -> exit ${expect}`;
  check(label, r.status === expect, r.status === 2 ? r.stderr.trim().split("\n")[0] : "");
}

r = guard("Edit", guarded, dirty);
check(
  "invariant message reads `Blocked by hook: <path> — <message>`",
  new RegExp(`^Blocked by hook: .*/generated/report\\.ts — ${rule.message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m").test(r.stderr),
  r.stderr.trim(),
);

// Where the agent happens to be standing must not decide whether the project's invariants exist. With no
// CLAUDE_PROJECT_DIR the hook walks up from the event's cwd, so a call made three directories down still finds
// the config at the root. The allowed case is the control: the walk must find the rule, not block everything.
const nested = join(tmp, "packages", "web", "src");
mkdirSync(nested, { recursive: true });
const envNoRoot = { ...process.env };
delete envNoRoot.CLAUDE_PROJECT_DIR;
const fromNested = (file, body) =>
  run(
    "protect-env.mjs",
    { ...base, cwd: nested, hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path: file, new_string: body } },
    envNoRoot,
  );
r = fromNested(guarded, dirty);
check("nested cwd, no CLAUDE_PROJECT_DIR: config found upwards, forbidden Edit blocked", r.status === 2, r.stderr.trim().split("\n")[0]);
r = fromNested(guarded, clean);
check("nested cwd: an allowed Edit still passes (the walk finds the rule, not a blanket block)", r.status === 0 && r.stderr === "", r.stderr.trim());

// A config that is there but cannot be trusted fails CLOSED — and says why without quoting the file.
const invalidConfig = /^Blocked by hook: invalid invariants configuration/m;
writeFileSync(invPath, '{ "invariants": [ }\n');
r = guard("Edit", join(tmp, "src", "report.ts"), clean);
check("malformed JSON blocks Edit", r.status === 2 && invalidConfig.test(r.stderr), r.stderr.trim());
check("the block reason does not echo the config", !r.stderr.includes('"invariants": [ }'), r.stderr.trim());

writeFileSync(invPath, JSON.stringify({ invariants: [{ ...rule, forbiddenPattern: "HAND_EDIT(" }] }, null, 2));
r = guard("Write", join(tmp, "src", "report.ts"), clean);
check("invalid regex blocks Write", r.status === 2 && invalidConfig.test(r.stderr), r.stderr.trim());
r = guard("NotebookEdit", join(tmp, "src", "report.ipynb"), clean);
check("invalid regex blocks NotebookEdit too", r.status === 2 && invalidConfig.test(r.stderr));
r = run("protect-env.mjs", { ...base, hook_event_name: "PreToolUse", tool_name: "Read", tool_input: { file_path: join(tmp, "src", "report.ts") } });
check("a broken config still lets Read through (invariants are about writing)", r.status === 0, r.stderr.trim());

// The two fixes above meet here: the config is found by walking up from a nested cwd, and it is broken. The
// reason has to name the file that was actually read. A message built from a project-relative constant would
// point at <nested cwd>/.claude/hooks/invariants.json — a path that does not exist — and send the agent to fix
// the wrong file, or a file it would have to create.
writeFileSync(invPath, '{ "invariants": [ }\n');
r = fromNested(guarded, clean);
check("nested cwd + malformed config found upwards: Edit blocked", r.status === 2 && invalidConfig.test(r.stderr), r.stderr.trim());
check("the reason names the configPath actually read, not a path under the nested cwd", r.stderr.includes(invPath), r.stderr.trim());
check("the path it names exists on disk", existsSync(invPath) && !existsSync(join(nested, ".claude", "hooks", "invariants.json")));
check("the nested-cwd reason still does not echo the config", !r.stderr.includes('"invariants": [ }'), r.stderr.trim());

// message is required, like the two patterns. Without it a block would name no project rule, leaving the agent
// to guess what it hit — so the rule is treated as a broken config, not enforced with a placeholder reason.
const noMessage = { ...rule };
delete noMessage.message;
for (const [label, badRule] of [
  ["missing message", noMessage],
  ["empty message", { ...rule, message: "" }],
]) {
  writeFileSync(invPath, JSON.stringify({ invariants: [badRule] }, null, 2));
  for (const tool of ["Edit", "Write", "NotebookEdit"]) {
    r = guard(tool, join(tmp, "src", "report.ts"), clean);
    check(`${label} blocks ${tool}`, r.status === 2 && invalidConfig.test(r.stderr), r.stderr.trim());
  }
}
check("the reason names the offending field", /invariant #1: message must be a non-empty string/.test(r.stderr), r.stderr.trim());

// A NotebookEdit payload can carry an empty file_path next to the real notebook_path. An `??` fallback keeps
// the empty string, and every path match below then runs against "" — the hook goes quiet on a real edit.
writeFileSync(invPath, JSON.stringify({ invariants: [rule] }, null, 2));
r = run("protect-env.mjs", {
  ...base,
  hook_event_name: "PreToolUse",
  tool_name: "NotebookEdit",
  tool_input: { file_path: "", notebook_path: guardedNb, new_source: dirty },
});
check("NotebookEdit with an empty file_path still matches on notebook_path", r.status === 2, r.stderr.trim().split("\n")[0]);

// Back to the list the starter actually ships: a valid empty config must change nothing.
writeFileSync(invPath, JSON.stringify({ invariants: [] }, null, 2));
r = guard("Edit", guarded, dirty);
check("empty invariants list leaves an ordinary Edit alone", r.status === 0 && r.stderr === "", r.stderr.trim());
r = guard("Edit", join(tmp, ".env"), clean);
check("empty invariants list still blocks .env (the two layers are independent)", r.status === 2);

// 2. logger: a proposed+executed Bash, a proposed+executed Edit, a proposed+failed Bash, a proposed-only Edit (blocked)
const events = [
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t1", tool_name: "Bash", tool_input: { command: "pnpm check" } },
  { ...base, hook_event_name: "PostToolUse", tool_use_id: "t1", tool_name: "Bash", tool_input: { command: "pnpm check" }, tool_response: { stdout: "ok" }, duration_ms: 4200 },
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t2", tool_name: "Edit", tool_input: { file_path: join(tmp, "app", "page.tsx") } },
  { ...base, hook_event_name: "PostToolUse", tool_use_id: "t2", tool_name: "Edit", tool_input: { file_path: join(tmp, "app", "page.tsx") }, duration_ms: 15 },
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t3", tool_name: "Bash", tool_input: { command: "pnpm typecheck" } },
  { ...base, hook_event_name: "PostToolUseFailure", tool_use_id: "t3", tool_name: "Bash", tool_input: { command: "pnpm typecheck" }, error: "Exit code 2\nerror TS2339", duration_ms: 900 },
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t4", tool_name: "Edit", tool_input: { file_path: join(tmp, ".env") } },
];
for (const e of events) {
  const r = run("log-action.mjs", e);
  check(`log-action ${e.hook_event_name} ${e.tool_name} exits 0 silently`, r.status === 0 && r.stdout === "");
}
const lines = readFileSync(join(tmp, ".agent-log", "actions.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
check("log has 7 lines", lines.length === 7);
check("PreToolUse line has no exit field", lines[0].event === "PreToolUse" && !("exit" in lines[0]) && lines[0].id === "t1");
check("PostToolUse Bash keeps cmd and exit 0", lines[1].cmd === "pnpm check" && lines[1].exit === 0 && lines[1].ms === 4200);
check("Edit line stores repo-relative path", lines[3].path === "app/page.tsx", lines[3].path);
check("failure line carries exit code 2", lines[5].exit === 2);

// 3. summary pairs Pre/Post by id
const executedIds = new Set(lines.filter((l) => l.event !== "PreToolUse").map((l) => l.id));
const proposedOnly = lines.filter((l) => l.event === "PreToolUse" && !executedIds.has(l.id));
check("exactly one proposed-but-not-executed action (.env edit)", proposedOnly.length === 1 && proposedOnly[0].path === ".env");
const summary = spawnSync(process.execPath, [join(here, "scripts", "agent-log-summary.mjs"), join(tmp, ".agent-log", "actions.jsonl")], { encoding: "utf8" });
check("agent-log-summary reports 1 proposed but not executed", summary.status === 0 && /1 proposed but not executed/.test(summary.stdout));

// 4. filter: the raw log never reaches the context window
const SUMMARY_CMD = "node scripts/agent-log-summary.mjs";
const logPath = join(tmp, ".agent-log", "actions.jsonl");
const summaryPath = join(tmp, ".agent-log", "summary.txt");
// The hook rebuilds the summary with the PROJECT'S OWN script, so the temp project needs a copy of it.
mkdirSync(join(tmp, "scripts"), { recursive: true });
copyFileSync(join(here, "scripts", "agent-log-summary.mjs"), join(tmp, "scripts", "agent-log-summary.mjs"));

const filter = (payload) => {
  const r = run("log-filter.mjs", { ...base, hook_event_name: "PreToolUse", ...payload });
  let out = {};
  try {
    out = JSON.parse(r.stdout || "{}");
  } catch {
    /* not JSON -> treat it as the hook deciding nothing */
  }
  return { r, updated: out.hookSpecificOutput?.updatedInput, message: out.systemMessage ?? "" };
};

// Bash: a raw dump of the log is rewritten, everything else is left alone. The "untouched" cases matter most —
// they are what catches a matcher or a predicate that has grown too wide.
for (const [command, expected] of [
  ["cat .agent-log/actions.jsonl", SUMMARY_CMD],
  ["tail -n 500 .agent-log/actions.jsonl | grep PreToolUse", SUMMARY_CMD],
  ["grep gate .agent-log/actions.jsonl", SUMMARY_CMD],
  ["cat ./.agent-log/actions.jsonl", SUMMARY_CMD],
  ["git status --short", null],
  ["cat README.md", null],
  [SUMMARY_CMD, null],
  ["node scripts/agent-log-summary.mjs .agent-log/actions.jsonl", null],
]) {
  const { r, updated } = filter({ tool_name: "Bash", tool_input: { command, description: "look at the log" } });
  const ok = expected
    ? r.status === 0 && updated?.command === expected && updated?.description === "look at the log"
    : r.status === 0 && r.stdout === "";
  check(`log-filter Bash \`${command}\` -> ${expected ? "summary command" : "untouched"}`, ok, updated?.command ?? "");
}

// Read: redirect even when no summary exists yet — a Read error is visible, 1.4 MB in the window is not.
rmSync(summaryPath, { force: true });
let res = filter({ tool_name: "Read", tool_input: { file_path: logPath, limit: 200 } });
check(
  "log-filter Read actions.jsonl -> summary.txt (summary missing), other input kept",
  res.r.status === 0 && res.updated?.file_path === summaryPath && res.updated?.limit === 200,
  res.updated?.file_path ?? "",
);
check("log-filter rebuilt .agent-log/summary.txt from the log", existsSync(summaryPath) && readFileSync(summaryPath, "utf8").startsWith("Agent actions:"));

// A summary newer than the log is taken as is...
writeFileSync(summaryPath, "STALE-MARKER\n");
res = filter({ tool_name: "Read", tool_input: { file_path: logPath } });
check(
  "log-filter reuses a summary newer than the log",
  res.updated?.file_path === summaryPath && readFileSync(summaryPath, "utf8").startsWith("STALE-MARKER"),
);
// ...one older than the log is rebuilt, so yesterday's numbers never reach the screen.
const past = new Date(Date.now() - 3600000);
utimesSync(summaryPath, past, past);
res = filter({ tool_name: "Read", tool_input: { file_path: logPath } });
check("log-filter rebuilds a summary older than the log", readFileSync(summaryPath, "utf8").startsWith("Agent actions:"));

res = filter({ tool_name: "Read", tool_input: { file_path: tmp + "\\.agent-log\\actions.jsonl" } });
check("log-filter matches a Windows-shaped path too", res.updated?.file_path === summaryPath, res.updated?.file_path ?? "");

for (const p of [join(tmp, "lib", "env.ts"), summaryPath]) {
  const { r, updated } = filter({ tool_name: "Read", tool_input: { file_path: p } });
  check(`log-filter leaves Read ${p.split(/[\\/]/).pop()} alone`, r.status === 0 && r.stdout === "" && !updated);
}

const post = filter({ tool_name: "Read", hook_event_name: "PostToolUse", tool_input: { file_path: logPath } });
check("log-filter ignores events other than PreToolUse", post.r.status === 0 && post.r.stdout === "");
const broken = spawnSync(process.execPath, [join(here, ".claude", "hooks", "log-filter.mjs")], { input: "not json", env, encoding: "utf8" });
check("log-filter survives malformed input (exit 0, silent)", broken.status === 0 && broken.stdout === "");
check(
  "log-filter names itself in systemMessage, so the rewrite is visible",
  /hook \(log-filter\)/.test(filter({ tool_name: "Bash", tool_input: { command: "cat .agent-log/actions.jsonl" } }).message),
);

rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : "\nall hook checks passed");
process.exit(failed ? 1 : 0);
