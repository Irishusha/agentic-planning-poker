# Planning Poker — design spec (v1)

Source of truth: `Planning Poker.dc.html` (open in a browser — top bar switches screen + role).
The top "SCREEN / VIEW AS" bar is **design chrome only** — do not build it into the product.

## 1. Scope of v1

- Create a session (host) / join a session by room ID or link.
- Host writes the task (title + multiline description) into the room; everyone sees it live.
- Everyone votes with hidden cards; **only the host** reveals and resets.
- After reveal: every vote with the voter's name, lowest / highest / spread, and a per-role breakdown.
- Observer mode: chosen on join, cannot vote, sees everything.
- Mobile-first responsive; dark theme only; English UI.

Out of scope for v1: accounts, history, Jira integration, multiple rounds queue, chat.

## 2. Design tokens

| Token | Value |
|---|---|
| bg | `#0A0A0C` |
| surface | `#111116` |
| surface-sunken | `#0E0E13` |
| border | `#22222C` (inputs `#26262F`, cards `#2A2A35`) |
| text | `#ECECF1` |
| text-muted | `#9A9AAB` |
| text-dim | `#7A7A8C` / labels `#63637A` |
| accent | `#B07CFF` (gradient `linear-gradient(180deg,#B07CFF,#8B5CF6)`) |
| accent-surface | `#1B1522`, border `#4A3A66`, text `#D9C8F5` |
| accent-selected (active tab / voted badge) | bg `linear-gradient(180deg,#3C2A5E,#2B1F44)` or `#33244D`, border `#8B6BD6`/`#7C5CC4`, text `#F0E7FF` |
| positive (consensus) | `#7FD6AE` on `#121A16`, border `#2F4A3C` |

Radii: inputs/buttons `12px`, cards `14px`, panels `18px`, avatar `10px`.
Spacing scale: 6 / 10 / 14 / 18 / 20 px. Shadow on primary: `0 10px 30px rgba(139,92,246,.28)`.

Type: **Plus Jakarta Sans** (UI, 400–800) + **JetBrains Mono** (numbers, labels, IDs).
- H1 `800 40px/1.05`, card title `700 22px/1.3`, body `400 14.5px/1.65`
- Eyebrow labels: `700 10px` mono, `letter-spacing:.16em`, uppercase, `#7A7A8C`
- Estimate card value: `700 20px` mono; result value `700 26px` mono

## 3. Layout

- Page max-width `1240px`, padding `20px 16px`.
- Room = flex-wrap row: main column `flex:1 1 460px`, sidebar `flex:1 1 300px` → stacks under ~780px with no media queries.
- Estimate cards: `grid-template-columns: repeat(auto-fit, minmax(74px,1fr))`, card height `72px` (≥44px touch target).
- Result cards: `repeat(auto-fit,minmax(132px,1fr))`. Stats tiles: `minmax(120px,1fr)`.
- Everything fluid; no fixed widths, no `nowrap` on text blocks (names/IDs truncate with ellipsis).

## 4. Screens & states

### 4.1 Landing — Create new
Logo, title, subtitle ("Everyone shows their hand at once"), segmented tabs (Create / Join), fields: **Name**, **Role** (select), **Join as observer** (toggle card), **Estimation scale** (select), CTA `Create session`.

### 4.2 Landing — Join existing
Same, plus **Room ID** field first ("Enter room ID or paste full link"), no scale field, CTA `Join session`.

Roles list (fixed in v1): QA · Backend · Frontend · Business Analyst · PM.
Scales: Hours / days (default: 4h · 1d · 2d · 3d · 5d · 8d · 10d · 14d · ? ), Fibonacci, T-shirt.
Separate **☕ "Stepping out for coffee"** toggle under the card grid — it is a status, not an estimate: excluded from min/avg/max, badge in the list reads "☕ Away".

### 4.3 Room — waiting (empty state)
- Host sees the **task composer**: title input + description textarea + `Start round` (+ `Attach ticket link`). Badge "HOST ONLY".
- Non-host sees the task card placeholder and status "Waiting for the host to start the round".
- Sidebar shows joined people + dashed "Waiting for the team" block with the copyable room link.

### 4.4 Room — voting
- Task card (title + description); host gets `Edit task`.
- Voting card: eyebrow "CHOOSE YOUR ESTIMATE" + scale name in accent; card grid; selected card = accent gradient, dark text, lifted shadow.
- Status row: pulsing dot + `N of M voted · cards stay hidden until the host reveals`.
- Host controls: `Reveal cards` (primary) + `Reset votes` (ghost). Non-host sees only the status line.
- **Observer**: card grid is replaced by a dashed panel "You joined as an observer — voting is disabled for you." No vote is ever sent for observers; they are excluded from `M`.
- Sidebar participants are **grouped by role** (QA / Backend / Frontend / Business Analyst / PM) with a `voted/total` counter per group.
- Badge states: `Waiting` (neutral), `Voted` (bright accent `#241A3A` / border `#6B54A0` / text `#C9A6FF`, value hidden), `☕ Away`, `Observer` (dim).

### 4.5 Room — revealed
- Header: "RESULTS" + status chip `Consensus` (green) or `Needs discussion` (accent).
- Stats tiles: **Lowest** (+ who), **Average**, **Highest** (+ who), **Spread** (Highest minus Lowest in canonical hours, shown with the same hours/days formatting), **Votes**
  (the number of eligible numeric votes; `?`, Away and observers are excluded).
- **Per-role rows are the main content** — one row per role (QA / Backend / Frontend / Business Analyst / PM), stacked, so testing and development estimates read as separate numbers on the same task. Fixed three-column rhythm (role `1 1 148px` · track `999 1 190px` · result `0 0 96px`, min-height 52px) so every track has the same width and every result is aligned.
  - Role colours: QA `#5FD6B4`, Backend `#B07CFF`, Frontend `#5FA8FF`, Business Analyst `#FFB35C`, PM `#FF7EA8` — used only on the row's left border, its markers and its active range. Inactive track stays neutral `#1C1C25`.
  - Left: role name (ellipsis + title tooltip) + vote count in the role colour, pluralised `1 vote` / `2 votes`.
  - **Shared linear scale** for every role: `pos = ((value - minScale) / (maxScale - minScale)) * 100`, where minScale/maxScale are the team's lowest and highest votes (in hours).
  - Markers: a filled **circle** per distinct estimate (a value several people picked shows one circle with a small count badge); hovering gives the names, with the extremes labelled `Minimum · …` / `Maximum · …`. The average is a smaller **outlined diamond** at its exact position, tooltip `Average: 6.5d` — deliberately not circle-shaped so it never reads as someone's vote. Active range spans lowest→highest actual vote.
  - Right: `AVG` + value; single-vote roles show `EST` + value instead, one circle on the track, the voter's name next to it, and no range or average marker.
  - Number format: whole `2d`, decimal rounded to one place `4.7d`, no trailing `.0`.
  - Each marker carries its value as a label directly under the dot (in the role colour), so the row is readable without a separate axis; one line under the rows states "All roles use the same 1d–8d scale".
  - Names are never printed permanently for multi-vote roles — tooltips only.
- The participants sidebar stays visible on reveal (badges switch to the revealed values, rows go single-line, SESSION card hides) — never an inner scrollbar; the full task card collapses to one truncated line in the results header to keep the screen short.
- **Results are identical for everyone** — host, member and observer see exactly the same numbers, histograms and names.
- No round/next-task actions in v1 — the host uses `Reset votes` in the voting state to run the estimation again.
- Sidebar badges switch to the revealed value.

## 5. Behaviour rules

1. Votes are hidden from everyone (including the host) until reveal; only the boolean "has voted" is broadcast.
2. Only the host can: start a round, edit the task, reveal, reset, go to the next task.
3. `?` and `☕` count as "has voted" but are excluded from min / average / max / spread.
4. Reset clears all votes and hides the cards again; the task stays. No round counter in v1.
5. Observers: `canVote=false`, excluded from all stats and from the "N of M" counter, shown greyed in the list.
6. Late joiners see the current task and can still vote until reveal.
7. Room link `poker.company.io/r/<ROOM_ID>`; room ID format `PP-XXXXX`.

## 6. Data model (suggested)

```ts
Session { id, name, hostId, scale: 'hours'|'fibonacci'|'tshirt', revealed: boolean, task: Task | null }
Task    { title: string, description: string, tags?: string[], link?: string }
Participant { id, name, role: Role, isHost: boolean, isObserver: boolean, vote: CardId | null, away: boolean }
CardId  = '4h'|'1d'|'2d'|'3d'|'5d'|'8d'|'10d'|'14d'|'?'|'coffee'  // hours: 4,8,16,24,40,64,80,112
Role    = 'qa' | 'backend' | 'frontend' | 'ba' | 'pm'
```

Realtime events: `participant:join|leave`, `task:update`, `vote:cast` (value hidden, only flag broadcast), `vote:away`, `reveal`, `reset`.

## 7. Accessibility / QA

- Contrast: body text `#9A9AAB` on `#111116` ≈ 6:1; never drop text below `#7A7A8C` on surfaces.
- All tap targets ≥ 44px (estimate cards 72px, buttons 46–56px).
- Selected estimate must be distinguishable without colour alone (shadow + dark text + border).
- Focus state on inputs: border `#8B5CF6`. Keep a visible focus ring for keyboard users on buttons/cards.
- Native `<select>` dropdowns: `color-scheme: dark`, `accent-color: #B07CFF`, `option:checked` background `#33244D` — no default blue-on-white list.
- Hover-only info (voter names on the revealed chips) must also exist in the "By role" list for touch devices.
