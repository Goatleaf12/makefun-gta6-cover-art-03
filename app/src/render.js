// The one draw routine of Sunset State Cover Studio.
//
// drawCover() paints a complete cover onto a canvas at the state's export
// size: graded photo panels, print finish (grain, halftone, vignette,
// paper), then the lettering system (gradient title, neon script, stars
// and quote, starburst seal, volume tag, ribbon, wanted pill, palm band
// with tagline, catalog microtext and a drawn barcode, per-panel location
// tags). The editor preview and every PNG export are this same routine,
// so what you see is byte-for-byte what you save. It uses a fixed-seed
// PRNG: no clocks, no Math.random — same state, same cover.

import { SIZES, gradeById } from './palette.js';
import { panelPolys, polyBounds } from './geometry.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const img = x.createImageData(256, 256);
  const rnd = mulberry32(20261120);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 96 + Math.floor(rnd() * 96);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

function pathPoly(ctx, poly) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function fitFont(ctx, text, family, startPx, maxWidth, weight = '') {
  let size = startPx;
  while (size > 10) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size *= 0.94;
  }
  return size;
}

function spaced(ctx, text, cx, y, spacing) {
  // letter-spaced centred text (manual, so exports match everywhere)
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

function star(ctx, cx, cy, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function palmSilhouette(ctx, x, baseY, h, color) {
  const topX = x + h * 0.16, topY = baseY - h;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, h * 0.055);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + h * 0.02, baseY - h * 0.6, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.4, h * 0.03);
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + (i / 6) * 0.84);
    const len = h * (0.34 + 0.10 * Math.sin(i * 2.3));
    const ex = topX + Math.cos(a) * len;
    const ey = topY - Math.sin(a) * len * 0.42 + len * 0.30;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY - Math.sin(a) * len * 0.55, ex, ey);
    ctx.stroke();
  }
}

function drawPanelPhoto(ctx, poly, img, view, grade, fx) {
  const b = polyBounds(poly);
  ctx.save();
  pathPoly(ctx, poly);
  ctx.clip();
  if (img) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const base = Math.max(b.w / iw, b.h / ih);
    const scale = base * (view ? view.zoom : 1);
    const dw = iw * scale, dh = ih * scale;
    const px = view ? view.px : 0, py = view ? view.py : 0;
    const dx = b.x + (b.w - dw) / 2 + (px * Math.max(0, dw - b.w)) / 2;
    const dy = b.y + (b.h - dh) / 2 + (py * Math.max(0, dh - b.h)) / 2;
    const sat = (grade.sat * fx.saturation).toFixed(3);
    const con = (grade.con * fx.contrast).toFixed(3);
    const parts = [`saturate(${sat})`, `contrast(${con})`, `brightness(${grade.bri})`];
    if (grade.duotone) parts.push('grayscale(1)');
    try { ctx.filter = parts.join(' '); } catch (e) { /* older canvas: skip shaping */ }
    ctx.drawImage(img, dx, dy, dw, dh);
    try { ctx.filter = 'none'; } catch (e) { /* noop */ }
    if (grade.duotone) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = grade.duotone[1];
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = grade.duotone[0];
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  } else {
    ctx.fillStyle = '#2a1e33';
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }
  // grade wash: warm sky on top, deep street at the bottom
  const wash = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(0.45, 'rgba(0,0,0,0)');
  wash.addColorStop(1, grade.washBottom);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = Math.min(1, fx.strength * 1.15);
  ctx.fillStyle = wash;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = fx.strength * 0.30;
  ctx.fillStyle = wash;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawTags(ctx, polys, state, W, H, grade) {
  if (!state.showTags) return;
  const pad = H * 0.012;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  polys.forEach((poly, i) => {
    const tag = state.panelTags[i];
    if (!tag || !tag.place) return;
    const b = polyBounds(poly);
    if (b.w < W * 0.15 || b.h < H * 0.09) return;
    const placeSize = H * 0.0195;
    const subSize = H * 0.0145;
    ctx.font = `700 ${placeSize}px Oswald, sans-serif`;
    const wPlace = ctx.measureText(tag.place.toUpperCase()).width;
    let wSub = 0;
    if (tag.sub) {
      ctx.font = `400 ${subSize}px Oswald, sans-serif`;
      wSub = ctx.measureText(tag.sub.toUpperCase()).width;
    }
    const chipW = Math.min(b.w - pad * 2, Math.max(wPlace, wSub) + pad * 2.2);
    const chipH = tag.sub ? H * 0.054 : H * 0.034;
    let x = b.x + pad;
    // keep the chip clear of the bottom band
    let y = Math.min(b.y + b.h - chipH - pad, H * 0.885 - chipH - pad);
    // the wanted pill owns the bottom-left: wide panels shift the chip right,
    // narrow ones move it to the panel's top edge instead
    if (state.captions.wanted && x < W * 0.36 && y + chipH > H * 0.80) {
      if (b.x + b.w < W * 0.42) y = b.y + pad;
      else x = Math.max(x, b.x + b.w - chipW - pad);
    }
    ctx.beginPath();
    ctx.roundRect(x, y, chipW, chipH, Math.min(6, H * 0.006));
    ctx.fillStyle = 'rgba(8,4,14,0.74)';
    ctx.fill();
    ctx.font = `700 ${placeSize}px Oswald, sans-serif`;
    ctx.fillStyle = grade.chip;
    ctx.fillText(tag.place.toUpperCase(), x + pad * 1.1, y + placeSize * 1.25);
    if (tag.sub) {
      ctx.font = `400 ${subSize}px Oswald, sans-serif`;
      ctx.fillStyle = 'rgba(255,246,230,0.82)';
      ctx.fillText(tag.sub.toUpperCase(), x + pad * 1.1, y + placeSize * 1.25 + subSize * 1.45);
    }
  });
}

function drawFinish(ctx, W, H, grade, fx) {
  if (fx.halftone || grade.halftoneBoost) {
    const spacing = Math.max(7, W / 150);
    const r = spacing * (grade.halftoneBoost ? 0.30 : 0.22);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(16,8,14,${grade.halftoneBoost ? 0.20 : 0.12})`;
    for (let y = spacing / 2, row = 0; y < H; y += spacing, row++) {
      for (let x = spacing / 2 + (row % 2 ? spacing / 2 : 0); x < W; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (fx.grain > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = fx.grain * 0.5;
    ctx.fillStyle = ctx.createPattern(getNoiseTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (fx.paper) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255,240,214,0.05)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (fx.vignette > 0.01) {
    const g = ctx.createRadialGradient(W / 2, H * 0.46, Math.min(W, H) * 0.36, W / 2, H * 0.52, Math.max(W, H) * 0.78);
    g.addColorStop(0, 'rgba(8,2,12,0)');
    g.addColorStop(1, `rgba(8,2,12,${(fx.vignette * 0.55).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawLettering(ctx, W, H, state, grade) {
  const cap = state.captions;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // title first: its size decides where stars + quote can sit
  const title = (cap.title || '').toUpperCase();
  const titleCx = W * 0.465;
  let titleSize = 0;
  const baseline = H * 0.26;
  if (title) {
    titleSize = fitFont(ctx, title, 'Anton, sans-serif', H * 0.205, W * 0.86);
    ctx.font = `${titleSize}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#14060f';
    ctx.fillText(title, titleCx + titleSize * 0.045, baseline + titleSize * 0.055);
    ctx.lineWidth = titleSize * 0.17;
    ctx.strokeStyle = '#160a18';
    ctx.strokeText(title, titleCx, baseline);
    const grad = ctx.createLinearGradient(0, baseline - titleSize * 0.88, 0, baseline + titleSize * 0.12);
    grad.addColorStop(0, grade.title[0]);
    grad.addColorStop(0.55, grade.title[1]);
    grad.addColorStop(1, grade.title[2]);
    ctx.fillStyle = grad;
    ctx.fillText(title, titleCx, baseline);
  }

  // stars + quote float just above the title block, never underneath it
  const titleTop = titleSize ? baseline - titleSize * 0.92 : H * 0.14;
  const starN = Math.max(0, Math.min(5, cap.stars | 0));
  if (cap.quote) {
    ctx.font = `600 ${H * 0.020}px Oswald, sans-serif`;
    ctx.fillStyle = 'rgba(255,246,230,0.95)';
    spaced(ctx, cap.quote.toUpperCase(), W / 2, Math.max(H * 0.058, titleTop - H * 0.016), H * 0.006);
  }
  if (starN > 0) {
    const r = H * 0.0135;
    const totalW = starN * r * 2.7;
    const starsY = Math.max(H * 0.030, titleTop - H * 0.052);
    for (let i = 0; i < starN; i++) {
      star(ctx, W / 2 - totalW / 2 + r + i * r * 2.7, starsY, r, '#ffd76a');
    }
  }

  // script subtitle with neon glow and a dark stroke to hold over art
  if (cap.subtitle) {
    const subSize = fitFont(ctx, cap.subtitle, 'Pacifico, cursive', H * 0.05, W * 0.8);
    const y = baseline + (titleSize ? titleSize * 0.42 : H * 0.05) + subSize * 0.55;
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = subSize * 0.12;
    ctx.strokeStyle = 'rgba(16,4,20,0.85)';
    ctx.strokeText(cap.subtitle, titleCx, y);
    ctx.save();
    ctx.shadowColor = grade.script;
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillStyle = grade.script;
    ctx.fillText(cap.subtitle, titleCx, y);
    ctx.fillText(cap.subtitle, titleCx, y);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText(cap.subtitle, titleCx, y);
  }

  // starburst seal, top right
  if (cap.seal) {
    const cx = W - H * 0.115, cy = H * 0.148, r = H * 0.074;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.21);
    ctx.beginPath();
    const spikes = 24;
    for (let i = 0; i < spikes * 2; i++) {
      const rad = i % 2 ? r * 0.84 : r;
      const a = (i * Math.PI) / spikes;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = grade.seal;
    ctx.fill();
    ctx.lineWidth = H * 0.0035;
    ctx.strokeStyle = '#1c0d12';
    ctx.stroke();
    const words = cap.seal.toUpperCase().split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 10 && line) { lines.push(line); line = w; }
      else line = (line + ' ' + w).trim();
    }
    if (line) lines.push(line);
    const fs = fitFont(ctx, lines.reduce((a, b) => (a.length > b.length ? a : b), ''), 'Anton, sans-serif', r * 0.34, r * 1.45);
    ctx.font = `${fs}px Anton, sans-serif`;
    ctx.fillStyle = '#1c0d12';
    lines.slice(0, 3).forEach((ln, i) => {
      ctx.fillText(ln, 0, (i - (Math.min(lines.length, 3) - 1) / 2) * fs * 1.12 + fs * 0.36);
    });
    ctx.restore();
  }

  // ribbon across the top-left corner
  if (cap.ribbon) {
    ctx.save();
    ctx.translate(0, 0);
    ctx.rotate(-Math.PI / 4);
    const rw = H * 0.52, rh = H * 0.040;
    ctx.fillStyle = grade.seal;
    ctx.fillRect(-rw / 2, H * 0.085, rw, rh);
    const fs = fitFont(ctx, cap.ribbon.toUpperCase(), 'Anton, sans-serif', rh * 0.58, rw * 0.8);
    ctx.font = `${fs}px Anton, sans-serif`;
    ctx.fillStyle = '#1c0d12';
    ctx.fillText(cap.ribbon.toUpperCase(), 0, H * 0.085 + rh * 0.68);
    ctx.restore();
  }

  // bottom band first: its palm silhouettes must stay behind the pill + tags
  const bandH = H * 0.115, bandY = H - bandH;
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, H);
  bandGrad.addColorStop(0, 'rgba(10,4,16,0.90)');
  bandGrad.addColorStop(1, 'rgba(10,4,16,0.98)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = grade.band;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.globalAlpha = 1;
  palmSilhouette(ctx, W * 0.055, bandY + bandH * 0.16, bandH * 0.92, '#07030c');
  palmSilhouette(ctx, W * 0.115, bandY + bandH * 0.20, bandH * 0.62, '#07030c');
  palmSilhouette(ctx, W * 0.905, bandY + bandH * 0.18, bandH * 0.80, '#07030c');
  if (cap.tagline) {
    const fs = fitFont(ctx, cap.tagline.toUpperCase(), 'Oswald, sans-serif', H * 0.027, W * 0.62, '600 ');
    ctx.font = `600 ${fs}px Oswald, sans-serif`;
    ctx.fillStyle = '#fff3da';
    spaced(ctx, cap.tagline.toUpperCase(), W / 2, bandY + bandH * 0.46, fs * 0.22);
  }
  ctx.font = `400 ${H * 0.0125}px Oswald, sans-serif`;
  ctx.fillStyle = 'rgba(255,243,218,0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('SUNSET STATE COVER STUDIO · LEONIDA POSTAL SERIES · PRINTED AT DUSK · ALL ART ORIGINAL', W * 0.02, H - bandH * 0.16);
  ctx.textAlign = 'center';
  // barcode drawn from the title's own hash — same title, same bars
  let hash = 7;
  const seedText = (cap.title || 'SUNSET') + (cap.volume || '');
  for (const ch of seedText) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = mulberry32(hash);
  const bwTotal = W * 0.072, bhBar = bandH * 0.46;
  let bx = W * 0.978 - bwTotal;
  const by = bandY + bandH * 0.20;
  ctx.fillStyle = 'rgba(255,250,240,0.92)';
  while (bx < W * 0.978 - 2) {
    const seg = 1 + Math.floor(rnd() * 3.4);
    if (rnd() > 0.42) ctx.fillRect(bx, by, seg, bhBar);
    bx += seg + 1 + Math.floor(rnd() * 2);
  }
  ctx.font = `400 ${H * 0.011}px Oswald, sans-serif`;
  ctx.fillStyle = 'rgba(255,243,218,0.7)';
  ctx.fillText('8 901106 202611', W * 0.978 - bwTotal / 2, by + bhBar + H * 0.016);

  // volume tag, left edge under the title block
  if (cap.volume) {
    ctx.save();
    ctx.translate(W * 0.045, H * 0.36);
    ctx.rotate(-0.055);
    ctx.font = `700 ${H * 0.024}px Oswald, sans-serif`;
    const tw = ctx.measureText(cap.volume.toUpperCase()).width;
    const bw = tw + H * 0.036, bh = H * 0.046;
    ctx.fillStyle = 'rgba(10,5,16,0.85)';
    ctx.fillRect(0, 0, bw, bh);
    ctx.lineWidth = H * 0.0028;
    ctx.strokeStyle = grade.seal;
    ctx.strokeRect(0, 0, bw, bh);
    ctx.fillStyle = '#fff3da';
    ctx.textAlign = 'left';
    ctx.fillText(cap.volume.toUpperCase(), H * 0.018, bh * 0.68);
    ctx.restore();
    ctx.textAlign = 'center';
  }

  // wanted pill, bottom left above the band
  if (cap.wanted) {
    ctx.font = `700 ${H * 0.021}px Oswald, sans-serif`;
    const tw = ctx.measureText(cap.wanted.toUpperCase()).width;
    const bh = H * 0.044, bw = tw + H * 0.075;
    const x = W * 0.035, y = H * 0.885 - bh - H * 0.018;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, bh / 2);
    ctx.fillStyle = '#0d0514';
    ctx.fill();
    ctx.lineWidth = H * 0.0028;
    ctx.strokeStyle = grade.seal;
    ctx.stroke();
    star(ctx, x + bh * 0.52, y + bh / 2, bh * 0.26, grade.seal);
    ctx.fillStyle = '#fff3da';
    ctx.textAlign = 'left';
    ctx.fillText(cap.wanted.toUpperCase(), x + bh * 1.05, y + bh * 0.66);
    ctx.textAlign = 'center';
  }

}

export function drawCover(canvas, state, photos, opts = {}) {
  const size = SIZES.find((s) => s.id === state.sizeId) || SIZES[0];
  const W = size.w, H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.gradeId);
  const gutter = Math.max(6, Math.round(W * 0.0075));
  const polys = panelPolys(state.layoutId, state.sizeId, W, H, gutter);

  ctx.fillStyle = state.gutterStyle === 'cream' ? '#f2e7d5' : '#14101c';
  ctx.fillRect(0, 0, W, H);

  polys.forEach((poly, i) => {
    const photo = photos[state.panelPhotos[i] % photos.length];
    drawPanelPhoto(ctx, poly, photo, state.panelViews[i], grade, state.fx);
  });

  drawTags(ctx, polys, state, W, H, grade);
  drawFinish(ctx, W, H, grade, state.fx);
  drawLettering(ctx, W, H, state, grade);

  if (opts.selection && state.selected >= 0 && polys[state.selected]) {
    ctx.save();
    pathPoly(ctx, polys[state.selected]);
    ctx.lineWidth = Math.max(3, W * 0.0028);
    ctx.strokeStyle = '#ff6ec7';
    ctx.stroke();
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();
    ctx.restore();
  }
  return { polys, W, H };
}
