# Subagents

A subagent runs in its **own context window** and returns only its final reply to the main session.
That is the whole point of `spec-reviewer`: a careful review reads a lot and produces a long
transcript, and none of that transcript belongs in the window where the actual work continues. The
main session pays for the answer, not for the reading.

`spec-reviewer` is read-only by construction — its `tools:` line grants `Read`, `Grep` and `Glob`
and nothing else, so it cannot edit a file, run a command, or touch the working tree even if it is
asked to. It reports; you decide. And its reply is bounded on purpose: at most eight discrepancies
and at most four decisions, one line each. A reviewer that returns four screens of prose has moved
the problem into the main window instead of solving it.

## Calling it

Name the target and name the specification sources in the request itself. The agent reads those files
and nothing else, so an unnamed source is a source it will not open:

```
Use the spec-reviewer subagent to review lib/pricing.py against docs/pricing-spec.md
and fixtures/pricing-cases.json.
```

Two sources, one target, no invitation to go looking around the repository. A request that names no
specification source comes back as one line saying so — that is deliberate, because reviewing a file
against a specification nobody chose produces confident nonsense.

The project rules from `CLAUDE.md` / `AGENTS.md` already reach the subagent with its startup context,
so the request does not need to repeat them and the agent is told not to re-read them.

## Cost

`model: inherit` means the subagent runs on whatever model the main session uses. A review of a small
file against a short spec rarely needs that: in a project where this agent runs often, replace the
line with a specific cheaper model. Keep `tools:` as it is — that line is what makes the agent
read-only.
