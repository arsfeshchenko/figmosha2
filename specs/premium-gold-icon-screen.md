# Spec: premium gold app-icon screen — 3 variants

## Goal
Pick one design direction to ship for the post-purchase moment where a paying/trial user is
offered the exclusive gold app icon. The three frames exist to be compared side by side and
one chosen — not all three shipped.

## Non-goals
- ~~No multi-icon picker~~ — **reversed by the user**: variant D offers a choice of three premium
  icons (Gold + two more). A–C still show the single-icon model.
- No new bird artwork — the gold icon is the asset the user supplied.
- No Polish/Ukrainian localisation (English only).
- No prototype wiring, no Smart Animate states.
- No changes to any existing frame, page, component, style or variable in the file.

## Constraints
- 375×812 iOS full-screen modal, bg `#000050` (navy, = `bird-blue`).
- Visual language matches the app: navy bg, translucent white cards, yellow primary CTA,
  secondary dismiss below it, close button top-right.
- Text styles from the file only: `header/28 pullup`, `header/22 bold`, `body/17 regular`,
  `subheader/15 regular`, `button`, `caption/13 regular`. No hand-set fontName/fontSize.
- Colour via variables where one exists (`bird-blue`, `white 10% (alpha)`).
- **Components, not lookalikes**: CTA = `button` type=primary (29:23, yellow), dismiss =
  `button` type=secondary (34220:234677), close = `icon/cross-circle` (33:111), card check =
  `icon/check-circle` (33:102). Never draw a new button.
- Everything lives inside one SECTION `premium icon — 3 variants` on page `figmosha` (32907:1962),
  parked right of `pets one-line — 4 variants` (x ≈ 6900).

## Compartments

### 1. Gold icon asset
- Owns: the supplied 3D gold icon PNG (`~/Desktop/bird-logo-gold.png`, 1000×1000, uploaded at 512×512,
  imageHash `7e51f480…`) placed as a CROP image fill in a squircle frame (radius 22.37% of size),
  cropped 3% to trim the artwork's own dark bleed. Sizes used: 132 (A), 100 (B card), 60 (C grid).
- Does NOT touch: the source icon on `Icons & Splash`, or any icon component.
- Done = the gold icon renders with no dark corner bleed at 132 / 100 / 60px, classic icon still the
  live `icon-production` instance for the comparison card.

### 2. Section + variant A — reward / celebration
- Owns: the SECTION, and frame `premium icon — A reward`. Hero gilded icon centred with a glow,
  headline "Your icon just went gold", supporting line, green CTA, ghost dismiss, close X.
- Does NOT touch: variants B and C.
- Done = frame is 375×812, parent chain resolves to page `figmosha`, no text node overflows its
  box, section sized with ≥80px padding.

### 3. Variant B — side-by-side swap
- Owns: frame `premium icon — B swap`. Two selectable cards (current icon / gold icon), gold card
  selected with a check, headline, green CTA, ghost dismiss, close X.
- Does NOT touch: variants A and C.
- Done = both cards equal width, gold card visibly selected, same acceptance checks as #2.

### 4. Variant C — home-screen preview
- Owns: frame `premium icon — C preview`. Gold icon shown in situ on a mock iOS home-screen row
  with an app label, headline, green CTA, ghost dismiss, close X.
- Does NOT touch: variants A and B.
- Done = the mock home row reads as a home screen at a glance, same acceptance checks as #2.

### 6. Variant D — pick one of three special icons
- Owns: frame `premium icon — D pick one of three`. Title, hero preview of the selected icon with its
  name, a row of three 102px selectable slots (Gold selected, Onyx + Platinum placeholders), hint line,
  CTA + dismiss. Section widened to 1840 to fit it.
- Does NOT touch: variants A, B and C.
- Done = three slots equal size on one row, selected slot ringed + checked, hero mirrors the selected
  slot, placeholders named `icon-<name> (placeholder — awaiting AI render)` so they can be swapped
  by name.

### 5. Verification
- Owns: one PNG export of the section, visually inspected; data checks (frame sizes, page of each
  frame, no overlap with `pets one-line — 4 variants`, originals untouched).
- Does NOT touch: the design itself, except to fix what the render exposes.
- Done = render inspected and reported, plus explicit confirmation that nothing pre-existing changed.

## Confirmed decisions
1. Three *alternative design directions* (pick one), not three icon options or three states. ✅
2. Full-screen takeover shown right after purchase/trial start. ✅
3. English copy only. ✅
4. Tone = reward for an existing purchase, not a sales pitch. ✅
5. Gold icon = the user-supplied 3D gold PNG (an earlier generated gilding was replaced by it);
   one icon, offered against the current one. ✅
8. All interactive elements come from the file's own component library — no hand-built buttons. ✅
   (First pass drew a green pill from scratch; corrected.)
6. Directions A = reward/celebration, B = side-by-side swap, C = home-screen preview. ✅
7. All three in one SECTION on the `figmosha` page; nothing existing edited. ✅

## Post-build findings (from the critic pass — unresolved)
- **iOS shows a system alert** on `setAlternateIconName` that cannot be suppressed; none of the three
  variants designs for it, and B's hint ("updates right away") is inaccurate as written.
- **Android has no alternate app icons** — this screen needs a platform gate.
- Fixed already: 44pt hit area around the 32px close button; hint text lifted to 60% white (was
  4.14:1 contrast).

## Copy (final — written against `birb-skills/.claude/skills/copywriter/references/ars-ux-voice.md`)
| Screen | Strings |
|---|---|
| A | badge `NOT IN FREE BIRB` · title `Since you went Premium, here's a special icon` (accent yellow on *special icon*) · body `Free birb doesn't have this one. Swap back whenever you like.` · `Set this icon` / `Not now` |
| B | `Pick your icon` · `The gold one's yours. Free birb only gets the classic.` · cards Classic–`Free`, Gold–`Yours` · hint `iOS will ask you to confirm the change.` · `Set the gold icon` / `Keep the classic` |
| C | `Gold on your home screen` · `Free birb only gets the classic. Swap back whenever you like.` · `Set the gold icon` / `Keep the classic` |
| D | `Your special icons` · hero `Gold` + `Not in free birb` · hint `Free birb only gets the classic icon. Change yours anytime.` · `Set the gold icon` / `Not now` |

Voice rules applied: no "unlock" (banned cliché) · "special" instead of an unanchored comparative ·
accent colour on the payoff noun only · state echoed as an action ("since you went Premium") ·
no category framing ("paid users" → "free birb") · plan name appears once per screen.

## Awaiting assets
- Variant D's Onyx and Platinum slots are gradient placeholders (no bird art) until the AI-generated
  icons land. Swap by layer name: `icon-onyx (placeholder — awaiting AI render)`,
  `icon-platinum (placeholder — awaiting AI render)` — both in the hero and the slot row.
- 10 prompts for Figma's AI image generation were handed to the user; Figma's generation has no plugin
  API, so the user generates and Claude uploads + places.

## Open questions
- **Plan name unverified** — every screen says "Premium". If the paid tier is actually called
  something else (birb AI / Pro / Plus), all four need a find-and-replace.
- Exact price/plan wording is not shown on this screen (deliberately — the purchase already
  happened). If the screen must double as a trial reminder, that's a change of goal.
