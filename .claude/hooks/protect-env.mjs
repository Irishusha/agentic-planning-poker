#!/usr/bin/env node
// Claude Code PreToolUse hook (matcher: Read|Edit|Write|NotebookEdit).
// Blocks reading or writing secrets files (.env, .env.local, .env.production ...); .env.example stays open.
// The name is compared case-insensitively: Windows and macOS filesystems resolve .ENV and .Env.Local to the
// very same secrets file, so a case-sensitive guard would be no guard at all on the platforms this targets.
// Then enforces the project's own invariants, declared in .claude/hooks/invariants.json — see README.
// Exit code 2 = the tool call is BLOCKED and stderr is fed back to the agent as the reason.
// PreToolUse hooks run BEFORE the permission check, in EVERY permission mode (even bypassPermissions):
// hooks enforce, AGENTS.md only advises. The permissions.deny rules in settings.json are the second line of defence.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

let ev = {};
try {
  ev = JSON.parse(raw || "{}");
} catch {
  process.exit(0);
}

const input = ev.tool_input ?? {};
// `||`, not `??`: a payload that carries an empty-string file_path alongside a real notebook_path must fall
// through to the notebook path, or every check below would run against "" and quietly pass.
const p = String(input.file_path || input.notebook_path || "").replace(
  /\\/g,
  "/",
);
const base = (p.split("/").pop() ?? "").toLowerCase();

if (/^\.env(\..+)?$/.test(base) && base !== ".env.example") {
  const verb = ev.tool_name === "Read" ? "read" : "edit";
  process.stderr.write(
    `Blocked by hook: ${p} is a secrets file; the agent must not ${verb} it. Use .env.example instead and ask the user to update .env manually.\n`,
  );
  process.exit(2);
}

// Content invariants. Each rule is { pathPattern, forbiddenPattern, message }, both patterns being
// RegExp source strings, so the rule lives in the config and nothing framework-specific lives here.
// The new content arrives in a different field per tool, and the agent's choice between the tools is not
// deterministic: a hook that knows only one field goes quiet the moment another tool is used.
const MUTATORS = {
  Edit: "new_string",
  Write: "content",
  NotebookEdit: "new_source",
};

// Locating the config must not depend on where the agent happens to be standing. CLAUDE_PROJECT_DIR is the
// project root when the harness sets it; otherwise walk up from the event's cwd to the filesystem root, the
// way every other tool finds its own config. A hook that only looked in cwd would silently disable every
// invariant the moment a tool call ran from a subdirectory — the one case fail-closed cannot cover, because
// "no file here" is indistinguishable from "not configured" until the whole tree has been searched.
// Returns the path the config would be read from — which need not exist, since an absent file is simply "not
// configured" — or null when the walk reached the filesystem root without finding one.
const findConfig = () => {
  const fromEnv = process.env.CLAUDE_PROJECT_DIR;
  if (fromEnv) return join(fromEnv, ".claude", "hooks", "invariants.json");
  let dir = resolve(ev.cwd || process.cwd());
  for (;;) {
    const candidate = join(dir, ".claude", "hooks", "invariants.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
};

// Returns { rules } or { error }. No config at all means "not configured" and is allowed; a config that IS
// there but cannot be trusted is an error, and the caller then blocks. Reasons never quote the file's
// contents — not even through a parser or RegExp message, which would echo the very text they complain about.
const loadInvariants = (configPath) => {
  if (!configPath) return { rules: [] };
  let text;
  try {
    text = readFileSync(configPath, "utf8");
  } catch (err) {
    if (err?.code === "ENOENT") return { rules: [] };
    return { error: "exists but cannot be read" };
  }

  let cfg;
  try {
    cfg = JSON.parse(text);
  } catch {
    return { error: "not valid JSON" };
  }
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg))
    return { error: "top level must be a JSON object" };
  if (!Array.isArray(cfg.invariants))
    return { error: '"invariants" must be an array' };

  const rules = [];
  for (const [i, rule] of cfg.invariants.entries()) {
    const at = `invariant #${i + 1}`;
    if (!rule || typeof rule !== "object" || Array.isArray(rule))
      return { error: `${at} is not an object` };
    // All three fields are required. A rule with no message blocks with a reason that names no project rule,
    // which leaves the agent guessing what it hit — so an absent or empty message is a broken config, not a
    // rule to enforce silently.
    for (const key of ["pathPattern", "forbiddenPattern", "message"]) {
      if (typeof rule[key] !== "string" || rule[key] === "")
        return { error: `${at}: ${key} must be a non-empty string` };
    }
    try {
      rules.push({
        path: new RegExp(rule.pathPattern),
        content: new RegExp(rule.forbiddenPattern),
        message: rule.message,
      });
    } catch {
      return {
        error: `${at}: pathPattern or forbiddenPattern is not a valid regular expression`,
      };
    }
  }
  return { rules };
};

const field = MUTATORS[ev.tool_name];
if (field) {
  const configPath = findConfig();
  const { rules, error } = loadInvariants(configPath);

  // Fail closed: a config that is present but broken cannot be read as "no rules". Read stays unaffected —
  // an invariant is about content being written, so a broken one must not cut the agent off from the repo.
  // The reason names configPath, the file actually read: when the walk found it in an ancestor directory, a
  // project-relative constant would send the agent to fix a path that need not exist. error is a fixed phrase
  // built here, never the file's contents. (configPath is non-null in this branch — a null one loads as
  // "not configured" and yields no error.)
  if (error) {
    process.stderr.write(
      `Blocked by hook: invalid invariants configuration — ${configPath}: ${error}. Fix or remove that file; Edit, Write and NotebookEdit stay blocked until then.\n`,
    );
    process.exit(2);
  }

  const written = String(input[field] ?? "");
  for (const rule of rules) {
    if (rule.path.test(p) && rule.content.test(written)) {
      // message is guaranteed non-empty by validation above, so there is no placeholder reason to fall back to.
      process.stderr.write(`Blocked by hook: ${p} — ${rule.message}\n`);
      process.exit(2);
    }
  }
}
process.exit(0);
