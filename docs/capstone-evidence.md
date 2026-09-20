# Capstone evidence

A reviewer-oriented map from each claimed practice to the files and commits that evidence it. Everything
cited is a tracked file or a commit body in this repository — nothing here depends on a conversation
transcript.

**There is no git remote yet.** Commit SHAs are given in code formatting and can be read locally with
`git show <sha>`; they are not clickable links, and will not become links until the repository is published.
File paths are relative links and work in any Markdown viewer.

## Claimed

1. [Context engineering](#1-context-engineering)
2. [Verification](#2-verification)
3. [maker ≠ checker](#3-maker--checker)
4. [Specification-driven development](#4-specification-driven-development)
5. [An early autonomy-log experiment, scoped to sessions 01–02](#5-early-autonomy-log-experiment-sessions-0102-only)

## Not claimed

- **Loop engineering — not claimed.** No executable autonomous agent loop exists in this repository. There is
  no scheduler, cron entry, watcher or self-continuing runner in [`.claude/`](../.claude/),
  [`scripts/`](../scripts/) or [`package.json`](../package.json). The `opsx` commands under
  [`.claude/commands/opsx/`](../.claude/commands/opsx/) are human-invoked slash commands; the
  propose → apply → review → archive cycle was driven turn by turn by a person, which is not a loop.
- **Project Factory — not claimed.** It was not used, and the repository contains no trace of it.

---

## 1. Context engineering

**What was done.** Rules, product context and per-artifact constraints are separated by lifetime, and the
rules the agent must follow are enforced by hooks rather than stated and hoped for.

| Evidence | What it holds |
| --- | --- |
| [`CLAUDE.md`](../CLAUDE.md) | one line, `@AGENTS.md` — a single source, imported rather than duplicated |
| [`AGENTS.md`](../AGENTS.md) | the working agreement: package manager from the lockfile, never read secrets, no destructive commands, run the project's own checks, OpenSpec rules |
| [`docs/product-plan.md`](product-plan.md) | scope, MVP flow, product invariants, the authoritative statistics rules |
| [`docs/architecture.md`](architecture.md) | where code goes and how it is written |
| [`design/README.md`](../design/README.md) | an explicit source-precedence order for the design assets |
| [`openspec/config.yaml`](../openspec/config.yaml) | `context:` plus artifact-scoped `rules:`, injected only while that artifact is written |
| [`.claude/settings.json`](../.claude/settings.json) | allow / ask / deny permissions and three hook stages |
| [`.claude/hooks/`](../.claude/hooks/) | `protect-env.mjs`, `log-action.mjs`, `log-filter.mjs` |

**Commits.** `ae42495` chore: add OpenSpec workflow and validation · `cb9f47f` docs: define statistics and
architecture.

**What it proves.** The static/dynamic split is real: `AGENTS.md` loads every session, while
`openspec/config.yaml` supplies context and rules only for the artifact being written. And the rules are
enforced, not advisory — §10 of `AGENTS.md` forbids reading the raw agent log, and
[`.claude/hooks/log-filter.mjs`](../.claude/hooks/log-filter.mjs) rewrites such a read to the summary
command, so the rule holds even when an agent ignores it.

---

## 2. Verification

**What was done.** One composite gate, and domain work written red-first.

| Evidence | What it holds |
| --- | --- |
| [`package.json`](../package.json) | `check` = `typecheck && lint && test && hooks:selftest && spec:check` |
| [`scripts/spec-check.mjs`](../scripts/spec-check.mjs) | fails on an empty spec tree, on an archived change with unfinished tasks, and on any bare `openspec` call — cases `openspec validate` alone lets through |
| [`scripts/hooks-selftest.mjs`](../scripts/hooks-selftest.mjs) | asserts the repository's own hooks still behave |
| `lib/**`, `components/**` | **113 tests across 9 files**, all passing |

**Red-to-green chain.**

- `7f580d6` **test: define estimate statistics behavior** — the commit body states the run is *"intentionally
  red: formatDuration and calculateRoundStatistics carry placeholder bodies, so every failure is an assertion
  diff or a missing throw, never a missing module"*.
- `7391f7f` **feat: implement estimate statistics** — the same tests, now green.

**What it proves.** Failure was demonstrated before implementation, and the distinction between a behavioural
red and a structural one (a missing import) was made explicit and held to. Later commits go further and prove
a *test* can fail: `4416066`, `231c309` and `a768c5f` each record a temporary mutation and quote the
resulting failure before restoring the code.

**Limitation.** Every gate runs locally. There is no continuous integration in this repository.

---

## 3. maker ≠ checker

**What was done.** A read-only reviewer, separate from the agent that wrote the code, reviewed each change
before it was archived — and a human ran browser walkthroughs independently of both.

[`.claude/agents/spec-reviewer.md`](../.claude/agents/spec-reviewer.md) is read-only **by construction**: its
`tools:` line grants `Read`, `Grep` and `Glob` and nothing else, so it cannot edit a file or run a command
even if asked. [`.claude/agents/README.md`](../.claude/agents/README.md) explains the separate context window
and the deliberately bounded reply.

| Commit | Finding, in the commit's own words |
| --- | --- |
| `9765762` test: strengthen estimate statistics coverage | *"The Overall scenario previously gave each role one vote, so folding Overall out of the role aggregates produced an identical result and no test could fail for it."* |
| `07e228e` docs: correct statistics type guarantees | *"The checker review found the retracted compile-time claim still live in two places"* — a documented TypeScript guarantee that did not hold |
| `659637a` fix: disable reveal after cards are shown | found by a **human browser walkthrough**: *"A revealed round left 'Reveal cards' enabled, so it could be clicked again."* |
| `4416066` test: make reset selection coverage non-vacuous | *"…reselected a voter before asserting, so it never depended on the selection surviving: resetting actingVoterId in handleReset would have kept the suite green."* |
| `231c309` test: strengthen configurable setup coverage | *"Independent pre-archive review found four assertions that would survive the regression they were meant to catch"* — found while 112 of 112 tests were passing |
| `a768c5f` test: prove setup validation is pure | the reviewer found `validateSetup` purity required by the specification but never tested |

**What it proves.** This is the practice with the strongest evidence here. **A green suite was twice shown to
be insufficient** — at `4416066` and again at `231c309`, where 112/112 tests passed and the reviewer still
found assertions that could not fail. Two independent checker types were used: an automated read-only
subagent, and a human walkthrough that caught a defect (`659637a`) no test covered at all.

---

## 4. Specification-driven development

**What was done.** Every feature began as an OpenSpec change — proposal, delta specs, design, tasks —
committed *before* any implementation commit.

**Specification precedes implementation, in all three changes:**

| Specification | Then tests / implementation |
| --- | --- |
| `106fb5e` spec: define estimate statistics change | → `7f580d6` test (red) → `7391f7f` feat |
| `ce067ba` spec: define local round demo | → `010fe0a` feat: add local round state → `d85cbc9` feat: add local planning poker demo |
| `1d1843a` spec: define configurable round setup | → `8124973` feat: add task setup and round start → `e3c9da3` feat: add configurable participant roster |

**Archived, with the canonical specs synced:** `56af912` spec: archive estimate statistics change ·
`806b6e7` spec: archive local round demo · `127fead` spec: archive configurable round setup. The result is
the four capabilities in [`openspec/specs/`](../openspec/specs/) and three complete change histories in
[`openspec/changes/archive/`](../openspec/changes/archive/).

**Specifications changed when evidence contradicted them — they were not decoration:**

- `010fe0a` amended **both** delta specs mid-implementation after the design source disagreed with them: the
  Away toggle-off case *"which the design export defines (planning-poker.html:705) but neither spec had
  covered"*.
- `659637a` strengthened the Reveal requirement and added a scenario after the human walkthrough found the
  defect — the specification was corrected alongside the code.
- `127fead` renamed a canonical requirement whose title had become false, applying a `RENAMED` + `MODIFIED`
  delta so that `### Requirement: The room opens on a fixed task and a seeded roster` became
  `### Requirement: The round opens with the configured task and roster`, with all pre-existing scenarios
  preserved.

**What it proves.** Specifications were the source of truth and were maintained against it: when reality, a
design source or a human reviewer contradicted a spec, the spec was revised rather than quietly ignored.

---

## 5. Early autonomy-log experiment (sessions 01–02 only)

**What was done.** [`docs/autonomy-log.md`](autonomy-log.md) records the first two working sessions
(2026-09-12): what the agent knew, what it proposed, what the human decided, and one case where the agent was
wrong and the human stopped it — a proposed average of `4.6` where the correct value was `4.7`, after which
the file was never written.

**Commit.** `454a35b` 02 document agent autonomy.

**What it proves.** That the agent's boundaries were examined explicitly at the start, and that a rejected
proposal was recorded rather than forgotten.

**Scope, stated plainly.** The log covers sessions 01–02 only. It was **not** maintained through the three
OpenSpec changes that followed, and it must not be read as a full-project autonomy history. The log itself
carries the same note. The raw per-tool log it originally cited, `.agent-log/actions.jsonl`, is deliberately
gitignored as local state, so it is not available in a fresh clone; `pnpm agent:log` renders a summary from
it when it exists locally.

---

## Human decisions versus agent work

| The human | The agent |
| --- | --- |
| Chose the product and set the MVP boundary | Produced the OpenSpec artifacts: proposals, delta specs, designs, task lists |
| Approved the product and statistics rules in [`docs/product-plan.md`](product-plan.md) | Implemented the domain and the UI against those specs |
| **Rejected an invented Observer surname**, requiring the label `Kateryna H.` because the design screenshots truncate it | Wrote the tests, including the red-first ones |
| Ran the browser walkthroughs, and found the Reveal defect (`659637a`) | Ran the deterministic gates and reported their output |
| Decided which reviewer findings were blocking and which could be deferred | A separate read-only reviewer subagent challenged the maker's output |

The deterministic gates supplied evidence; they did not replace judgement. `pnpm check` was green at the
moment the reviewer found a vacuous test (`4416066`) and again when it found four weak assertions
(`231c309`), and it was a human walkthrough — not a test — that found the Reveal defect. Every decision about
scope, about which findings blocked an archive, and about what the product should do, was made by the human.
