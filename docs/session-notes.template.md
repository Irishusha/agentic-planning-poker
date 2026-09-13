# Session notes — YYYY-MM-DD

State at the end of the session. Written for whoever opens the next one — assume they remember nothing
and can see only this file and the repository.

Copy this template to `docs/session-notes.md` (or a dated file beside it) and fill it in. Keep every
claim checkable: a file path, a command, an exit code. Leave a section out only if it is genuinely
empty, and say so rather than deleting the heading.

## Session state

- **Branch:** `<branch>`
- **Last commit:** `<short sha> <subject>`
- **Working tree:** clean — or list what is uncommitted and what is untracked, by path, and say which
  of the two each one is. Anything not committed is invisible to the next session's `git log`.

## Completed

One entry per finished piece of work:

- **`<path>`** — what it now does, and how it was verified. Say whether it is committed, and in which
  commit. A change that is done but uncommitted belongs here *and* in Session state.

## Not working / blockers

What was attempted and did not land, and why. Name the thing that blocked it — a failing check with
its output, a rule or hook that refused the change (with the file and line), a service that would not
connect, a decision that was not yours to make. Include what the next session would see if it simply
retried, so nobody spends an hour rediscovering it.

## Open decisions

Choices that are proposed but **not** confirmed. For each: what was decided provisionally, the
alternative, and who has to confirm. Nothing here has been acted on without instruction — if it was
acted on, it belongs in Completed instead.

## Start next session with

An ordered list, most important first. Each item says what to do and what "done" looks like for it.
Include cleanup the session leaves behind: uncommitted work to commit or revert, a temporary change to
undo, a follow-up to schedule.

## Last verified checks

The exact commands, their real results and their exit codes — never a check that was not run, and
never a softened failure:

```
$ <command>
<the result, trimmed to what matters>
EXIT=<code>
```
