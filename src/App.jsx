import { useState, useMemo, useEffect, useRef } from "react";
import { FONT_B64 } from "./fontB64";
import "./App.css";

const W = 1200, H = 630, PAD = 80;
const API = import.meta.env.PROD ? "" : "http://localhost:3001";
const FONT = "TestDieGroteskVF";

const LOGO = `
  <g transform="translate(${PAD},${PAD})">
    <path d="M44.8 0V32H57.6V12.8H64L70.4 19.2V32H83.2V12.8L70.4 0H44.8Z" fill="#FFFFFF"/>
    <path d="M128 12.8L115.2 0H102.4L89.6 12.8V32H102.4V19.2L108.8 12.8L115.2 19.2V32H128V12.8Z" fill="#FFFFFF"/>
    <path d="M0 6.4L12.8 19.2V32H25.6V19.2L38.4 6.4V0H25.6L19.2 6.4L12.8 0H0V6.4Z" fill="#FFFFFF"/>
  </g>`;

/* ── text measuring ── */
let _ctx = null;
const ctx = () => (_ctx ||= document.createElement("canvas").getContext("2d"));

function wrapText(text, font, maxWidth, maxLines) {
  const c = ctx(); c.font = font;
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = []; let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (c.measureText(t).width <= maxWidth) { line = t; }
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  const kept = lines.slice(0, maxLines);
  if (lines.length > maxLines) kept[maxLines - 1] += "…";
  return { lines: kept, size: parseInt(font) };
}

const STD = []; for (let s = 60; s >= 38; s -= 2) STD.push(s);
const HERO = []; for (let s = 94; s >= 50; s -= 3) HERO.push(s);

function fitHeadline(text, maxWidth, sizes, maxLines, weight) {
  for (const size of sizes) {
    const r = wrapText(text, `${weight} ${size}px '${FONT}', sans-serif`, maxWidth, maxLines);
    if (r.lines.length <= maxLines) return { ...r, size };
  }
  const size = sizes[sizes.length - 1];
  return { ...wrapText(text, `${weight} ${size}px '${FONT}', sans-serif`, maxWidth, maxLines), size };
}

const esc = (s) => String(s || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

/* ── SVG builder ── */
function buildInner(state, opts = {}) {
  const { eyebrow, headline, subtitle, layout, tagline, img } = state;
  const hero = layout === "hero";
  const caption = layout === "caption";
  let parts = "";

  if (caption) {
    const hSize = 48, hLh = Math.round(hSize * 1.05), hTrack = (hSize * 0.008).toFixed(2);
    const sSize = 28, sLh = Math.round(sSize * 1.28);
    const textW = 700;
    const headLines = wrapText(headline || "Untitled", `600 ${hSize}px '${FONT}', sans-serif`, textW, 3).lines;
    const subLines = subtitle ? wrapText(subtitle, `400 ${sSize}px '${FONT}', sans-serif`, textW, 2).lines : [];
    const lastB = H - 72;
    const subLastB = lastB;
    const subFirstB = subLastB - (subLines.length - 1) * sLh;
    const headLastB = subLines.length ? subFirstB - 40 : lastB;
    const headFirstB = headLastB - (headLines.length - 1) * hLh;
    parts += `<text font-family="'${FONT}',sans-serif" font-weight="600" font-size="${hSize}" letter-spacing="${hTrack}" fill="#FFFFFF">` +
      headLines.map((l, i) => `<tspan x="${PAD}" y="${headFirstB + i * hLh}">${esc(l)}</tspan>`).join("") + `</text>`;
    if (subLines.length) {
      parts += `<text font-family="'${FONT}',sans-serif" font-weight="400" font-size="${sSize}" fill="#A1A1A6">` +
        subLines.map((l, i) => `<tspan x="${PAD}" y="${subFirstB + i * sLh}">${esc(l)}</tspan>`).join("") + `</text>`;
    }
  } else {
    const textW = img ? (hero ? 700 : 560) : (hero ? 980 : 900);
    const hWeight = 600;
    const fit = fitHeadline(headline || "Untitled", textW, hero ? HERO : STD, 3, hWeight);
    const hSize = fit.size, hLh = Math.round(hSize * 1.04);
    const hTrack = hSize * 0.008;
    const subSize = hero ? 32 : 28, subLh = Math.round(subSize * 1.25);
    const sub = subtitle ? wrapText(subtitle, `400 ${subSize}px '${FONT}', sans-serif`, textW, 2).lines : [];
    const ebSize = 20;
    const ebH = eyebrow ? 40 : 0;
    const blockH = ebH + fit.lines.length * hLh + (sub.length ? 20 + sub.length * subLh : 0);
    let topY = hero ? Math.max(150, Math.round((H - blockH) / 2) - 6) : 196;
    let y = topY;
    if (eyebrow) {
      parts += `<text x="${PAD}" y="${y + 16}" font-family="'${FONT}',sans-serif" font-weight="500" font-size="${ebSize}" fill="#8E8E93">${esc(eyebrow)}</text>`;
      y += 40;
    }
    const hFirst = y + Math.round(hSize * 0.80);
    parts += `<text font-family="'${FONT}',sans-serif" font-weight="${hWeight}" font-size="${hSize}" letter-spacing="${hTrack.toFixed(2)}" fill="#FFFFFF">` +
      fit.lines.map((l, i) => `<tspan x="${PAD}" y="${hFirst + i * hLh}">${esc(l)}</tspan>`).join("") + `</text>`;
    y = hFirst + (fit.lines.length - 1) * hLh + Math.round(hSize * 0.28);
    if (sub.length) {
      y += 20;
      const sFirst = y + Math.round(subSize * 0.80);
      parts += `<text font-family="'${FONT}',sans-serif" font-weight="400" font-size="${subSize}" fill="#A1A1A6">` +
        sub.map((l, i) => `<tspan x="${PAD}" y="${sFirst + i * subLh}">${esc(l)}</tspan>`).join("") + `</text>`;
    }
  }

  const tag = tagline
    ? `<text x="${W - 48}" y="${H - 48}" text-anchor="end" font-family="'${FONT}',sans-serif" font-weight="500" font-size="20" fill="#FFFFFF">Building What&#39;s Next</text>`
    : "";

  const fontFace = opts.embedFont
    ? `<style>@font-face{font-family:'${FONT}';font-style:normal;src:url(data:font/ttf;base64,${FONT_B64}) format('truetype');}text{font-optical-sizing:auto;}</style>`
    : "";

  const defs = `<defs>${fontFace}
    <linearGradient id="scrim" x1="0" y1="0" x2="0.85" y2="0.25">
      <stop offset="0"    stop-color="#000000" stop-opacity="0.96"/>
      <stop offset="0.30" stop-color="#000000" stop-opacity="0.92"/>
      <stop offset="0.55" stop-color="#000000" stop-opacity="0.65"/>
      <stop offset="0.75" stop-color="#000000" stop-opacity="0.25"/>
      <stop offset="0.92" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="vscrim" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#000000" stop-opacity="0.5"/>
      <stop offset="0.28" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="capgrd" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#000000" stop-opacity="0.9"/>
      <stop offset="0.62" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="capgrdl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="0.52" stop-color="#000000" stop-opacity="0"/>
    </linearGradient></defs>`;

  const imageLayer = img
    ? caption
      ? `<image href="${img}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
         <rect width="${W}" height="${H}" fill="url(#capgrd)"/>
         <rect width="${W}" height="${H}" fill="url(#capgrdl)"/>`
      : `<image href="${img}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
         <rect width="${W}" height="${H}" fill="url(#scrim)"/>
         <rect width="${W}" height="${H}" fill="url(#vscrim)"/>`
    : "";

  return `${defs}<rect width="${W}" height="${H}" fill="#000000"/>${imageLayer}${parts}${LOGO}${tag}`;
}

const previewSVG = (s) =>
  `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">${buildInner(s)}</svg>`;

const exportSVG = (s) =>
  `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${buildInner(s, { embedFont: true })}</svg>`;

/* ── image proxy loader ── */
const blobToDataURL = (blob) => new Promise((res, rej) => {
  const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob);
});
const imgDims = (dataUrl) => new Promise((res, rej) => {
  const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = rej; i.src = dataUrl;
});

async function loadImageData(src) {
  // try our own backend first — original quality, no CORS issues
  try {
    const r = await fetch(`${API}/api/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: src }),
    });
    if (r.ok) {
      const { dataUrl } = await r.json();
      if (dataUrl && /^data:image\//.test(dataUrl)) {
        const dims = await imgDims(dataUrl);
        return { dataUrl, ...dims };
      }
    }
  } catch (e) { /* try fallbacks */ }

  // fallback: public proxies
  const noScheme = src.replace(/^https?:\/\//, "");
  const tries = [
    "https://images.weserv.nl/?url=" + encodeURIComponent(noScheme) + "&w=1600&output=jpg&q=85",
    "https://wsrv.nl/?url=" + encodeURIComponent(noScheme) + "&w=1600&output=jpg&q=85",
    "https://api.allorigins.win/raw?url=" + encodeURIComponent(src),
    "https://corsproxy.io/?url=" + encodeURIComponent(src),
  ];
  for (const t of tries) {
    try {
      const r = await fetch(t);
      if (!r.ok) continue;
      const blob = await r.blob();
      if (!/^image\//.test(blob.type)) continue;
      const dataUrl = await blobToDataURL(blob);
      const dims = await imgDims(dataUrl);
      return { dataUrl, ...dims };
    } catch (e) { /* try next */ }
  }
  throw new Error("load failed");
}

async function pickHorizontalImage(candidates, onTry) {
  let firstAny = null;
  for (let i = 0; i < Math.min(candidates.length, 12); i++) {
    if (onTry) onTry(i + 1);
    try {
      const got = await loadImageData(candidates[i]);
      if (!firstAny) firstAny = got;
      if (got.w >= 400 && got.w >= got.h * 1.1) return got;
    } catch (e) { /* skip */ }
  }
  return firstAny;
}

/* ── main component ── */
export default function App() {
  const [fontReady, setFontReady] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imgBusy, setImgBusy] = useState(false);
  const [imgNote, setImgNote] = useState("");
  const fileRef = useRef(null);

  const [s, setS] = useState({
    eyebrow: "",
    headline: "Insights and our take on what's next.",
    subtitle: "",
    layout: "hero",
    tagline: true,
    img: null,
  });

  useEffect(() => {
    const ff = new FontFace(FONT, `url(data:font/ttf;base64,${FONT_B64}) format('truetype')`);
    ff.load()
      .then((f) => { document.fonts.add(f); return document.fonts.ready; })
      .then(() => setFontReady(true))
      .catch(() => setFontReady(true));
  }, []);

  const svg = useMemo(() => previewSVG(s), [s, fontReady]);
  const set = (k) => (e) => setS((p) => ({ ...p, [k]: e.target?.value ?? e }));

  async function generate() {
    const u0 = url.trim(); if (!u0) return;
    const u = /^https?:\/\//i.test(u0) ? u0 : "https://" + u0;
    setLoading(true); setError(""); setImgNote("");
    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze");
      setS((p) => ({
        ...p,
        headline: data.title || p.headline,
        subtitle: data.description || "",
        eyebrow: /^yna\b/i.test(data.siteName || "") ? "" : (data.siteName || ""),
      }));
      const candidates = data.images || [];
      if (candidates.length) {
        setImgBusy(true); setImgNote("Scanning images…");
        const got = await pickHorizontalImage(candidates, (n) => setImgNote(`Checking image ${n} of ${candidates.length}…`));
        if (got) { setS((p) => ({ ...p, img: got.dataUrl })); setImgNote(""); }
        else setImgNote("No suitable image found — upload manually.");
        setImgBusy(false);
      } else {
        setImgNote("No images found — upload manually.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => { setS((p) => ({ ...p, img: fr.result })); setImgNote(""); };
    fr.readAsDataURL(f);
  }

  async function download() {
    await document.fonts.ready;
    const scale = 2;
    const blob = new Blob([exportSVG(s)], { type: "image/svg+xml;charset=utf-8" });
    const objUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W * scale;
      c.height = H * scale;
      const ctx = c.getContext("2d");
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(objUrl);
      try {
        c.toBlob((b) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(b);
          a.download = (s.headline || "yna-og").slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "") + ".png";
          a.click(); URL.revokeObjectURL(a.href);
        }, "image/png");
      } catch { setError("Export blocked — re-upload the image manually."); }
    };
    img.onerror = () => setError("Render failed. Try re-uploading the image.");
    img.src = objUrl;
  }

  return (
    <div className="forge">
      <header className="bar">
        <div className="brand"><span className="mk" />YNA · OG</div>
        <div className="urlrow">
          <input
            className="url"
            placeholder="https://yna.nl/services/webshops"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            spellCheck={false}
          />
          <button className="go" onClick={generate} disabled={loading}>
            {loading ? "Reading…" : "Generate from URL"}
          </button>
        </div>
      </header>

      {error && <div className="err">{error}</div>}
      {loading && <div className="working">Reading the page… can take a few seconds.</div>}

      <main className="grid">
        <section className="controls">
          <p className="lab">Layout</p>
          <div className="seg">
            {[["standard", "Standard"], ["hero", "Hero"], ["caption", "Caption"]].map(([id, n]) => (
              <button key={id} className={"segbtn " + (s.layout === id ? "on" : "")} onClick={() => set("layout")(id)}>{n}</button>
            ))}
          </div>

          <p className="lab">Content</p>
          <label className="field">
            <span>Eyebrow (optional)</span>
            <input value={s.eyebrow} onChange={set("eyebrow")} placeholder="Case study • AI" />
          </label>
          <label className="field">
            <span>Headline</span>
            <textarea rows={2} value={s.headline} onChange={set("headline")} />
          </label>
          <label className="field">
            <span>Subtitle (optional)</span>
            <textarea rows={2} value={s.subtitle} onChange={set("subtitle")} />
          </label>

          <p className="lab">Image</p>
          <div className="imgrow">
            <button className="ghost" onClick={() => fileRef.current?.click()}>Upload image</button>
            {s.img && <button className="ghost" onClick={() => setS((p) => ({ ...p, img: null }))}>Remove</button>}
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
          </div>
          {(imgBusy || imgNote) && <p className="note">{imgBusy ? "Loading image…" : imgNote}</p>}

          <p className="lab">Options</p>
          <label className="check">
            <input type="checkbox" checked={s.tagline} onChange={(e) => set("tagline")(e.target.checked)} />
            <span>Show "Building What's Next"</span>
          </label>
        </section>

        <section className="stage">
          <div className="cardwrap">
            <div className="card" dangerouslySetInnerHTML={{ __html: svg }} />
            <div className="stagebar">
              <span className="dim">1200 × 630{!fontReady ? " · loading font…" : ""}</span>
              <button className="dl" onClick={download}>Download PNG</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
