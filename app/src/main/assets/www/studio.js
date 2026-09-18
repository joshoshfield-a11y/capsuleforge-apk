/* CapsuleForge engine — client-side canvas compositing. No dependencies. */
"use strict";

/* ---------- templates ---------- */
const TEMPLATES = {
  ember:  { name: "Ember",  g: ["#2b0f14", "#0e0e14"], glow: "#ff5c5c", grad: "vertical" },
  ocean:  { name: "Ocean",  g: ["#0b2537", "#04101c"], glow: "#41c7ff", grad: "vertical" },
  violet: { name: "Violet", g: ["#2a1440", "#0d0817"], glow: "#b06bff", grad: "vertical" },
  gold:   { name: "Gold",   g: ["#3a2a08", "#120c04"], glow: "#ffc857", grad: "vertical" },
  mono:   { name: "Mono",   g: ["#23232b", "#0c0c10"], glow: "#c8c8d8", grad: "vertical" },
  toxic:  { name: "Toxic",  g: ["#12290f", "#060f05"], glow: "#7dff5c", grad: "vertical" },
};
const SIZES = [
  ["cover",   630,  500,  "itch cover"],
  ["thumb",   315,  250,  "itch thumbnail"],
  ["og",      1200, 630,  "OG/Twitter card"],
  ["square",  512,  512,  "avatar/square"],
  ["banner",  960,  540,  "banner 16:9"],
  ["cap16",   800,  450,  "wide capsule"],
];
const PLATFORMS = ["Windows", "macOS", "Linux", "Web", "Android"];
const FONTS = {
  // Google-font-backed stacks load when online (display=swap); system fallbacks keep it offline-capable
  block:     { name: "Block",        stack: "'Archivo Black','Arial Black','Helvetica Neue',sans-serif" },
  anton:     { name: "Anton",        stack: "'Anton','Arial Black',sans-serif" },
  bebas:     { name: "Bebas Neue",   stack: "'Bebas Neue','Oswald','Arial Narrow',sans-serif" },
  cinzel:    { name: "Cinzel",       stack: "'Cinzel',Georgia,'Times New Roman',serif" },
  orbitron:  { name: "Orbitron",     stack: "'Orbitron','Segoe UI',sans-serif" },
  righteous: { name: "Righteous",    stack: "'Righteous','Trebuchet MS',sans-serif" },
  pixel:     { name: "Pixel",        stack: "'Press Start 2P','Silkscreen',monospace" },
  marker:    { name: "Marker",       stack: "'Permanent Marker','Comic Sans MS',cursive" },
  mono:      { name: "Mono",         stack: "ui-monospace,Menlo,monospace" },
  serif:     { name: "Serif",        stack: "Georgia,'Times New Roman',serif" },
  clean:     { name: "Clean",        stack: "system-ui,'Segoe UI',Roboto,sans-serif" },
  condensed: { name: "Condensed",    stack: "'Oswald','Arial Narrow','Helvetica Neue Condensed',sans-serif" },
  playful:   { name: "Playful",      stack: "'Comic Sans MS','Chalkboard SE',cursive" },
};

const state = {
  template: "ember", size: "cover", anchor: "bl",
  images: [], bgIndex: -1, sample: null,
  title: "HALCYON EXPANSE",
  tagline: "A hand-drawn journey through the ruin belt",
  dev: "skitworks", accent: "#ff5c5c", textcolor: "#ffffff",
  glow: 40, vig: 35, grad: 55, tsize: 0, crop: 50,
  font: "block", ls: 6, upper: true, stroke: 70, strokecol: "#000000", grain: 0, blur: 0,
  safe: false, wm: false,
  badges: true, scan: false, plats: ["Windows", "macOS", "Linux", "Web"],
};

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function lerp(a, b, t) { return a + (b - a) * t; }

/* cover-draw an image into rect, honoring crop slider */
function drawCover(ctx, img, W, H, crop, blur) {
  const iw = img.width, ih = img.height;
  const base = Math.max(W / iw, H / ih);
  const zoom = lerp(base, Math.max(W, H) / Math.min(iw, ih), crop / 100 * 0.6);
  const dw = iw * zoom, dh = ih * zoom;
  if (blur > 0 && "filter" in ctx) ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  if (blur > 0 && "filter" in ctx) ctx.filter = "none";
}

/* ---------- sample key-art generator (seeded, template-tinted) ---------- */
function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSampleArt(W, H, accent, seed) {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  const rnd = mulberry(seed);
  const an = parseInt(accent.slice(1), 16);
  const ar = (an >> 16) & 255, ag = (an >> 8) & 255, ab = an & 255;

  // sky
  const sky = x.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0a0c18"); sky.addColorStop(1, hexA(accent, 0.28));
  x.fillStyle = sky; x.fillRect(0, 0, W, H);

  // stars
  x.fillStyle = "#fff";
  for (let i = 0; i < 140; i++) {
    x.globalAlpha = 0.12 + rnd() * 0.7;
    const s = rnd() < 0.92 ? 1 : 2;
    x.fillRect(rnd() * W, rnd() * H * 0.7, s, s);
  }
  x.globalAlpha = 1;

  // planet / moon
  const px = W * (0.6 + rnd() * 0.25), py = H * (0.2 + rnd() * 0.2), pr = Math.min(W, H) * 0.22;
  const pg = x.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
  pg.addColorStop(0, hexA(accent, 0.95)); pg.addColorStop(1, hexA(accent, 0.05));
  x.fillStyle = pg;
  x.beginPath(); x.arc(px, py, pr, 0, 7); x.fill();
  x.strokeStyle = hexA(accent, 0.5); x.lineWidth = Math.max(1, W / 400);
  x.beginPath(); x.ellipse(px, py, pr * 1.5, pr * 0.45, -0.4, 0, 7); x.stroke();

  // ridge layers
  const layers = 4;
  for (let L = 0; L < layers; L++) {
    const t = L / (layers - 1);
    const baseY = H * lerp(0.55, 1.02, t);
    x.fillStyle = `rgba(${lerp(ar, 6, t) | 0},${lerp(ag, 8, t) | 0},${lerp(ab, 14, t) | 0},${lerp(0.5, 1, t)})`;
    x.beginPath(); x.moveTo(0, H);
    let y = baseY;
    for (let px2 = 0; px2 <= W; px2 += W / 24) {
      y = baseY + (rnd() - 0.5) * H * 0.16 * (1 - t * 0.5);
      x.lineTo(px2, y);
    }
    x.lineTo(W, H); x.closePath(); x.fill();
  }

  // accent spire
  x.fillStyle = hexA(accent, 0.9);
  const sx = W * (0.15 + rnd() * 0.25), sw = W * 0.012, sh = H * (0.3 + rnd() * 0.2);
  x.beginPath();
  x.moveTo(sx, H * 0.78); x.lineTo(sx + sw, H * 0.78);
  x.lineTo(sx + sw / 2, H * 0.78 - sh); x.closePath(); x.fill();
  x.fillStyle = hexA(accent, 0.25);
  x.beginPath(); x.arc(sx + sw / 2, H * 0.78 - sh, sw * 3.2, 0, 7); x.fill();

  return c;
}

/* ---------- text layout ---------- */
function anchorPoint(a, W, H, pad) {
  const xs = { l: pad, c: W / 2, r: W - pad };
  const ys = { t: pad, c: H / 2, b: H - pad };
  return [xs[a[1]], ys[a[0]]];
}

function drawTextBlock(ctx, W, H, o) {
  const pad = Math.round(Math.min(W, H) * 0.055);
  // when badges are on, lift bottom-anchored text so rows don't collide
  const lift = o.badges ? Math.round(min(W, H) * 0.105) : 0;
  const [ax0, ay0] = anchorPoint(o.anchor, W, H, pad);
  const ax = ax0, ay = o.anchor[0] === "b" ? ay0 - lift : ay0;
  const align = o.anchor[1] === "l" ? "left" : o.anchor[1] === "r" ? "right" : "center";
  const base = o.anchor[0] === "t" ? 1 : o.anchor[0] === "c" ? 0 : -1;

  const font = (FONTS[o.font] || FONTS.block).stack;
  const title = o.upper ? o.title.toUpperCase() : o.title;
  // title font size: auto from canvas size unless overridden
  let ts = o.tsize || Math.round(Math.min(W, H) * (title.length > 14 ? 0.105 : 0.13));
  ctx.font = `700 ${ts}px ${font}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = (ts * (o.ls || 0) / 100) + "px";   // BEFORE wrap so measureText sees it
  const lines = wrap(ctx, title, W - pad * 2, ctx.font);
  const lh = ts * 1.06;
  const blockH = lines.length * lh + (o.tagline ? ts * 0.52 : 0) + (o.dev ? ts * 0.4 : 0);

  ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  let y = base === 0 ? ay - blockH / 2 + lh
        : base > 0 ? ay + lh
        : ay - blockH + lh;

  const gx = align === "left" ? ax : align === "right" ? ax : ax;

  // title with glow + stroke
  ctx.font = `700 ${ts}px ${font}`;
  ctx.shadowColor = o.glowCol; ctx.shadowBlur = ts * (o.glow / 100) * 0.9;
  if (o.stroke > 0) {
    ctx.lineWidth = Math.max(1, ts / 14 * (o.stroke / 70));
    ctx.strokeStyle = hexA(o.strokeCol || "#000000", 0.75);
  }
  for (const ln of lines) {
    if (o.stroke > 0) ctx.strokeText(ln, gx, y);
    ctx.fillStyle = o.text; ctx.fillText(ln, gx, y); y += lh;
  }
  ctx.shadowBlur = 0;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

  if (o.tagline) {
    y += ts * 0.06;
    const fs = Math.round(ts * 0.34);
    ctx.font = `${fs}px ${font}`;
    ctx.fillStyle = hexA(o.text, 0.85); ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = fs / 3;
    for (const ln of wrap(ctx, o.tagline, W - pad * 2, ctx.font)) {
      ctx.fillText(ln, gx, y + fs); y += fs * 1.35;
    }
    ctx.shadowBlur = 0;
  }
  if (o.dev) {
    const fs = Math.round(ts * 0.27);
    ctx.font = `700 ${fs}px ${font}`;
    ctx.fillStyle = o.accent; ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = fs / 3;
    const tag = "by " + o.dev;
    if (base > 0) { // below title block
      ctx.textAlign = align; ctx.fillText(tag, gx, y + fs * 1.1);
    } else if (base === 0) {
      ctx.fillText(tag, gx, y + fs * 1.1);
    } else { // top corner mark
      ctx.textAlign = o.anchor[1] === "l" ? "right" : o.anchor[1] === "r" ? "left" : "center";
      const cx = o.anchor[1] === "l" ? W - pad : o.anchor[1] === "r" ? pad : ax;
      const cy = o.anchor[0] === "b" ? pad + fs : ay;
      ctx.fillText(tag, cx, cy + fs * 0.8);
    }
    ctx.shadowBlur = 0;
  }
}

function wrap(ctx, text, maxW, font) {
  ctx.font = font;
  const words = text.split(/\s+/), out = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) out.push(cur);
  return out.slice(0, 4);
}

/* ---------- badges ---------- */
function drawBadges(ctx, W, H, o) {
  if (!o.badges || !o.plats.length) return;
  const fs = Math.round(Math.min(W, H) * 0.036);
  ctx.font = `700 ${fs}px ui-monospace, Menlo, monospace`;
  const items = o.plats;
  const gap = fs * 0.5, padX = fs * 0.75, h = fs * 1.9;
  const widths = items.map(p => ctx.measureText(p).width + padX * 2);
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = (W - totalW) / 2, y = H - h - Math.round(min(W, H) * 0.035);
  for (let i = 0; i < items.length; i++) {
    ctx.fillStyle = "rgba(8,8,12,0.66)";
    rrect(ctx, x, y, widths[i], h, h / 2); ctx.fill();
    ctx.strokeStyle = hexA(o.accent, 0.85); ctx.lineWidth = Math.max(1, fs / 10);
    rrect(ctx, x, y, widths[i], h, h / 2); ctx.stroke();
    ctx.fillStyle = o.text; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(items[i], x + widths[i] / 2, y + h / 2 + fs * 0.06);
    x += widths[i] + gap;
  }
}
function min(a, b) { return Math.min(a, b); }
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/* ---------- main render ---------- */
function render(W, H, opts) {
  const t = TEMPLATES[state.template];
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");

  // 1. background
  const src = state.bgIndex >= 0 ? state.images[state.bgIndex] : state.sample;
  if (src) drawCover(x, src, W, H, state.crop, state.blur);
  else {
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, t.g[0]); g.addColorStop(1, t.g[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }

  // 2. template gradient overlay for text legibility
  const ov = x.createLinearGradient(0, H * 0.25, 0, H);
  ov.addColorStop(0, "rgba(0,0,0,0)");
  ov.addColorStop(1, `rgba(0,0,0,${state.grad / 100})`);
  x.fillStyle = ov; x.fillRect(0, 0, W, H);

  // 3. scanlines
  if (state.scan) {
    x.fillStyle = "rgba(0,0,0,0.16)";
    for (let y = 0; y < H; y += 4) x.fillRect(0, y, W, 1);
  }

  // 4. vignette
  if (state.vig > 0) {
    const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(0,0,0,${state.vig / 100})`);
    x.fillStyle = v; x.fillRect(0, 0, W, H);
  }

  // 4.5 film grain (seeded, stable across refreshes)
  if (state.grain > 0) {
    const nz = document.createElement("canvas");
    const ns = 3; // 1/3-res noise tiled
    nz.width = Math.ceil(W / ns); nz.height = Math.ceil(H / ns);
    const nx = nz.getContext("2d");
    const id = nx.createImageData(nz.width, nz.height);
    const rnd = mulberry(1234);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = (rnd() * 255) | 0;
      id.data[i] = id.data[i+1] = id.data[i+2] = v; id.data[i+3] = 255;
    }
    nx.putImageData(id, 0, 0);
    x.save(); x.globalAlpha = state.grain / 100 * 0.5; x.globalCompositeOperation = "overlay";
    x.drawImage(nz, 0, 0, W, H); x.restore();
  }

  // 5. text
  drawTextBlock(x, W, H, {
    anchor: state.anchor, title: state.title, tagline: state.tagline, dev: state.dev,
    text: state.textcolor, accent: state.accent, glow: state.glow, glowCol: t.glow,
    tsize: state.tsize, badges: state.badges,
    font: state.font, ls: state.ls, upper: state.upper,
    stroke: state.stroke, strokeCol: state.strokecol,
  });

  // 6. badges
  drawBadges(x, W, H, { badges: state.badges, plats: state.plats, accent: state.accent, text: state.textcolor });

  // 7. optional watermark (on by default when toggled; burned into exports)
  if ((!opts || opts.wm !== false) && state.wm) {
    const wf = Math.round(Math.min(W, H) * 0.024);
    x.font = `${wf}px ui-monospace, Menlo, monospace`;
    x.textAlign = "right"; x.textBaseline = "bottom";
    x.fillStyle = "rgba(255,255,255,0.45)";
    x.fillText("made with CapsuleForge", W - wf, H - wf * 0.8);
  }

  // 8. safe-area guide — preview only, NEVER exported
  if (opts && opts.guide && state.safe) {
    const gx = W * 0.08, gy = H * 0.08;
    x.save();
    x.strokeStyle = "rgba(255,255,255,0.5)"; x.lineWidth = Math.max(1, W / 400);
    x.setLineDash([Math.max(4, W / 60), Math.max(3, W / 90)]);
    x.strokeRect(gx, gy, W - gx * 2, H - gy * 2);
    x.restore();
  }

  return c;
}

/* ---------- preview ---------- */
function refresh() {
  const [id, W, H] = SIZES.find(s => s[0] === state.size);
  const out = render(W, H, { guide: true });
  const pv = $("preview");
  pv.width = W; pv.height = H;
  pv.getContext("2d").drawImage(out, 0, 0);
  window.__lastRender = out;
}

/* ---------- export ---------- */
function download(canvas, name) {
  const url = canvas.toDataURL("image/png");
  if (window.AndroidBridge && typeof window.AndroidBridge.savePNG === "function") {
    window.AndroidBridge.savePNG(name, url); return; }   // WebView: hand to native bridge
  const a = document.createElement("a");
  a.download = name;
  a.href = url;
  a.click();
}
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "game"; }

/* ---------- UI wiring ---------- */
function init() {
  // template swatches
  const tg = $("tpls");
  for (const [key, t] of Object.entries(TEMPLATES)) {
    const d = document.createElement("div");
    d.className = "tpl" + (key === state.template ? " on" : "");
    d.style.background = `linear-gradient(135deg, ${t.g[0]}, ${t.g[1]} 60%), radial-gradient(circle at 70% 30%, ${t.glow}44, transparent 60%)`;
    d.innerHTML = `<span>${t.name}</span>`;
    d.onclick = () => {
      state.template = key;
      [...tg.children].forEach((el, i) => el.classList.toggle("on", Object.keys(TEMPLATES)[i] === key));
      if (!state.images.length) genSample(true);   // re-tint sample to the new template
      refresh();
    };
    tg.appendChild(d);
  }

  // sizes
  const sg = $("sizes");
  for (const [id, W, H, label] of SIZES) {
    const b = document.createElement("button");
    b.textContent = `${label} ${W}×${H}`;
    b.className = id === state.size ? "on" : "";
    b.onclick = () => {
      state.size = id;
      [...sg.children].forEach((el, i) => el.classList.toggle("on", SIZES[i][0] === id));
      refresh();
    };
    sg.appendChild(b);
  }

  // platform checkboxes
  const pg = $("plats");
  for (const p of PLATFORMS) {
    const l = document.createElement("label");
    l.innerHTML = `<input type="checkbox" ${state.plats.includes(p) ? "checked" : ""}> ${p}`;
    l.querySelector("input").onchange = e => {
      state.plats = e.target.checked ? [...state.plats, p] : state.plats.filter(x => x !== p);
      refresh();
    };
    pg.appendChild(l);
  }

  // font select
  const fs = $("font");
  for (const [key, f] of Object.entries(FONTS)) {
    const o = document.createElement("option");
    o.value = key; o.textContent = f.name;
    if (key === state.font) o.selected = true;
    fs.appendChild(o);
  }
  fs.onchange = e => { state.font = e.target.value; refresh(); };

  // safe-area guide + watermark toggles
  $("safe").onchange = e => { state.safe = e.target.checked; refresh(); };
  $("wm").onchange = e => { state.wm = e.target.checked; refresh(); };

  // reset art direction to defaults (keeps uploaded images)
  $("reset").onclick = () => {
    Object.assign(state, {
      template: "ember", font: "block", anchor: "bl",
      accent: "#ff5c5c", textcolor: "#ffffff",
      glow: 40, vig: 35, grad: 55, tsize: 0, crop: 50,
      ls: 6, upper: true, stroke: 70, strokecol: "#000000",
      grain: 0, blur: 0, safe: false, wm: false, scan: false,
      badges: true, plats: ["Windows", "macOS", "Linux", "Web"],
    });
    $("font").value = "block"; $("anchor").value = "bl";
    $("accent").value = "#ff5c5c"; $("textcolor").value = "#ffffff";
    $("upper").checked = true; $("scan").checked = false;
    $("badges").checked = true; $("safe").checked = false; $("wm").checked = false;
    $("glow").value = 40; $("glowv").textContent = "40%";
    $("vig").value = 35; $("vigv").textContent = "35%";
    $("grad").value = 55; $("gradv").textContent = "55%";
    $("crop").value = 50; $("cropv").textContent = "50%";
    $("ls").value = 6; $("lsv").textContent = "6%";
    $("stroke").value = 70; $("strokev").textContent = "70%";
    $("strokecol").value = "#000000";
    $("grain").value = 0; $("grainv").textContent = "0%";
    $("blur").value = 0; $("blurv").textContent = "0px";
    $("tsize").value = 0; $("tsizev").textContent = "auto";
    document.querySelectorAll("#plats input").forEach((el, i) =>
      el.checked = state.plats.includes(PLATFORMS[i]));
    [...$("tpls").children].forEach((el, i) =>
      el.classList.toggle("on", Object.keys(TEMPLATES)[i] === "ember"));
    if (!state.images.length) genSample(true);
    refresh();
  };

  // randomize art direction
  $("rand").onclick = () => {
    const keys = Object.keys(TEMPLATES), fkeys = Object.keys(FONTS);
    const anchors = ["bl", "bc", "br", "cl", "cc", "cr", "tl", "tc", "tr"];
    state.template = keys[(Math.random() * keys.length) | 0];
    state.font = fkeys[(Math.random() * fkeys.length) | 0];
    state.anchor = anchors[(Math.random() * anchors.length) | 0];
    state.accent = "#" + ((Math.random() * 0xffffff) | 0).toString(16).padStart(6, "0");
    $("accent").value = state.accent; $("anchor").value = state.anchor;
    fs.value = state.font;
    [...$("tpls").children].forEach((el, i) => el.classList.toggle("on", keys[i] === state.template));
    if (!state.images.length) genSample(true);
    refresh();
  };

  // text inputs
  const bind = (id, key) => { $(id).oninput = e => { state[key] = e.target.value; refresh(); }; };
  bind("title", "title"); bind("tagline", "tagline"); bind("dev", "dev");
  $("accent").oninput = e => { state.accent = e.target.value; refresh(); };
  $("textcolor").oninput = e => { state.textcolor = e.target.value; refresh(); };

  // ranges
  const bindR = (id, key, label) => {
    $(id).oninput = e => {
      state[key] = +e.target.value;
      if (label) $(label).textContent = e.target.value + "%";
      refresh();
    };
  };
  bindR("glow", "glow", "glowv"); bindR("vig", "vig", "vigv");
  bindR("grad", "grad", "gradv"); bindR("crop", "crop", "cropv");
  $("tsize").oninput = e => {
    state.tsize = +e.target.value;
    $("tsizev").textContent = state.tsize ? state.tsize + "px" : "auto";
    refresh();
  };
  $("anchor").onchange = e => { state.anchor = e.target.value; refresh(); };
  $("badges").onchange = e => { state.badges = e.target.checked; refresh(); };
  $("upper").onchange = e => { state.upper = e.target.checked; refresh(); };
  $("strokecol").oninput = e => { state.strokecol = e.target.value; refresh(); };
  bindR("ls", "ls", "lsv"); bindR("stroke", "stroke", "strokev");
  bindR("grain", "grain", "grainv");
  $("blur").oninput = e => { state.blur = +e.target.value; $("blurv").textContent = e.target.value + "px"; refresh(); };
  $("scan").onchange = e => { state.scan = e.target.checked; refresh(); };

  // drop zone
  const dz = $("drop"), fi = $("file");
  dz.onclick = () => fi.click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add("over"); };
  dz.ondragleave = () => dz.classList.remove("over");
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove("over"); loadFiles(e.dataTransfer.files); };
  fi.onchange = () => loadFiles(fi.files);

  $("sample").onclick = () => genSample(true);

  // export
  $("export").onclick = () => {
    const [id, W, H] = SIZES.find(s => s[0] === state.size);
    download(render(W, H), `${slug(state.title)}-${id}-${W}x${H}.png`);
  };
  $("exportall").onclick = async () => {
    for (const [id, W, H] of SIZES) {
      download(render(W, H), `${slug(state.title)}-${id}-${W}x${H}.png`);
      await new Promise(r => setTimeout(r, 350)); // let the browser breathe between downloads
    }
  };

  // brand persistence
  try {
    const saved = JSON.parse(localStorage.getItem("capsuleforge") || "null");
    if (saved) {
      Object.assign(state, saved);
      $("title").value = state.title; $("tagline").value = state.tagline;
      $("dev").value = state.dev; $("accent").value = state.accent;
      $("textcolor").value = state.textcolor;
    }
  } catch (e) {}
  const persist = () => {
    const { title, tagline, dev, accent, textcolor, template, anchor, glow, vig, grad, badges, plats, font, ls, upper, stroke, strokecol, grain, blur, safe, wm } = state;
    try { localStorage.setItem("capsuleforge", JSON.stringify({ title, tagline, dev, accent, textcolor, template, anchor, glow, vig, grad, badges, plats, font, ls, upper, stroke, strokecol, grain, blur, safe, wm })); } catch (e) {}
  };
  document.addEventListener("input", persist);

  genSample();
  refresh();
}

function genSample(force) {
  if (state.sample && !force) return;
  const t = TEMPLATES[state.template];
  state.sample = makeSampleArt(1280, 720, t.glow, [...state.title].reduce((a, c) => a + c.charCodeAt(0), 7));
  if (state.bgIndex < 0) state.bgIndex = -1; // sample used when no uploaded image selected
  refresh();
}

function loadFiles(files) {
  let pending = files.length;
  if (!pending) return;
  [...files].forEach(f => {
    const img = new Image();
    img.onload = () => {
      state.images.push(img);
      addThumb(img, state.images.length - 1);
      if (state.images.length === 1) { state.bgIndex = 0; markThumb(0); }
      if (--pending === 0) refresh();
    };
    img.src = URL.createObjectURL(f);
  });
}

function addThumb(img, idx) {
  const t = document.createElement("img");
  t.src = img.src; t.className = "thumb";
  t.onclick = () => { state.bgIndex = idx; markThumb(idx); refresh(); };
  t.dataset.idx = idx;
  $("thumbs").appendChild(t);
}
function markThumb(idx) {
  document.querySelectorAll(".thumb").forEach(el =>
    el.classList.toggle("on", +el.dataset.idx === idx));
}

// ---------- touch sliders ----------
// Native range inputs are unreliable under touch: the first touchmove snaps the
// value before the browser claims the gesture for scrolling. Take over: lock the
// gesture direction on the dominant axis — horizontal adjusts, vertical scrolls.
function initTouchSliders() {
  document.querySelectorAll("input[type=range]").forEach((el) => {
    el.style.touchAction = "none";
    let startX = 0, startY = 0, prevY = 0, mode = null;
    el.addEventListener("touchstart", (e) => {
      e.preventDefault();                    // block native tap-snap: value only changes on horizontal drag
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; prevY = t.clientY; mode = null;
    }, { passive: false });
    el.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (!mode && (Math.abs(dx) > 6 || Math.abs(dy) > 6))
        mode = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      if (mode === "h") {
        e.preventDefault();                      // no native adjust, no scroll
        const r = el.getBoundingClientRect();
        const min = +el.min, max = +el.max;
        let v = min + (max - min) * ((t.clientX - r.left) / r.width);
        v = Math.max(min, Math.min(max, Math.round(v)));
        if (v !== +el.value) {
          el.value = v;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else if (mode === "v") {
        window.scrollBy(0, prevY - t.clientY);   // content follows the finger
      }
      prevY = t.clientY;
    }, { passive: false });
  });
}
initTouchSliders();

init();
/* test hook */
window.__cf = { state, render, SIZES, TEMPLATES, refresh };
