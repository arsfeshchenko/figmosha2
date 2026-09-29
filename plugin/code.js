figma.showUI(__html__, { width: 240, height: 32, title: "Figmosha" });

// The plugin only ever shows the compact strip: connection dot + refresh.
figma.ui.postMessage({ type: "init-mode", compact: true });

function safeStringify(value) {
  if (value === undefined) return null;
  try { return JSON.parse(JSON.stringify(value)); } catch (e) {
    try { return String(value); } catch (e2) { return null; }
  }
}

function asText(value, logs) {
  try {
    if (value !== undefined) {
      return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    }
  } catch (e) { /* unserializable — fall back to logs */ }
  return logs.length > 0 ? logs.join("\n") : "Done";
}

// ─── helpers exposed as `h.*` to every exec ──────────────────────────────

async function resolveVar(varOrId) {
  if (varOrId == null) return null;
  if (typeof varOrId === "string") {
    return await figma.variables.getVariableByIdAsync(varOrId);
  }
  return varOrId;
}

const HELPERS = {
  // Bind fill paint at index to a variable (id or instance)
  async bF(node, idx, varOrId) {
    const v = await resolveVar(varOrId);
    if (!v) throw new Error("h.bF: variable not found: " + varOrId);
    const f = JSON.parse(JSON.stringify(node.fills));
    f[idx] = figma.variables.setBoundVariableForPaint(f[idx], "color", v);
    node.fills = f;
    return v;
  },

  // Bind stroke paint at index
  async bS(node, idx, varOrId) {
    const v = await resolveVar(varOrId);
    if (!v) throw new Error("h.bS: variable not found: " + varOrId);
    const s = JSON.parse(JSON.stringify(node.strokes));
    s[idx] = figma.variables.setBoundVariableForPaint(s[idx], "color", v);
    node.strokes = s;
    return v;
  },

  // Bind numeric property (radii, padding, sizes, itemSpacing, etc.)
  async bN(node, prop, varOrId) {
    const v = await resolveVar(varOrId);
    if (!v) throw new Error("h.bN: variable not found: " + varOrId);
    node.setBoundVariable(prop, v);
    return v;
  },

  // First descendant by exact name
  findByName(root, name) {
    return root.findOne((n) => n.name === name);
  },

  // All descendants by exact name
  findAllByName(root, name) {
    return root.findAll((n) => n.name === name);
  },

  // Dump subtree as indented text
  dumpTree(node, opts) {
    opts = opts || {};
    const maxDepth = opts.maxDepth == null ? 99 : opts.maxDepth;
    const showSize = opts.showSize !== false;
    const showText = opts.showText !== false;
    const lines = [];
    const walk = (n, d) => {
      if (d > maxDepth) return;
      const pad = "  ".repeat(d);
      let line = pad + n.name + " [" + n.type + "] " + n.id;
      if (showSize && n.width !== undefined) {
        line += " " + Math.round(n.width) + "×" + Math.round(n.height);
      }
      if (showText && n.type === "TEXT") line += ' "' + n.characters + '"';
      lines.push(line);
      if (n.children) for (const c of n.children) walk(c, d + 1);
    };
    walk(node, 0);
    return lines.join("\n");
  },

  // Load every unique font in subtree, then run async fn
  async withFonts(rootNode, asyncFn) {
    const texts = rootNode.findAll
      ? rootNode.findAll((n) => n.type === "TEXT")
      : (rootNode.type === "TEXT" ? [rootNode] : []);
    const seen = new Set();
    const fonts = [];
    for (const t of texts) {
      // mixed-font nodes report a symbol; read every range's font instead of skipping them
      const list = typeof t.fontName === "symbol"
        ? t.getRangeAllFontNames(0, t.characters.length)
        : [t.fontName];
      for (const fn of list) {
        const key = fn.family + "|" + fn.style;
        if (!seen.has(key)) { seen.add(key); fonts.push(fn); }
      }
    }
    await Promise.all(fonts.map((f) => figma.loadFontAsync(f)));
    return await asyncFn();
  },

  // Set a text node's characters with auto font load (mixed-font nodes included;
  // the new text takes the first character's style, as Figma does)
  async setText(node, text) {
    const fonts = typeof node.fontName === "symbol"
      ? node.getRangeAllFontNames(0, node.characters.length)
      : [node.fontName];
    await Promise.all(fonts.map((f) => figma.loadFontAsync(f)));
    node.characters = text;
  },

  // Clone node and place it next to the original
  cloneNext(node, opts) {
    opts = opts || {};
    const direction = opts.direction || "right";
    const gap = opts.gap == null ? 100 : opts.gap;
    const c = node.clone();
    node.parent.appendChild(c);
    if (direction === "right") { c.x = node.x + node.width + gap; c.y = node.y; }
    else if (direction === "left")  { c.x = node.x - node.width - gap; c.y = node.y; }
    else if (direction === "down")  { c.x = node.x; c.y = node.y + node.height + gap; }
    else if (direction === "up")    { c.x = node.x; c.y = node.y - node.height - gap; }
    if (opts.name) c.name = opts.name;
    return c;
  },

  // Set instance variant properties
  async variant(instance, props) {
    await instance.setProperties(props);
    return instance;
  },

  // Available variants for an instance's component
  async variantsOf(instance) {
    const main = await instance.getMainComponentAsync();
    if (!main) return null;
    const set = main.parent && main.parent.type === "COMPONENT_SET" ? main.parent : null;
    return set
      ? { current: main.name, groups: set.variantGroupProperties, all: set.children.map(c => c.name) }
      : { current: main.name, groups: null, all: null };
  },

  // Round + outline (ported from the Birb Toolbox plugin).
  // Radius defaults to width/ratio (6); pass `radius` to set it explicitly,
  // `stroke: null` to skip the outline. Defaults to the whole selection.
  roundOutline(target, opts) {
    opts = opts || {};
    const ratio  = opts.ratio  == null ? 6 : opts.ratio;
    const weight = opts.weight == null ? 4 : opts.weight;
    const align  = opts.align  || "OUTSIDE";
    const stroke = opts.stroke === undefined
      ? { r: 1, g: 1, b: 1 }
      : opts.stroke;

    let nodes;
    if (!target) nodes = figma.currentPage.selection.slice();
    else if (Array.isArray(target)) nodes = target;
    else nodes = [target];

    const done = [];
    for (const n of nodes) {
      if (!("cornerRadius" in n) || typeof n.width !== "number") continue;
      n.cornerRadius = opts.radius == null ? Math.round(n.width / ratio) : opts.radius;
      if (stroke) {
        n.strokes = [{ type: "SOLID", color: stroke, opacity: 1 }];
        n.strokeWeight = weight;
        n.strokeAlign = align;
      }
      done.push({ id: n.id, name: n.name, radius: n.cornerRadius });
    }
    return done;
  },

  // Paint nodes a flat colour (white by default).
  fillSolid(target, color) {
    const c = color || { r: 1, g: 1, b: 1 };
    const nodes = !target ? figma.currentPage.selection.slice()
                : Array.isArray(target) ? target : [target];
    const done = [];
    for (const n of nodes) {
      if (!("fills" in n)) continue;
      n.fills = [{ type: "SOLID", color: c, opacity: 1 }];
      done.push({ id: n.id, name: n.name });
    }
    return done;
  },

  // Scale nodes so their width is exactly `width`, proportionally
  // (rescale = the scale tool: children, text and strokes scale too).
  scaleToWidth(target, width) {
    const w = width == null ? 375 : width;
    const nodes = !target ? figma.currentPage.selection.slice()
                : Array.isArray(target) ? target : [target];
    const done = [], skipped = [];
    for (const n of nodes) {
      if (!("rescale" in n) || typeof n.width !== "number" || n.width === 0) continue;
      try { n.rescale(w / n.width); done.push({ id: n.id, name: n.name, width: Math.round(n.width) }); }
      catch (e) { skipped.push({ id: n.id, name: n.name, reason: String(e.message || e) }); }
    }
    return { scaled: done, skipped };
  },

  // Set one font on every TEXT node in the selection/subtree.
  // Fonts missing locally only disqualify the nodes that use them.
  async setFont(target, fontName) {
    const roots = !target ? figma.currentPage.selection.slice()
                : Array.isArray(target) ? target : [target];
    const texts = [];
    const collect = (n) => {
      if (n.type === "TEXT") texts.push(n);
      else if ("children" in n) for (const c of n.children) collect(c);
    };
    for (const r of roots) collect(r);
    if (!texts.length) return { updated: 0, skipped: 0, reason: "no text nodes" };

    const key = (f) => f.family + " " + f.style;
    const per = texts.map((t) => t.getRangeAllFontNames(0, t.characters.length));
    const toLoad = new Map([[key(fontName), fontName]]);
    for (const fonts of per) for (const f of fonts) toLoad.set(key(f), f);

    const failed = new Set();
    await Promise.all([...toLoad].map(([k, f]) =>
      figma.loadFontAsync(f).catch(() => failed.add(k))
    ));
    if (failed.has(key(fontName))) {
      throw new Error("font not available: " + key(fontName));
    }
    let updated = 0;
    texts.forEach((t, i) => {
      if (per[i].some((f) => failed.has(key(f)))) return;
      t.fontName = fontName;
      updated++;
    });
    return { updated, skipped: texts.length - updated };
  },

  // Quick async accessors
  async node(id)      { return await figma.getNodeByIdAsync(id); },
  async var_(idOrKey) { return await resolveVar(idOrKey); },
  async importComp(key) { return await figma.importComponentByKeyAsync(key); },
  async importVar(key)  { return await figma.variables.importVariableByKeyAsync(key); },
};

// ──────────────────────────────────────────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  // Toolbox actions fired from the compact strip.
  if (msg.type === "act") {
    try {
      if (msg.action === "round-stroke") {
        const d = HELPERS.roundOutline();
        figma.notify(d.length ? d.length + (d.length === 1 ? " shape rounded" : " shapes rounded")
                              : "Select a frame, component or rectangle first");
      } else if (msg.action === "fill-white") {
        const d = HELPERS.fillSolid();
        figma.notify(d.length ? d.length + (d.length === 1 ? " layer filled white" : " layers filled white")
                              : "Select something that can take a fill");
      } else if (msg.action === "scale-375") {
        const r = HELPERS.scaleToWidth(null, 375);
        figma.notify(!r.scaled.length && !r.skipped.length ? "Select a frame, image or shape first"
          : r.skipped.length ? r.scaled.length + " scaled to 375px, " + r.skipped.length + " skipped"
          : r.scaled.length + " scaled to 375px wide");
      } else if (msg.action === "font-sfpro" || msg.action === "font-montserrat") {
        const font = msg.action === "font-sfpro"
          ? { family: "SF Pro Display", style: "Regular" }
          : { family: "Montserrat", style: "Bold Italic" };
        const r = await HELPERS.setFont(null, font);
        figma.notify(r.reason ? "Select some text first"
          : r.skipped ? r.updated + " updated, " + r.skipped + " skipped (missing fonts)"
          : r.updated + (r.updated === 1 ? " layer updated" : " layers updated"));
      }
    } catch (e) { figma.notify(String(e.message || e), { error: true }); }
    // Without this, every click since the panel opened collapses into one undo step.
    figma.commitUndo();
    return;
  }
  if (msg.type !== "exec") return;
  const { id, code } = msg;

  const logs = [];
  const print = (...args) => {
    const text = args.map((a) =>
      typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
    ).join(" ");
    logs.push(text);
    figma.ui.postMessage({ type: "log", id, text });
  };

  try {
    const fn = new Function(
      "figma", "print", "h",
      `return (async () => { ${code} })();`
    );
    const result = await fn(figma, print, HELPERS);

    figma.ui.postMessage({
      type: "result",
      id,
      text: asText(result, logs),
      value: safeStringify(result),
    });
  } catch (e) {
    figma.ui.postMessage({
      type: "error",
      id,
      text: (e && e.message) || String(e),
      stack: (e && e.stack) || null,
    });
  }
};
