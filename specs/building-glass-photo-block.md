# Spec: building photo block on liquid glass (4 variants)

## Goal
Let a renter judge the building at a glance (its type and year built) from the map, before scrolling its flats. The photo is secondary; the info is primary.

## Non-goals
- No change to the original `carousel listings` frames (34898:83040 and its siblings).
- No new component or Symbols change: the variants are explorations.
- No map, listing card or button changes beyond the Kyiv header copy.
- No prototype wiring.

## Constraints
- File "bird app", page "in design 🎨", base frame `carousel listings` 34898:83040 in section «великі кнопки в пулапі».
- The glass style matches the file's glass buttons: GLASS effect (radius 34, refraction 0.8, depth 20, light -45° / 0.8, dispersion 0.5) and a white 10% fill bound to VariableID:34240:68166.
- Text styles: type = `subheader/15 semibold`, year = `caption/13 regular`; white text.
- Keep the `icon/lookaround` on the photo in every variant.
- Kyiv copy in Ukrainian; no em dash in layer names.

## Compartments
### 1. Variant frames
- Owns: 4 clones of 34898:83040, named `carousel listings v2 (building glass A)` … `D`, inside a new section `building glass variations`.
- Does NOT touch: the originals or the parent section's other children.
- Done = 4 frames exist in the new section with 80px padding; no overlaps on the page.

### 2. Glass block, one layout per variant
- A: vertical glass card: photo on top, type + year below.
- B: horizontal glass pill: small photo left, two text lines right.
- C: photo with a glass strip overlaid at its bottom: «Сталінка · 1954».
- D: photo, plus a separate glass chip beside it with type + year.
- Done = each block sits bottom-left above the pull-up where the photo was, is fully inside the screen, doesn't overlap the pull-up, and uses the glass style + text styles above.

### 3. Kyiv copy
- Done = header «Печерський район» / «3479 пропозицій»; block data «Сталінка» · «1954 р.» in all 4 (same data, so only the layout differs).

## Confirmed decisions
1. Goal: judge the building at a glance, info-first (user, 2026-09-28).
2. Market: Kyiv, Ukrainian (user, 2026-09-28).

## Open questions
- The photo is still a London house; swap in a real Kyiv building photo.
