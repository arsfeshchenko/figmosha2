# Spec: sticker button

## Goal
One click turns any selected layer into a carousel-style sticker, so titles and labels get the house sticker look without hand-building auto-layout frames.

## Non-goals
- No tilt (rotate by hand).
- No text restyling (font, shadow, outline stay as they are).
- No component; it creates plain frames.

## Constraints
- Same pattern as the other toolbar actions: helper in `plugin/code.js`, button in `plugin/ui.html`, CLI subcommand in `figmosha.py`, docs in `CLAUDE.md`.
- Fill `#000050`, bound to the local `bird-blue` variable when the file has it.

## Compartments
### 1. `h.sticker(target)` helper
- Done = wraps each selected layer (or each id passed) in its own auto-layout frame named `sticker`, in the layer's place (same parent, same index, same position; an auto-layout parent keeps the slot). Fill #000050, white stroke outside, rounded corners, hug on both axes. Sizes scale with base = font size for text, else layer height, relative to the carousel title at 64px: padding 30/45, stroke 8.5, radius 53. A layer that's already a sticker, or already inside one, is skipped. A rotated layer keeps its tilt on the sticker.

### 2. Toolbar button
- Done = a «sticker» button next to the others; toast «N stickers created» or «Select a layer first».

### 3. CLI + docs
- Done = `figmosha sticker [<id>...]` (no id = selection); helper and command rows in CLAUDE.md.

## Confirmed decisions
1. Scale with the text (user, 2026-10-03).
2. No tilt (user, 2026-10-03).
3. One sticker per layer (user, 2026-10-03).
