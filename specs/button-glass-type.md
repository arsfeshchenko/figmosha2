# Spec: `type=glass` for the button component set

## Goal

Make the glass button a **real, maintainable variant** of the `button` component set, and get the app's main screen off dead components.

Today `map-1208261344` — the main map screen on `master 🟢` — is built on `button/glass/…` and `button/blur/…`, which are **orphaned main components**: `remote: false` but `parent: null` and no page. They were deleted; they survive only because instances still reference them. Nothing can be updated centrally, and if the last instance goes, the style goes with it.

After this, `type=glass` lives in `button [9002:35138]`, the main screen points at it, and any future glass tweak propagates everywhere instead of being unfixable.

## Non-goals

- **Not** a visual redesign. The target look is the recipe already on screen; near-identical output is the success case, not a shortfall.
- **Not** touching `primary`, `secondary`, `selected`, or the existing `type=map` variants.
- **Not** touching the `compass` component (bespoke, not a button).
- **Not** converting any other screen. Only `34394:261511`.
- **Not** fixing the misnamed variant `34220:251826` (see Open questions).

## Constraints

- **Set:** `button` `9002:35138`, page `Symbols 💠`. 23 variants → **32**.
- **Existing prop schema:** `type` · `title` · `size` · `subtitle` · `icon` · `align center`. Names must match exactly or Figma adds set errors.
- **The set already reports errors** — `34220:251826` is missing `type=`/`size=`, so `componentPropertyDefinitions` and `componentProperties` **throw**. Address variants by node id only.
- **Glass recipe** (copied verbatim from the orphan `33825:228632`, not invented):
  - fill → `white 10% (alpha)` `VariableID:34240:68166`, **bound**, not a hardcoded hex
  - effect → native `{type:'GLASS', radius:34, refraction:0.8, depth:20, lightAngle:-45, lightIntensity:0.8, dispersion:0.5, splay:0}`
  - no stroke
- **Everything else inherits from `secondary` by cloning it** — radius (16 regular / 8 small), padding, spacing, white label, text styles (`S:f76ce357…` regular, `S:bccb2db6…` small). Do not re-set these by hand.
- `secondary`'s own fill is `white 20% (opaque)` `34220:234594` — glass replaces it with the 10% alpha.
- Instance re-pointing uses `swapComponent()` so icon and label overrides survive.
- Master page is edited **in place** — user's explicit override of the CLAUDE.md duplicate rule. A backup clone is the mitigation.

## Compartments

### 1. Nine glass variants
- **Owns:** cloning the 8 `secondary` variants into `type=glass` twins, plus one new 40×40 `size=medium`; applying the fill variable + GLASS effect; appending to the set and laying them out in a fourth column.
- **Does NOT touch:** any existing variant, any instance, any screen.
- **Done =** set reports 32 children; all 9 new names parse against the existing prop schema; each new variant's fill is bound to `34240:68166` and carries exactly one `GLASS` effect; radii are 16/8/12 matching their source; the 40×40 is `4/4/4/4` padding around a 32px icon; no *new* set errors beyond the pre-existing `34220:251826`.

| # | Name | Size | From |
|---|---|---|---|
| 1 | `type=glass, title=true, size=regular, subtitle=false, icon=false, align center=true` | 80×55 | `34220:234677` |
| 2 | `type=glass, title=true, size=regular, subtitle=true, align center=true` | 80×55 | `34220:234679` |
| 3 | `type=glass, title=true, size=small, subtitle=false, icon=false, align center=true` | 61×32 | `34220:234682` |
| 4 | `type=glass, title=false, size=regular, subtitle=false, icon=true, align center=true` | 56×56 | `34220:234684` ← **screen** |
| 5 | `type=glass, title=true, size=small, subtitle=false, icon=true, align center=true` | 85×32 | `34220:234686` ← **screen** |
| 6 | `type=glass, title=true, size=small, subtitle=false, icon=true, align center=false` | 85×32 | `34220:234689` |
| 7 | `type=glass, title=false, size=small, subtitle=false, icon=true, align center=true` | 32×32 | `34220:234692` |
| 8 | `type=glass, title=true, size=regular, subtitle=false, icon=true, align center=true` | 116×56 | `34220:234694` |
| 9 | `type=glass, title=false, size=medium, subtitle=false, icon=true, align center=true` | 40×40 | `34220:234684`, repadded ← **screen** |

### 2. Backup of the main screen
- **Owns:** one clone of `34394:261511` onto the `figmosha` page (`32907:1962`), named `map-1208261344 — pre-glass backup`.
- **Does NOT touch:** the original frame; the master page's section layout.
- **Done =** clone exists on the `figmosha` page (verified by walking to `type === 'PAGE'`), 375×812, and the original is still at its original coordinates inside section `34394:261510` on `master 🟢`.

### 3. Re-point the screen
- **Owns:** `swapComponent()` on the 7 instances of `34394:261511`.
- **Does NOT touch:** the `compass` instance; the `map` background instance; `ios handle`; the three container frames' layout or coordinates.
- **Done =** all 7 resolve to a main component whose `parent.type === 'COMPONENT_SET'` and id `9002:35138`; zero instances on the frame point at an orphan; icon overrides and both label strings survive; the two top-left buttons keep their 104px and 83px hug widths; the three containers keep their sizes (347×56, 191×32, 40×88) and positions.

| Instance | Was | Becomes |
|---|---|---|
| `filters`, `notifications`, `favorite`, `favorite` (Frame 113551) | `button/glass/…` orphan, 56×56 | variant **4** |
| `filters`, `filters` (Frame 115053) | `button/blur/…` orphan, 104×32 / 83×32 | variant **5** |
| `filters` (Frame 111828) | `type=map` 40×40 | variant **9** |

### 4. `round` variant property — *added mid-build*
- **Owns:** a boolean `round` on the glass family only. `round=false` = today's squircle radii; `round=true` = fully round (radius = height ⁄ 2).
- **Does NOT touch:** `primary`, `secondary`, `selected`, `map` — they get no `round` property.
- **Done =** 18 glass variants (9 × `round=false`, 9 × `round=true`); set totals 41; every glass variant still carries the bound fill and exactly one `GLASS` effect; `round=false` is the default and the screen stays on squircles apart from the one documented exception.

| Shape | Size | `round=false` | `round=true` |
|---|---|---|---|
| title, regular | 80×55 | r16 | r27.5 |
| title+subtitle, regular | 80×55 | r16 | r27.5 |
| title+icon, regular | 116×56 | r16 | r28 |
| icon, regular | 56×56 | r16 | r28 |
| title, small | 61×32 | r8 | r16 |
| title+icon, small, center | 85×32 | r8 | r16 |
| title+icon, small, left | 85×32 | r8 | r16 |
| icon, small | 32×32 | r8 | r16 |
| icon, medium | 40×40 | r12 | r20 |

### 5. Layer names + structure — *added mid-build*
- **Owns:** semantic layer names on `34394:261511`, and replacing hardcoded `itemSpacing` with `SPACE_BETWEEN` on the two bars.
- **Does NOT touch:** the `map` background instance, `ios handle`, the `compass` component, any button's variant or geometry.
- **Done =** no `Frame <digits>` names remain; every button is named for what its icon does; no duplicate names within a container; both bars use `SPACE_BETWEEN`; every child's frame-relative position is byte-identical to before the rename.

| Was | Now |
|---|---|
| `map-1208261344` | `map-main` |
| `Frame 113551` | `bottom bar` |
| `Frame 1171276086` | `top bar` |
| `Frame 115053` | `top bar chips` |
| `Frame 111828` | `map controls` |
| `favorite` (search icon) | `search` |
| `filters` (location icon) | `locate me` |
| `filters` (message icon, "Feedback") | `feedback` |
| `filters` (plus-circle icon, "Listing") | `add listing` |
| `filters` (add-favorites icon, "Partner") | `partner` |

### 6. Verify
- **Owns:** data assertions for compartments 1–5, then **one** PNG export of the screen, actually looked at.
- **Does NOT touch:** anything.
- **Done =** assertions pass; the render shows all 8 buttons legible against the map with the refractive edge visible; no clipped or displaced controls.

## Deviations from the spec as first written

1. **Eight buttons, not seven.** A third and fourth small chip (`partner`, and a loose 87×32 that turned out to be `feedback`'s sibling) sat as direct children of the frame rather than inside a container, so the original grouping probe missed them. All are on glass now.
2. **Variant 9 is a circle, not an r12 squircle with a 32px icon.** It replaces a 40×40 `ELLIPSE`-based map button carrying a 24px icon, and sits 8px from the circular `compass`. Built as pad 8 + 24px icon; `round=false` = r12, `round=true` = r20.
3. **`locate me` is the one instance switched to `round=true`.** Leaving it at r12 put a rounded square 8px above a circle. Reverting is a single variant flip.
4. **`top bar chips` grew 191 → 195px** — `secondary`'s small padding is `7/12/7/8` against the old blur component's `7/10/7/8`, so each chip gained 2px. `SPACE_BETWEEN` absorbs it and keeps `partner` pinned to the right margin.
5. **Set resized manually** to 1132×556; `COMPONENT_SET` did not auto-grow to fit the new columns.

## Confirmed decisions

1. **Goal is design-system health**, not a restyle — near-identical visual output is success.
2. **All 8 `secondary` shapes get a glass twin**, so `type` is a safe switch on any button rather than a trap that silently matches nothing.
3. **The 40×40 map button becomes glass** via a new `size=medium`. Accepted trade-off: Figma can't scope prop values per type, so `medium` shows in the size dropdown for `primary`/`secondary` and matches nothing there — the same limitation `type=map` already has with `align center`.
4. **Master is edited in place.** User override of the duplicate-first rule; mitigated by compartment 2's backup.
5. **`compass` and the `type=map` variants stay untouched.**
6. **The two top-left buttons change look slightly** — old `BACKGROUND_BLUR r28` → native `GLASS r34`. Crisper, refractive edge. Accepted, and the point of unifying on one recipe.
7. **Fill is bound to the variable**, never a hardcoded white — matches the file's convention.
8. **`34220:251826` is left misnamed**, flagged not fixed: renaming re-binds properties and could cost overrides on instances elsewhere.
9. **`round` is scoped to the glass family only** (9 → 18 variants). Accepted cost: a third "variants have different properties" warning on the set, since `primary`/`secondary`/`selected`/`map` carry no `round`. The alternative — `round` on all four types — would have doubled the set to 64 with 23 round variants that have no consumer.
10. **`round=false` is the default and the screen stays on squircles.** The switch exists so the round look can be evaluated in Figma rather than being imposed by this build.

## Open questions

- **Set error persists.** `34220:251826` keeps the set in an error state and `componentPropertyDefinitions` keeps throwing. Worth a separate, scoped pass that first audits every instance of that variant.
- **`size=medium` is glass-only.** If 40×40 turns out to be a real need for `primary`/`secondary`, those twins should follow rather than leaving a dropdown value that dead-ends.
- **Other screens still on orphans.** This fixes one screen. The same `button/glass/…` and `button/blur/…` orphans are likely referenced elsewhere in the file — unaudited. Once nothing references them they vanish for good, so a file-wide sweep is the follow-up that actually retires them.
- **`compass` is now the odd one out.** Every control on the screen reads as glass except the compass, which is an opaque black circle with a raster child (`IMG_2EF8940E6F3C-1 1`). It was explicitly out of scope, but visually it no longer belongs.
- **`round=true` is unused.** Nine variants exist with no consumer until the look is chosen. If it's rejected, they should be deleted rather than left as dead surface area.
- **Glass over bright map areas.** `locate me` sits over pale water in the current render and the refraction reads near-solid white. Worth checking against the lightest map tiles and the light-mode map, if there is one.
