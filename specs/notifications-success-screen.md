# Spec: notifications success screen

## Goal
Close the "заблочені нотіфи" flow: after a user allows notifications in iOS Settings and returns to bird, confirm that they are now subscribed to new flats in this building, so the flow ends on a clear payoff instead of the denial screen.

## Non-goals
- No "notifications were already on" path (subscribe goes straight to success). Out of scope.
- No toast / building-screen variant.
- No change to existing frames in the section (building, building v2, house v8, invite-waiting v2).
- No prototype wiring.

## Constraints
- Figma file "bird app", page "in development 🔨", section `заблочені нотіфи` (35456:273626).
- Build by cloning `invite-waiting v2 (notifications denied)` (35456:274695) so structure, text styles and variables carry over.
- Copy in Ukrainian, matching the tone of the existing screens.
- No em dash in layer names.

## Compartments
### 1. Success frame
- Owns: new frame `notifications enabled (success)` cloned from invite-waiting v2, placed to its right inside the section.
- Does NOT touch: the original invite-waiting v2 or any other frame.
- Done = the frame sits at the same y as invite-waiting, 120px to its right; `settings hint` and `button secondary` removed; bird-illustration variant = `bell`; title "Сповіщення увімкнено"; body "Повідомимо, щойно в цьому будинку з'явиться нова квартира"; primary button "Чудово"; texts keep their styles; sheet contents re-centred with no empty gap.

### 2. Flow arrow
- Owns: one arrow from invite-waiting v2's "Дозволити сповіщення" button to the new frame, in the same hand-drawn style as the existing arrows.
- Does NOT touch: existing arrows.
- Done = the arrow starts at the right of the primary button and ends at the left edge of the new frame; nothing overlaps.

### 3. Section fit
- Owns: section size.
- Done = the section contains the new frame with about 80px of padding; the section doesn't overlap its page siblings; the original frames are unchanged (same size and position).

## Confirmed decisions
1. Trigger: notifications allowed + subscribed (user, 2026-09-28).
2. Form: clone of invite-waiting, steps removed, one button (user, 2026-09-28).
3. Bird variant `bell`, copy as above, frame name, placement, 'Чудово' closes to building (user, 2026-09-28).

## Open questions
