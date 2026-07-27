# Brain Drain v2 — Rebuild Plan

> Self-contained build spec. Written to hand off to a fresh session. All key decisions are
> locked below; the "Open items" section at the end lists the only things still to confirm.

---

## 0. What Brain Drain is

An asynchronous multiplayer **strategy-conquest game** — Risk crossed with Wordle, in a covert
"war-room / intelligence agency" theme. You command **Minds** (not armies) across ~40 Risk-style
world regions. Each real-world day is one game **turn**: you solve daily puzzles to earn strategic
advantages, queue orders on the map during the day, and everything resolves in a single batch at
day's end.

The signature hook: the daily puzzle (retention loop, Wordle-style) is fused onto a persistent-world
4X conquest map. Puzzles are *diegetic* — framed as your operative's "calibration", not bolt-on
minigames.

Scoring metric: **GII (Global Influence Index)** = regions held + floor(total minds / 3) +
5 × continents held.

---

## 1. Why a fresh repo

v1 (this repo) is a working vertical slice but held together by dev scaffolding. Decision: **rebuild
in a fresh sibling repo**, port the few genuinely valuable pieces, rebuild the backend correctly.

**Port verbatim (the valuable assets):**
- `components/GameMap.tsx` — the hardest, most valuable code. TopoJSON → region merging via
  `GEO_TO_GAME_ID` (collapses dozens of ISO codes into ~40 regions), centroid computation for troop
  markers, hand-drawn `SEA_ROUTES` whitelist, ownership/selection coloring. Front-end and
  architecture-agnostic — carries across untouched (minus the type fixes noted below).
- `simulate_combat.js` — real Monte Carlo balance harness (10k runs). Already models the
  **attacker-bonus-dice** mode we need for the Combat puzzle. Keep and reuse for tuning.
- The **idea + theme + GII scoring** — the actual asset.
- Region graph data (`countries` rows: id, name, continent, connections[]) — re-seed into new DB.

**Fix / rebuild (v1's real problems):**
- Turn engine was a **dev API route using the anon key**, triggered by an open, unauthenticated red
  "FORCE RESOLUTION" button. → Replace with a secured, cron-triggered resolution + an admin-guarded
  test trigger.
- **No RLS.** Clients could write `map_state` directly. → RLS on everything.
- **`.env.local` committed to git** (service role key in history). → Rotate keys; never commit
  secrets in v2.
- AI opponents were faked (`spawn_rival.js` just plops minds on a region). → out of scope for the
  first cut; note as future work.
- Loose types (`any` everywhere; `Order.order_type` said `'transfer'|'attack'` while code used
  `'explore'`). → proper types in v2.
- Trivia was a hardcoded `"Generated Question"` placeholder. → replaced by the real 3-puzzle system.

---

## 2. Locked design decisions

| Decision | Choice |
|---|---|
| Backend | **Supabase** (Postgres + Auth), server-authoritative, RLS |
| Repo | Fresh sibling repo (keep v1 as reference) |
| Puzzle count | **3 per day**, server-seeded, identical for all players |
| Puzzle #1 (Word) | **Cipher** — Wordle-style → powers **Initiative** |
| Puzzle #2 (Numbers) | **Supply Run** — Numbers Target / Countdown → powers **Economy** |
| Puzzle #3 (Tactics) | **Cipher Break** — Codebreaker / Mastermind → powers **Combat** |
| Advantage model | **Distinct pillars** — each puzzle powers one lever (Speed / Supply / Combat) |
| Art direction | **Command Console** — clean light theme, polished |
| Turn trigger | **Scheduled cron** for the real daily tick + an **admin-guarded manual test trigger** |
| Puzzle security | **Server-side guess validation** — solutions never sent to the client (assumed; see Open items) |

---

## 3. Stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Supabase — `@supabase/ssr` (browser + server clients), service-role client for resolution only
- Map: `react-simple-maps` + `d3-geo` + `topojson-client` (+ `@types/*`)
- `lucide-react` icons
- `framer-motion` for transitions/polish
- Clean `.gitignore` (`.env*` ignored) from the first commit; rotate all Supabase keys.

---

## 4. Data model

Tables (Postgres / Supabase):

- `profiles` — `id` (FK → auth.users), `username`, `created_at`
- `countries` — `id` (text PK, e.g. `turkey`), `name`, `continent`, `connections` (text[]). Static
  region graph. Re-seed from v1.
- `map_state` — `country_id` (FK), `owner_id` (FK → auth.users, nullable = neutral), `minds` (int)
- `orders` — `id`, `user_id`, `day_number`, `source_country_id`, `target_country_id`, `minds`,
  `order_type` (`'transfer' | 'explore' | 'attack'`), `created_at`
- `game_logs` — `id`, `day_number`, `message`, `type` (`'info' | 'combat' | 'conquest'`), `created_at`
- `daily_puzzles` — `day_number` (PK), plus **server-only solution columns**:
  - `word_solution` (text)
  - `numbers_puzzle` (jsonb: `{ target, numbers: number[] }`) — target is public, but store here
  - `code_solution` (jsonb: `{ symbols: string[] }`)
  - Public-safe fields (numbers/target, word length, symbol palette) can be exposed; **solutions
    are not**.
- `daily_performance` — `user_id`, `day_number`, `word_tier`, `numbers_tier`, `code_tier`,
  per-puzzle completion timestamps. UNIQUE(`user_id`, `day_number`).
- `global_settings` — `key`/`value` (e.g. `current_day`, resolution status/lock).

---

## 5. Security model (the core rebuild)

- **RLS on every table.**
  - Clients may **read**: `map_state`, `game_logs`, `countries`, their own `orders`, their own
    `daily_performance`, and the **public-safe** parts of `daily_puzzles`.
  - Clients may **write**: only their own `orders` — and a policy check enforces the source region is
    owned by them. Clients may **never** write `map_state` or `daily_performance` directly.
- **Puzzle solutions are server-only.** `daily_puzzles` solution columns are not exposed via RLS.
  Guesses go to a server route (`/api/puzzle/guess`) that holds the solution, returns only feedback
  (Wordle colors / Mastermind pegs / target delta), and on completion writes the earned tier to
  `daily_performance`. → **No cheating by reading the answer in devtools.** Important now that
  puzzles grant real advantage.
- **Resolution** runs server-side only, with the service-role key, never exposed to the client.

---

## 6. The three puzzles (concrete rules)

| Puzzle | Rules | Tiers | Pillar effect |
|---|---|---|---|
| **Cipher** (word) | 5 letters, 6 guesses, Wordle coloring | ≤2 → T1, ≤4 → T2, ≤6 → T3, fail → none | **Initiative:** T1 orders resolve before T2 before T3 (first strike). Tie-break within a tier by completion timestamp. |
| **Supply Run** (numbers) | Reach target from 6 numbers using + − × ÷ | exact → T1, within ±5 → T2, within ±25 → T3 | **Economy:** +5 / +3 / +1 bonus draft minds to your frontline this turn |
| **Cipher Break** (codebreaker) | 4 symbols drawn from 6, 6 guesses, Mastermind pegs (exact / wrong-spot) | ≤2 → T1, ≤4 → T2, ≤6 → T3 | **Combat:** attacker rolls +2 / +1 / +0 extra dice for that day's attacks |

Tier values above are starting points — tune with `simulate_combat.js` (esp. the combat dice bonus).

---

## 7. Combat & economy mechanics (port + extend from v1)

**Combat** — Risk-style "Total War" dice (from v1 / `simulate_combat.js`):
- Both sides roll one d6 per unit, sort descending, pair off; higher wins; **ties go to defender**;
  loop until one side is annihilated.
- v2 extension: attacker gets **+N extra dice** where N = attacker's Combat-puzzle tier bonus
  (T1 = +2, T2 = +1, T3 = 0). `simulate_combat.js` already has an attacker-bonus mode — reuse it.

**Explore vs Attack** (keep v1's good instinct):
- Neutral region with population P: send `minds >= P` → **peaceful annex**, convert `floor(P/2)` locals
  into troops. Sending `< P` → bounce/refund.
- Attacking a **player** → the bloody dice combat above.

**Economy phase** (port from v1, extend):
- +1 passive to every owned region.
- Frontline draft: +3 distributed to regions bordering enemy/neutral land (via `connections` graph).
- v2 extension: **+ the player's Economy-puzzle tier bonus** (+5/+3/+1) added to the frontline draft.

---

## 8. Turn engine

- **Real tick:** Vercel Cron → `POST /api/resolve`, guarded by a `CRON_SECRET` header. One
  resolution per real day.
- **Test hatch:** the same resolution logic reachable via an **admin-guarded** manual trigger
  (checks a dev secret / the developer's user id) — for forcing resolution during development.
  NOT an open anon endpoint like v1's red button.

**Resolution pipeline (order matters):**
1. Load all `orders`, **sorted by each player's Initiative tier** (T1 first; tie-break by puzzle
   completion time). This is what makes calibration matter — a T1 player strikes before a T3 player's
   own move leaves.
2. **Combat / explore / transfer**, applying each attacker's **Combat-tier bonus dice**.
3. **Economy phase** (passive + frontline draft + **Economy-tier bonus minds**).
4. Advance `current_day` → **seed tomorrow's 3 puzzles** (server-generated, identical for all
   players) → write `game_logs`.

---

## 9. UI — Command Console (clean light, polished)

- Polished light theme: crisp white cards on light slate, teal + amber accents.
- **Three-pillar status strip** — Initiative ●● / Economy ● / Combat ●● — so the day's active buffs
  are visible at a glance.
- Ported glowing region map as the centerpiece (light ocean, pastel regions, ownership coloring).
- Three puzzle modals sharing one consistent "protocol" frame.
- `framer-motion` for smooth transitions; animated resolution log.
- Keep v1's overall 2-8-2 layout (actions/stats · map · comms/logs) but rebuilt and refined.

---

## 10. Build order

1. Scaffold repo + Supabase schema + RLS migrations + seed the region graph (`countries` + initial
   `map_state`).
2. Auth (login/register w/ access code) + Command Console shell + **port `GameMap.tsx`**.
3. Order flow (issue / queue / cancel) enforced by RLS.
4. The 3 puzzle components + **server-side guess validation** (`/api/puzzle/guess`) + tiering into
   `daily_performance`.
5. Resolution route (initiative-ordered, bonus-aware) + Vercel Cron + admin test hatch.
6. Polish pass (motion, pillar strip, log animations) + balance-tune combat with `simulate_combat.js`.

---

## 11. Open items (confirm at start of build session)

1. **Repo location / name.** Suggested: `C:\Users\AzizCanCengiz\brain-drain-v2` (sibling to this repo,
   keeps v1 as reference). Confirm or pick another.
2. **Security approach.** Plan assumes **server-side guess validation** (solutions never leave the
   server) — the "done right" version, more work than v1's client-side check. Confirm, or fall back to
   the simpler client-side check for a first ship.
3. **Key rotation.** v1's `.env.local` (with the Supabase service-role key) is in this repo's git
   history. Rotate the Supabase keys before/while standing up v2. Decide whether v2 reuses the same
   Supabase project (new schema) or a brand-new project.

---

## 12. Reference — v1 files worth reading before building

- `components/GameMap.tsx` — the map renderer to port (region merge, centroids, sea routes).
- `simulate_combat.js` — combat balance harness (has the attacker-bonus-dice mode).
- `app/api/dev/end-day/route.ts` — v1's resolution logic (combat + explore + economy + day advance).
  Rebuild this securely; the *mechanics* are the reference, the *architecture* is not.
- `app/page.tsx` — GII calculation (`calculateGII`) and overall layout.
- `components/OrderModal.tsx` — order submission + client-side combat odds simulation.
