# Spec: dev-ready pass on `shared search map`

## Goal

Make the four `shared search map` screens buildable by a developer without guesswork: consistent margins, semantic layer names, and every control a live instance of the design system rather than an orphan or a hand-drawn lookalike.

## Non-goals

- Not a visual redesign — the look is unchanged apart from margin corrections.
- Not touching the originals. Every fix lands on a duplicate; the originals stay as the reference.
- Not producing the missing `listing` artwork (see Open questions).
- Not reconciling these screens with master's `map-main` (separate fork, see Open questions).

## Constraints

- Section `shared search map` `34394:262052`, page **in design 🎨**.
- Duplicates sit in the **same section**, one row below their source at `y = 1000`, at the **same x** as the original so each fixed screen is directly under its source for comparison.
- Standard side margin in this file is **16px**; `top bar` already honoured it, so it is the reference.
- Buttons must be instances of `button` `9002:35138`. Never a FRAME shaped like a button.
- Text must carry a text style — but only an **exact** match (family, weight, size, line-height, letter-spacing).

## Compartments

### 1. Duplicates
- **Owns:** cloning the four frames into the section, naming, `clipsContent = true`.
- **Does NOT touch:** the four originals.
- **Done =** four new frames on page `in design 🎨` at `y=1000`, x `100 / 515 / 1150 / 1582`, each 375×812, suffixed `(fixed)`. ✅

| Original | Fixed duplicate |
|---|---|
| `map-main — default` `34394:262053` | `34394:263330` |
| `map-main — shared active` `34394:262140` | `34394:263346` |
| `favorites` `34394:263216` | `34394:263362` |
| `listing` `34394:263243` | `34394:263381` |

### 2. Margins
- **Owns:** bringing every container onto the 16px margin.
- **Does NOT touch:** the map background, `ios handle`, type sizes.
- **Done =** every direct child of each frame reports L16/R16 or is a full-bleed 0/0 layer, **except `listing bg (screenshot placeholder)`**, which the non-goals exclude. ✅
  *(Criterion corrected after the fact — as first written it was absolute and the placeholder failed it at L−26/R−27. The spec was the bug, not the work.)*

| Fix | Before | After |
|---|---|---|
| `bottom bar` width (both map screens) | 347, R12 | 343, R16 |
| `bottom bar` y (both map screens) | 724 → 11px above `ios handle` | 719 → 16px |
| `map controls` x (both map screens) | 329, R6 | 319, R16 |
| `shared search card` | 320 @ x28, R27 | 343 @ x16, R16 |
| `avatars` in `cards + avatars` | group ran to 360, R15 | 359, R16 |

### 3. Components
- **Owns:** replacing orphan-backed and detached buttons with live instances, preserving icon and label.
- **Does NOT touch:** `compass`, the `map` component, `iOS Toggle`.
- **Done =** zero instances whose main has no parent; zero FRAMEs named like buttons; every label and icon preserved. ✅

| Control | Was | Now |
|---|---|---|
| `favorites` › `manage` | detached FRAME 94×32 | instance, `type=secondary … size=small`, 94×32 hug, R16 |
| `listing` › `remove` | orphan `button/secondary/true/small/false/true` | instance, `size=small`, icon `icon/trash`, "Remove" |
| `listing` › `add person` | orphan `button/secondary/true/false/regular/true` | instance, `size=regular`, icon `icon/icon-add-favorites`, "Add another person", FILL 343 |

### 4. Layer names
- **Owns:** semantic names on originals *and* duplicates.
- **Done =** zero `Frame <digits>` / `Group <digits>` / `Rectangle <digits>` outside component instances. ✅ (22 renames; the three left in `listing` live inside instances and belong to their source components.)

### 5. Continuity + containers
- **Owns:** flow-level data consistency and containers narrower than their own content.
- **Done =** ✅
  - `favorites` map was `city=Kyiv` while the card beneath it read "221B Bakerstreet · Hoxton · £2,100" → switched to `city=London`.
  - `label` 81 → 110 wide, `person` 81 → 150 wide (both were narrower than the text inside them).

### 6. Constraints — *added by the critic pass*
- **Owns:** resize behaviour, so the screens survive a 393pt or 430pt device instead of stranding controls.
- **Does NOT touch:** any position at 375pt — constraints only apply when the parent resizes, and a re-measure confirmed every child is byte-identical after the change.
- **Done =** ✅ no direct child left on the default `MIN/MIN`.

| Layer | Constraint | Why |
|---|---|---|
| `map` | STRETCH / STRETCH | background fills the device |
| `top bar` | STRETCH / MIN | full-width, under the status bar |
| `bottom bar` | STRETCH / MAX | full-width, pinned to the bottom |
| `map controls` | MAX / CENTER | right-edge stack keeps its 16 margin |
| `manage` | MAX / MIN | right-aligned button keeps its 16 margin |
| `sheet` | STRETCH / MAX | spans the width, pinned bottom |
| `shared search card` | STRETCH / MIN | follows the 16 margins |

### 7. Content-driven pull-up sheets — *`favorites (fixed)` + `listing (fixed)`*
- **Owns:** replacing each decorative backdrop with a real auto-layout frame that carries its own fill, top-only radius and padding, and whose height comes from its content.
- **Does NOT touch:** the `map` background, the card contents, the two `map-main` screens (no sheet).
- **Done =** ✅ sheet is `VERTICAL` / `primaryAxisSizingMode: AUTO`; fill bound to `bird-blue` `34130:64305`; corners `24/24/0/0`; padding `24/16/34/16`; **hiding a row shrinks the sheet upward while its bottom stays flush at 812** (measured both ways, then restored).

| | Was | Now |
|---|---|---|
| `favorites` › `pullup` | GROUP wrapping an instance of shared component `pullup` `33:312`, whose rounded top is a baked **vector path** — cannot hug anything | auto-layout FRAME 375×**395** @y417, gap 16 |
| `listing` › `sheet` | plain RECTANGLE 375×421 parked behind the content, overhanging 40px | auto-layout FRAME 375×**313** @y499, gap 24 |

Supporting changes:
- **Screen frame becomes the bottom-pin.** Each screen is now `VERTICAL` with `primaryAxisAlignItems: MAX`; `map` and `ios handle` are `layoutPositioning: ABSOLUTE`, leaving the sheet as the only flow child. Without this the sheet's `y` was frozen and shrinking content lifted its bottom off the screen edge.
- **`manage` joined a `header` row** (HORIZONTAL, SPACE_BETWEEN, CENTER) with `title`, so it is right-aligned by layout instead of a hardcoded `x265`. No absolute positioning left inside either sheet.
- **`shared search card` wrapper dissolved** — it had no fill and no radius, so the sheet now plays that role directly and its three rows are direct children.
- **`ios handle` restored on `listing`** — the old one was pixels inside the screenshot that got replaced.

### 8. Horizontal card carousel — `favorites — carousel` `34402:263649`
- **Owns:** a duplicate of `favorites (fixed)` at `1150,1900` whose single card becomes a full-bleed horizontal strip.
- **Does NOT touch:** `favorites (fixed)` or any earlier frame.
- **Done =** ✅ 3 cards, strip content 872px against 375 visible, card-1 fully visible and card-2 peeking 71px before the bezel cuts it; no badge/text collision; sheet still hugs and sits bottom-flush.

| Piece | Value |
|---|---|
| Sheet padding | `24/0/34/0` + `clipsContent` — the strip escapes the side padding |
| `header` | own `0/16/0/16`, so title + `manage` stay on the 16 margin |
| `carousel` | FILL 375, `paddingLeft 16`, `paddingRight 0`, gap 8 |
| Cards | 280×231 at x 16 / 304 / 592 — `photo` is STRETCH so it holds its 1.37 aspect (280×205) |
| Badges | `badge-1..3`, `layoutPositioning: ABSOLUTE`, on each photo's bottom-right, inset 8 |

Two problems caught by measuring rather than looking:
- **`card-2`'s address collided with its badge by 1px** (and card-1 had only 11px clearance) — the 280 card can't fit a hugging address plus a 52px pill on one row. Fixed by moving the badge up onto the photo, which is also the conventional placement.
- **Attempts to make the address truncate silently failed** — the text node refused to resize past 84px even with `textAutoResize: NONE`, so it was reverted to `WIDTH_AND_HEIGHT`. Current addresses measure 217/229/210 against a 280 card, so nothing overflows today, but a longer address still could.

### 9. `partner-action` component + a boolean on the card set
Reference: `house 23234234` `33238:52717` on **in development 🔨**, which carries ~8 hand-built copies of the pill.

- **Owns:** a new `partner-action` component set, and a `partner action` boolean on the shared `card` set `9307:144`.
- **Does NOT touch:** the card's existing `state` property or any existing instance's appearance — all pre-existing instances resolve to `partner action=false`, verified on the `house` screen.
- **Done =** ✅ `partner-action` `34402:263727` on `Symbols 💠` with `action = viewed | liked | passed`, all fills bound; `card` set healthy at 8 variants with two clean properties; the carousel renders the pill from the component with zero manual overlays.

**`partner-action` `34402:263727`** — 52×32, radius 88, HORIZONTAL, pad 4, `MIN/CENTER`, `icon` 20 + `avatar` 24:

| Variant | Icon | Fill |
|---|---|---|
| `action=viewed` | `icon/eyes` `25687:59875` | `white 20% (alpha)` `34240:68165` |
| `action=liked` | `icon/favorite` `33:139` | `yellow` `34220:232254` |
| `action=passed` | `icon/dislike` `3222:102` | `white 20% (alpha)` |

Built by cloning a real pill off the `house` screen so the avatar's image fill survived, then normalising the geometry the hand-made copies had drifted on — the neutral fill was **0.2 on one copy and 0.13 on others**, and one sat at a 17px right inset instead of 0. The set was given a `bird-blue` background so the white-on-white variants are legible in `Symbols 💠`.

**A source now exists but nothing was migrated to it.** A file sweep counts **27 hand-built pills still live** (11 on `in development 🔨`, 16 on `in design 🎨`); this pass retired none of them. Migration is a separate job, and it would lose the reference's **63×32 two-avatar pill**, which has no component equivalent because `people = one | both` was scoped down to `one`.

**`card` `9307:144`** — `state` (4) × `partner action` (`false | true`) = 8 variants. Each `=true` variant nests a `partner-action` instance at **`x = width − 52`, `y = height − 34`**, constraints `MAX/MAX`.

Placement was measured off the reference rather than guessed — and my first attempt was **wrong**: I put the pill on the photo to dodge a text collision, but the reference reports `onPhoto: false`, right inset **0**, and the pill bottom 1–4px above the card bottom, vertically level with the price. Corrected to match. The real cause of the collision was my own invented card-2 address (229px against 220px of available room); shortened to `14 Rivington St · £2,450` (152px). Clearances are now 11 / 76 / 18px.

### 10. `card` becomes three independent toggles
- **Owns:** replacing the card set's `state` enum with booleans, so any combination is reachable — including all-off.
- **Does NOT touch:** how any existing instance renders.
- **Done =** ✅ `subtitle=true|false · favorite=false|true · partner action=false|true`, 8 variants, **0 broken instances out of 802**, and every `favorite=true` variant renders a heart that is actually visible.

**The 799-instance migration I warned about was unnecessary.** I tested the rename on a throwaway clone first: the instance followed automatically and kept its heart, because an instance references the component *node*, and Figma re-derives its property assignment from the new name. No capture-and-reapply was needed. Post-sweep: 802 instances, zero with missing or stale properties.

`state4` (favorite + an `img-indicators` dots strip) had **zero instances anywhere**, so its two variants were removed and their slot reused for the missing `subtitle` × `favorite` combination. The dots strip is the one capability dropped.

**Two bugs caught by rendering, not by data:**

1. **`with subtitle` does not mean "has a favorite".** Its heart node exists but the inner vector `For You (Stroke)` is `visible=false` — the glyph is switched off by an override. My first mapping read the node's presence and marked it `favorite=true`, which would have mislabelled 36 live instances. Corrected: that variant is `favorite=false` with the dead heart node removed, and a real `favorite=true` twin was built with a visible glyph. Data said "ok" for all 8; only the render exposed it.
2. **Variant grid order desynced** — I swapped names between two nodes without swapping their x positions, so the subtitle+heart variant sat in column 3. Cosmetic, re-gridded.

**The offset the user spotted.** In `subtitle=true` variants the auto-layout chain hugged instead of filled, so at the carousel's 280px the 164-wide content block was centred — a ~68px indent that also slid the address under the pill. Fixed by filling the chain and, better, moving the pill **into** the text row as a layout child so it reserves its own width:

| Combination | Text block | Reserved |
|---|---|---|
| `fav=false, pa=false` | 164 | — |
| `fav=false, pa=true` | 112 | pill 52 |
| `fav=true, pa=false` | 144 | heart 20 |
| `fav=true, pa=true` | 92 | heart 20 + pill 52 |

Price and subtitle are now `FILL` with `textTruncation: ENDING, maxLines: 1`, so long content ellipsizes instead of running under the pill. At 280px: text inset **0**, text width 228, pill at 228 — flush, no overlap.

### 11. Full map-control stack on master
Target: `map-main — default (fixed) 12` `34402:265171`, section `map` `34394:261510`, page **master 🟢** — the fixed version the user promoted to master themselves, which retires the earlier "fix master then re-copy" fork.

- **Owns:** growing `map controls` from 2 buttons to 7, in three named clusters.
- **Does NOT touch:** `map`, `top bar`, `bottom bar`, `ios handle` — re-measured, all still at their original positions.
- **Done =** ✅ `map controls` 40×464 @319,231, right margin **16**, bottom **695** (24px clear of the bottom bar at 719), top clear of `top bar`; every button an instance of `type=glass … size=medium … round=true` `34394:262001`; zero orphans; all six icons render.

| Cluster | Buttons | Icon |
|---|---|---|
| `view` (gap 12) | `2d` · `zoom in` · `zoom out` | `icon/2d` · `icon/plus` · `icon/minus` |
| `tools` (gap 12) | `draw` · `work` | `icon/pencil` · `icon/work` |
| `locate` (gap 12) | `compass` · `locate me` | — · `icon/location` |

Cluster spacing 68, derived by measuring the reference crop (~12 within, ~68 between). Every icon already existed in the library — nothing was drawn by hand. The briefcase's yellow ring was judged a screenshot artifact and not reproduced. Backup before editing master: `map-main — pre-buttons backup` `34402:265258` on the `figmosha` page.

## Confirmed decisions

1. **Duplicates in the same section**, aligned under their sources rather than in a tidy even row — vertical comparison beats even gaps.
2. **16px is the margin**, so `shared search card` widened 320 → 343 rather than being nudged to a symmetric 28. Every other container in the flow uses 16.
3. **`manage` becomes `secondary`, not `glass`** — it sits on a pullup sheet, not on the map. Side effect: fill goes from an unbound white 10% to the component's bound `white 20% (opaque)`.
4. **The three Medium-weight labels stay unstyled.** No near-match was attached (see Open questions).

5. **`bottom bar` gaps are now derived, not integer.** At 347 wide the original got an exact 41px gap by paying for it with a 12px right margin. At 343 the same four 56px buttons leave 119 over three gaps = **39.67**, so button x positions read 0 / 95.67 / 191.33 / 287. Kept anyway: `SPACE_BETWEEN` is the correct primitive, a dev implements it as `space-between` and never hardcodes the number. Revert to 347/R12 only if someone is reading coordinates off the file by hand.

## Open questions

- **The type system has no Medium weight at 14/18/20.** `Notifications` (Medium 20), `Maria` (Medium 18), `Accepted 16 Jun` (Medium 14) have no exact style. The file offers Regular/Semibold at 20, Semibold at 18, and only `subheader/15 medium` + `denis badge map` (Medium 14.98) as Medium. Either add three Medium styles to the system, or restyle the card to Semibold — a visible design change. Not guessed at.
- ~~**`listing` is still a screenshot.**~~ **Resolved** — the placeholder raster was replaced with a real `map` instance (`city=London, zoom=near`), so the screen is fully buildable. The `ios handle` that had been baked into that screenshot was re-added as a component instance.
- **`favorites` title diverged.** The fixed copy reads "With Vova" while the original reads "Shared with Vova"; the layer name changed with it. Not written by any script in this pass — needs confirming as an intentional edit.
- **`map-main` exists in three places** with different numbers: master (`map-main`), this section's originals (y724/347-wide), and these fixed copies (y719/343-wide). The margins are only corrected on the copies.
- **`pullup` is still a GROUP.** Converting to a frame would mean rebuilding it with absolute positions; left alone deliberately. Its content extending past the frame bottom is normal sheet behaviour, not a bug.
