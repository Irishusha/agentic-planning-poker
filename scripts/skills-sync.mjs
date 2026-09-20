#!/usr/bin/env node
// Copy every skill from the shared .agents/skills/ folder (read by Cursor, Codex, Copilot, Gemini CLI, Amp)
// into .claude/skills/ (the only project folder Claude Code reads). Idempotent; run: pnpm skills:sync
// Why a copy and not a symlink: symlinks on Windows need Developer Mode / admin, copies work everywhere.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

// OpenSpec writes its own skills into BOTH folders and the two copies differ on purpose: the .agents/ copy
// tells Codex `$openspec-apply-change`, the .claude/ copy tells Claude Code `/opsx:apply`. Syncing one over
// the other would hand Claude Code the Codex wording. These entries belong to OpenSpec — refresh them with
// `pnpm exec openspec init` / `update`, never from here. `.openspec-target` is OpenSpec's own marker file.
const isOpenSpecManaged = (name) => name.startsWith("openspec-") || name === ".openspec-target";

const src = join(process.cwd(), ".agents", "skills");
const dst = join(process.cwd(), ".claude", "skills");
if (!existsSync(src)) {
  console.error("No .agents/skills/ folder found.");
  process.exit(2);
}
mkdirSync(dst, { recursive: true });
let n = 0;
let skipped = 0;
for (const name of readdirSync(src)) {
  // Before any read or delete of the destination: an OpenSpec entry is never touched, only reported.
  if (isOpenSpecManaged(name)) {
    skipped++;
    console.log(`skipped ${name}  (OpenSpec-managed)`);
    continue;
  }
  const from = join(src, name);
  if (!statSync(from).isDirectory() || !existsSync(join(from, "SKILL.md"))) continue;
  const to = join(dst, name);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
  n++;
  console.log(`synced  ${name}`);
}
console.log(`${n} skill(s) -> .claude/skills/`);
if (skipped > 0) console.log(`${skipped} OpenSpec-managed entr${skipped === 1 ? "y" : "ies"} left to OpenSpec`);
