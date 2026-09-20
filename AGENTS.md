<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent working agreement

Universal rules for any coding agent working in this repository (Claude Code, Cursor, Codex, Copilot,
Gemini CLI, Amp). They describe *how* to work here, not *what* the project is built with — inspect the
repository itself to learn the stack.

## 1. Read first, explore second, act third

Read this file and any other instruction file the repository carries (`CLAUDE.md`, `README.md`, docs the
user points at) before the first edit. Then look at the real code: directory layout, config files, existing
conventions, neighbouring code. Prefer evidence from the repository over assumptions about it.

Product rules live in `docs/product-plan.md`; code layout and implementation conventions live in
`docs/architecture.md`. Read both before writing product code.

## 2. Plan before multi-file changes

For anything touching more than one file, present a short plan first — which files you intend to change and
what changes in each — and get agreement before editing. A single, clearly scoped edit needs no plan.

## 3. Never read or edit secrets

Do not read, edit, print, or copy `.env` files, credential stores, private keys, tokens, or anything else
holding real secrets. Edit `.env.example` instead and ask the user to update the real file themselves.
Never place a secret value into a commit, a log, a test fixture, or a chat message.

## 4. No destructive commands, no force push

Do not run recursive deletes, history rewrites, `git reset --hard`, `git clean -fd`, branch deletions,
`git push --force` or `git push -f`, or anything else that discards work which is not trivially recoverable.
If a task appears to require one, stop and explain what you would run and why, then let the user decide.

## 5. Do not overwrite the user's work

Treat uncommitted changes in the working tree as the user's. Do not revert, stash, reformat, or rewrite code
you were not asked to touch. Read a file's current contents before overwriting it; if it changed underneath
you, re-read it and merge rather than clobber.

## 6. Detect the package manager from the lockfile

`pnpm-lock.yaml` means pnpm, `package-lock.json` means npm, `yarn.lock` means yarn, `bun.lockb` or
`bun.lock` means bun. Use that one for every command in the project. If there is no lockfile, ask which to
use instead of guessing, and never introduce a second one.

## 7. Do not add dependencies without permission

Solve the problem with what the project already has. If a new dependency is genuinely required, ask first and
say what it is for and what it replaces. The same applies to removing or upgrading existing dependencies.

## 8. Run the checks the project already defines

Before reporting work as finished, run the verification the repository already has — lint, typecheck, tests,
build — exactly as its scripts or config declare them. Do not invent new commands and do not introduce new
tooling to make something checkable. If a given check does not exist here, say so rather than implying it
passed.

## 9. "Done" means exact commands and real results

When reporting completion, state the exact commands you ran and their actual outcome. Never claim a check
passed that you did not run, never soften or omit a failure, and never report partial work as complete. If
something is incomplete, blocked, or deliberately skipped, name which part and why.

## 10. Read the agent log through the summary, never raw

Do not pull `.agent-log/actions.jsonl` into the context window — it grows by roughly two records per tool call
and is mostly noise. Run `node scripts/agent-log-summary.mjs` instead; it answers the same questions in a few
lines. A `PreToolUse` hook rewrites raw dumps and reads of that file to the summary, so an attempt to read it
directly will not return what you asked for.
