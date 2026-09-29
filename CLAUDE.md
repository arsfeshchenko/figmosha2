# Figmosha 2.0 — Claude Code instructions

Drive Figma by sending JS code through a local bridge that's connected to a custom plugin running inside Figma Desktop.

## How to send code

```bash
# Preferred — subcommand-style
python figmosha.py exec "return figma.currentPage.name"
python figmosha.py exec --file script.js

# Shorthand (auto-prepends `exec`)
python figmosha.py "return figma.currentPage.name"

# High-level commands (covered below) save tokens for common operations
python figmosha.py text 185:21880 "Привіт"
python figmosha.py variant 185:21883 "Property 1=Default"

# Quick HTTP (no Python needed)
curl -s -X POST http://localhost:8787/exec \
  -H 'Content-Type: application/json' \
  -d '{"code":"return figma.currentPage.id"}'

# Status
curl -s http://localhost:8787/status   # {"plugin_connected": true/false, "pending": 0}
```

If the bridge isn't running: on this Mac, `./venv/bin/python bridge.py` in the background (no tmux here); on the WSL setup, `bash start-bridge.sh` (tmux `figmosha-bridge`). Logs: `/tmp/figmosha-bridge.log`.

If the plugin isn't connected: tell the user — `Plugins → Development → Figmosha → Run`.

## Helpers (available as `h.*` in every exec)

The plugin runtime exposes a small helper namespace. Use these to keep scripts short:

| Helper | What |
|---|---|
| `await h.bF(node, idx, varOrId)` | Bind fill paint to variable (id or instance) |
| `await h.bS(node, idx, varOrId)` | Bind stroke paint to variable |
| `await h.bN(node, prop, varOrId)` | Bind numeric prop (radius, padding, size...) |
| `h.findByName(root, name)` | First descendant by exact name |
| `h.findAllByName(root, name)` | All descendants by exact name |
| `h.dumpTree(node, {maxDepth, showSize, showText})` | Indented tree string |
| `await h.withFonts(root, asyncFn)` | Loads every unique font in subtree, then runs `asyncFn` |
| `await h.setText(node, text)` | Set TEXT node chars with auto font load (mixed-font nodes too) |
| `h.cloneNext(node, {direction, gap, name})` | Clone + place adjacent (`right`/`left`/`up`/`down`) |
| `await h.variant(instance, props)` | Wrapper around `instance.setProperties(...)` |
| `await h.variantsOf(instance)` | `{ current, groups, all }` for the component set |
| `await h.node(id)` | Shorthand for `figma.getNodeByIdAsync(id)` |
| `await h.var_(idOrKey)` | Resolve a variable from id or instance |
| `await h.importComp(key)` | `figma.importComponentByKeyAsync(key)` |
| `await h.importVar(key)` | `figma.variables.importVariableByKeyAsync(key)` |
| `h.roundOutline(target, {ratio, radius, weight, stroke, align})` | Round to `width/ratio` (default 6) + outline stroke; `target` omitted = current selection |
| `h.fillSolid(target, color)` | Paint a flat fill (white by default); `target` omitted = current selection |
| `h.scaleToWidth(target, width)` | `rescale()` so width is exactly `width` (default 375), proportionally |
| `await h.setFont(target, {family, style})` | Set one font on every TEXT in the subtree; missing fonts skip only their own nodes |

**Use them.** Compared to inline boilerplate, helpers save ~70% of the script and avoid common mistakes (frozen `node.fills`, missing `loadFontAsync`, etc.).

### Bad vs good

```js
// Bad — verbose, easy to miss
const f = JSON.parse(JSON.stringify(node.fills));
f[0] = figma.variables.setBoundVariableForPaint(f[0], "color", v);
node.fills = f;

// Good — helper handles freezing + setBoundVariableForPaint
await h.bF(node, 0, v);
```

```js
// Bad — must remember to load fonts first; mixed-font case is silent
await figma.loadFontAsync(node.fontName);
node.characters = "new";

// Good
await h.setText(node, "new");
```

```js
// Bad — manual font collection
const texts = root.findAll(n => n.type === "TEXT");
const fonts = [...new Set(texts.map(t => `${t.fontName.family}|${t.fontName.style}`))];
// ... load each ...

// Good
await h.withFonts(root, async () => {
  // bulk-edit text inside `root` here
});
```

## CLI subcommands (save tokens for common ops)

| Command | Equivalent JS | Use case |
|---|---|---|
| `figmosha tree <id>` | `h.dumpTree(await h.node(id))` | Explore node structure |
| `figmosha find <id> name=Button` | `(await h.node(id)).findAll(n => n.name === "Button")` | Locate by name |
| `figmosha find <id> name~Btn` | `findAll(n => n.name.includes("Btn"))` | Substring name match |
| `figmosha find <id> type=INSTANCE` | `findAll(n => n.type === "INSTANCE")` | Filter by type |
| `figmosha find <id> text~Привіт` | `findAll(n => n.type === "TEXT" && n.characters.includes(...))` | Find by text |
| `figmosha text <id> "новий"` | `await h.setText(n, "новий")` | Edit text safely |
| `figmosha variant <id> "Property 1=Default"` | `await n.setProperties({...})` | Switch variant |
| `figmosha clone <id> --right --gap 100` | `h.cloneNext(n, {direction:'right',gap:100})` | Duplicate adjacent |
| `figmosha rm <id>` | `n.remove()` | Delete |
| `figmosha icomp <key>` | `(await h.importComp(key)).createInstance()` | Pull from library |
| `figmosha outline [<id>...]` | `h.roundOutline(...)` | Round + white outline; no id = selection |
| `figmosha fill [<id>...] --color RRGGBB` | `h.fillSolid(...)` | Flat fill, white by default |
| `figmosha scale [<id>...] --width 375` | `h.scaleToWidth(...)` | Proportional rescale to a target width |
| `figmosha font sfpro\|montserrat\|'Family/Style' [<id>...]` | `h.setFont(...)` | Restyle every text node in the selection |

Use subcommands when the op fits one of these. Fall back to `exec` for anything else.

## How exec evaluates code

```js
new Function("figma", "print", "h", `return (async () => { <YOUR CODE> })();`)(figma, print, HELPERS)
```

- `return ...` becomes the `result` field of the response (stringified + raw `value` if JSON-serializable).
- `await` works everywhere.
- `print(...)` collects log lines (returned in the `logs` array; also streamed to plugin UI).
- Exceptions → `{ok:false, error, hint?, stack, logs}` with HTTP 500.

The bridge **adds a `hint` field** when it recognizes a common error (fills/strokes binding, frozen array, font not loaded, missing permission, appendChild order, variant typo). Pay attention to it.

## Conventions

### Start from the master page

**Before building a new screen or variant, look for its base on the `master 🟢` page (`0:1`) and clone that.** Master is the shipped source of truth; frames on `in design` / `in development` are drafts and are often stale (old copy, old components, other markets).

- Search master first — by frame name, a key text (`findAll` on `TEXT` `characters`), or a component instance.
- Master is read-only: clone it, then move the clone to the working page (`await page.loadAsync()` on both, then `targetPage.appendChild(copy)`). Never edit a master frame.
- Only fall back to a draft page when master has no match — and say which frame you started from and why.

### Never edit the user's frame — always work on a duplicate

**Rule: any change to existing design goes onto a clone, never the original.** The user's frame is the reference they compare against; Figma undo doesn't survive a plugin session, so an in-place edit is effectively unrecoverable.

**The duplicate goes where the user asked; with no place named, it goes on the `figmosha` page (`32907:1962`).** "Here" plus a screenshot of a section means that section. `figmosha` is the default scratch space, not a hard rule. Either way the copy sits next to its source or in a named section, never loose.

Never use `figma.currentPage.appendChild()` for this. `figma.currentPage` is whatever page the user last clicked in the Figma UI — it drifts between execs — so that call silently *moves* the clone onto an unrelated page. `clone()` already places the copy as a sibling of the source; just reposition it, or append to the source's own parent explicitly.

**Name the copy `<name> v2`** — bump the number for each further iteration (`v3`, `v4`…). **Never put an em dash (`—`) in a Figma layer name.** It reads as a separator in the layers panel and makes names impossible to scan. Use a space, or parentheses for a qualifier: `shared search manage v2`, `partner avatars v3 (avatar + name)`.

```js
const src = await h.node(id)
const copy = src.clone()
copy.name = src.name + ' v2'         // or ' v3', matching the iteration — no em dash
src.parent.appendChild(copy)         // explicit parent — NOT figma.currentPage
copy.x = src.x + src.width + 120     // park it to the right, don't overlap
copy.y = src.y
```

To move a node across pages deliberately, `await page.loadAsync()` on both pages first, then `targetPage.appendChild(node)`.

Confirm placement before reporting done — walk up to the `PAGE` and check the name:

```js
const pageOf = n => { let p = n; while (p && p.type !== 'PAGE') p = p.parent; return p && p.name }
```

Then build the old-id → new-id map once and reference the **new** ids for every subsequent edit:

```js
const M = {}; (function w(a,b){ M[a.id]=b.id; if(a.children) a.children.forEach((c,i)=>w(c,b.children[i])); })(src, copy)
```

Capture that map in one exec and reuse the returned ids — the parallel walk breaks as soon as you reorder or add children.

Before reporting done, **verify the original is untouched** (width/height/key child sizes) and say so.

### Coordinates: `x`/`y` are relative to the parent frame

A node's `x`/`y` are in its parent **frame's** space — including nodes inside a `GROUP` (groups don't create their own coordinate space). Adding the parent frame's own `x` sends the node off-canvas, and with `clipsContent: true` it silently vanishes.

```js
bar.x = 0; bar.y = frame.height - bar.height   // correct
bar.x = frame.x                                 // wrong — lands at the frame's page coordinate
```

Verify placement with absolute boxes, not raw `x`/`y`:

```js
const rel = n => ({ x: n.absoluteBoundingBox.x - frame.absoluteBoundingBox.x,
                    y: n.absoluteBoundingBox.y - frame.absoluteBoundingBox.y })
```

### Always re-check overlaps after a change — and fix them

**Any exec that moves, resizes, adds or clones a node must end with an overlap sweep of that node's siblings, and fix what it finds before reporting done.** Growing a component set or a section is the usual culprit: it silently swallows whatever sat below it, and nothing errors.

```js
const sibs = node.parent.children.map(n => ({ n, x: n.x, y: n.y, w: n.width, h: n.height }))
const hits = sibs.filter(a => sibs.some(b => a.n !== b.n &&
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h))
```

**Fix by moving what you changed, not its neighbours.** If a set grew taller, shift it *up* by the delta so its bottom edge — and every gap the user arranged below it — stays put. Never let a naive "scan downward for free space" packer relocate a neighbour; it lands things thousands of px from where they belong. Report any overlap you deliberately leave (an intentional overlay on a screenshot, say) rather than silently moving it.

### Use async APIs

The plugin runs under dynamic-page documentAccess where lookups are async:

```js
const node = await figma.getNodeByIdAsync(id)        // or: await h.node(id)
const main = await instance.getMainComponentAsync()
const cols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()
const comp = await figma.importComponentByKeyAsync(key)  // or: await h.importComp(key)
```

### Auto-layout: order matters

`resize()` / spacing / sizing modes are ignored if set before `layoutMode`:

```js
const f = figma.createFrame()
parent.appendChild(f)            // 1. into tree first
f.layoutMode = "VERTICAL"        // 2. layoutMode
f.resize(400, 100)               // 3. size
f.primaryAxisSizingMode = "AUTO" // 4. sizing
f.itemSpacing = 16               // 5. spacing/padding
f.paddingTop = 24
```

### Anything that isn't the design itself goes in a named SECTION

Prototype states, animation frames, variant explorations, before/after pairs, scratch experiments — none of it belongs loose on the canvas next to the real screens. Wrap each cluster in a `SectionNode` named for what it is (`animation`, `furnished — variations`, `scroll states`). Loose frames read as part of the design and nobody can tell later which ones were the deliverable.

```js
const sec = figma.createSection()
parent.appendChild(sec)                 // a page, or another section — sections nest
sec.name = 'animation'
sec.x = 2412; sec.y = 105
sec.resizeWithoutConstraints(1030, 972) // sections use resizeWithoutConstraints, not resize
sec.appendChild(frameA); frameA.x = 80;  frameA.y = 80   // child x/y are section-relative
sec.appendChild(frameB); frameB.x = 575; frameB.y = 80
```

- **Child coordinates are relative to the section**, like a frame. Reparenting without repositioning throws nodes thousands of px away.
- **Size the section yourself** — it does not hug its contents. Leave ~80px padding so the label doesn't collide with the frames.
- **Check for overlap** with the section's new siblings before reporting done, and grow the parent if needed.
- **Prototype reactions survive reparenting** — verify anyway, with `node.reactions`.

### Use the file's text styles, not raw font properties

When you create or restyle a TEXT node, **attach an existing text style** rather than setting `fontName` / `fontSize` by hand. A hand-set node looks identical today and drifts the moment the style is updated — and it's invisible in the design-system audit.

```js
// Bad — right pixels, detached from the system
t.fontName = { family: 'SF Pro Display', style: 'Bold' }
t.fontSize = 28

// Good — find the style whose properties already match, then attach it
const styles = await figma.getLocalTextStylesAsync()
const s = styles.find(x => x.name === 'header/28 pullup')
await h.withFonts(root, async () => { await t.setTextStyleIdAsync(s.id) })
```

**Only attach a style that is an exact match** — same family, weight, size, line-height, letter-spacing, case and decoration. Attaching a near-match silently changes the design. Compare on a signature and skip anything that isn't identical:

```js
const sig = o => [o.family, o.style, o.size,
  o.lh.unit === 'AUTO' ? 'AUTO' : o.lh.value + o.lh.unit,
  o.ls.value + o.ls.unit, o.tc, o.td].join('|')
```

Before styling anything, list what exists — `await figma.getLocalTextStylesAsync()`. Some names collide on identical properties (`button` and `16 semibold` are both SF Pro Display Semibold 16); pick by role, and if you genuinely can't tell, report the ambiguity instead of guessing.

Guard against mixed-styling nodes: `t.fontName` and `t.fontSize` return a `symbol` when a node has more than one style inside it. Skip those.

Same principle for colour: bind to a variable rather than writing a hex fill.

### Smart Animate states: identical structure, or it glitches

Two frames wired with `SMART_ANIMATE` only interpolate a property when **both frames have that property on a layer with the same name**. Anything present in one frame and absent in the other **pops** instead of animating.

Build the second state by **cloning the first**, then changing values — never by assembling it separately.

```js
// Bad — fill exists only in the scrolled state, so it snaps in mid-transition
top.fills = []
scrolled.fills = [{type:'SOLID', color:NAVY, opacity:0.55}]

// Good — same fill and same effect in both; only the value differs
top.fills      = [{type:'SOLID', color:NAVY, opacity:0}]
top.effects    = [{type:'BACKGROUND_BLUR', radius:32, visible:true}]
scrolled.fills = [{type:'SOLID', color:NAVY, opacity:0.55}]
scrolled.effects = [{type:'BACKGROUND_BLUR', radius:32, visible:true}]
```

Checklist before wiring — for every layer that moves between states:

- **Same layer name and same parent chain.** Renaming breaks the match silently.
- **Fills, strokes, effects exist in both** — use opacity `0`, not an empty array, to hide something.
- **Fixed sizes, not hug**, on anything whose content changes size. A hug header is `61pt` with a 28px title and `60pt` with a 20px title — that 1px difference reads as a jitter. Set `counterAxisSizingMode = 'FIXED'` and one explicit height in both.
- **Same corner radii, padding and alignment**, even when they look irrelevant.
- **Same sizing modes.** `AUTO` in one frame and `FIXED` in the other animates from the wrong box.

Wire reactions with `setReactionsAsync` (the `reactions` setter is read-only):

```js
await node.setReactionsAsync([{
  trigger: {type:'ON_CLICK'},
  actions: [{ type:'NODE', destinationId: other.id, navigation:'NAVIGATE',
    transition: {type:'SMART_ANIMATE', easing:{type:'EASE_IN_AND_OUT'}, duration:0.4},
    preserveScrollPosition: false }]
}])
```

Scroll states need a **device-height frame** (375×812) with `clipsContent`, not the tall content artboard. Make the sheet a fixed clipping viewport and give `sheet-content` `layoutPositioning = 'ABSOLUTE'` with a negative `y` — that's the scroll offset. Keep the sheet's resting top edge visible so it still reads as a pull-up rather than a full-screen page.

### Two-stage workflow for big builds

For complex builds (component sets with many variants + variable binding): split into Step 1 = build structure with hardcoded RGB; Step 2 = walk nodes by `name` and bind via `h.bF`/`h.bS`/`h.bN`. Verify each step independently.

Name nodes in Step 1 so Step 2 can `h.findByName(root, "...")` them.

### Don't take screenshots for verification

The bridge returns the data you need. Verify by:

```js
return (await h.node("...")).width
return root.findAll(n => n.type === "TEXT").map(t => t.characters)
```

`node.exportAsync({format:"PNG"})` exists if you genuinely need pixels — returns bytes. Don't use it as "is the code working" check.

**Exception — visual deliverables.** When the output is a *design* the user will look at (a new screen, a redesigned frame, a bottom bar), take **one** export at the end and actually look at it. Data checks pass on things that render broken: a node placed off-canvas by a coordinate mistake, a text node that wraps because its box is too narrow, white-on-yellow that measures fine and reads terribly. Verify with data throughout, then confirm with one render.

Round-trip the bytes to a file — the CLI prints the base64 string, so extract the longest base64 run from the output and decode it:

```bash
figmosha exec "
const f = await h.node('ID');
const b = await f.exportAsync({format:'PNG', constraint:{type:'SCALE', value:1}});
let s=''; const CH=8192;
for(let i=0;i<b.length;i+=CH) s += String.fromCharCode.apply(null, b.subarray(i,i+CH));
return btoa(s);
" > out.txt
python3 -c "
import re,base64
b=max(re.findall(r'[A-Za-z0-9+/=]{200,}', open('out.txt').read()), key=len)
open('frame.png','wb').write(base64.b64decode(b+'='*(-len(b)%4)))
"
```

Crop with PIL to inspect a specific region (a bar, a header) instead of squinting at a 1600px-tall export.

## Gotchas (each one cost a rebuild)

- **An emptied GROUP deletes itself.** Moving a group's last child out removes the group; calling `remove()` on it afterwards throws. Check `g.removed` first.
- **`figma.createFrame()` / `createText()` land on `figma.currentPage`**, which is whatever page the user is looking at. Append the node to its real parent on the very next line, or a failed exec leaves an orphan on an unrelated page.
- **A failed exec is not rolled back.** Everything before the throw stays. Before retrying, find and remove what the partial run created (only your own nodes), or make the script resumable.
- **Hug width and a line limit don't mix.** `textTruncation` and `maxLines` are silently disabled on `WIDTH_AND_HEIGHT` text. For "wrap to 2 lines when too long", use hug + `maxWidth`; a fixed width gives a real `maxLines`. Changing `textAutoResize` resets both, so set them last.
- **A big exec result drops the plugin.** Several MB of base64 (a batch export) disconnects it mid-request. Export one node per exec and decode on the Mac side.
- **Section exports carry extra margin.** Don't crop a section PNG by frame coordinates; export each frame on its own.
- **`scrollAndZoomIntoView` needs the right page first**: `await figma.setCurrentPageAsync(page)`, then set the selection and zoom. Use it when the user asks to "show me".

## When something looks wrong

- **`plugin not connected` (503)**: plugin window closed in Figma. Ask user to Run it again.
- **Timeout (504)**: probably infinite loop or unresolved `await`. Ask user to close & re-run plugin.
- **`teamlibrary permission not specified`** (or similar): manifest needs a new permission. Edit `plugin/manifest.json`, sync to user's Windows copy (`/mnt/c/Users/User/figmosha-plugin/manifest.json` on their WSL), ask user to **re-import** the plugin (Plugins → Development → Manage plugins → remove + Import again).
- **Result looks weird / undefined**: you forgot `return`. The wrapper expects a value.
- **Switch Figma file → plugin disconnects**: plugin is bound to the open file. After switching, ask user to Run plugin again.

The error response includes a `hint` field for common cases — read it before debugging.

## Where things live (user's setup)

**This Mac (current):** the bridge runs locally from this repo: `./venv/bin/python bridge.py` (the only dependency is `aiohttp`, in `./venv`), listening on `127.0.0.1:8787`. Figma Desktop on the same Mac connects to `ws://localhost:8787/plugin`. After editing `plugin/*`, re-Run the plugin in Figma (re-Import if `manifest.json` changed); there's no sync step. `/status` can flicker to `false` while the plugin reconnects (every 2s), so check with a real `exec`.

**WSL (older setup)**, only when working from that machine:

- Bridge: `~/figmosha2/` on WSL Ubuntu at `192.168.31.105` (passwordless ssh as `user`)
- Plugin source: `~/figmosha2/plugin/`
- Plugin Windows-side (for Figma to import): `C:\Users\User\figmosha-plugin\`
- Tmux session: `figmosha-bridge`
- Log: `/tmp/figmosha-bridge.log` on WSL

To restart bridge from this dev machine:

```bash
ssh user@192.168.31.105 'bash ~/figmosha2/start-bridge.sh'
```

When you edit `plugin/code.js` or `plugin/manifest.json` here, sync to user's Windows copy and ask them to re-Run (or re-Import if manifest changed):

```bash
rsync -azc -e "ssh -o UserKnownHostsFile=/tmp/khosts" \
  plugin/code.js plugin/ui.html plugin/manifest.json \
  user@192.168.31.105:figmosha-plugin-staging/
ssh user@192.168.31.105 'cp ~/figmosha-plugin-staging/* /mnt/c/Users/User/figmosha-plugin/'
```
