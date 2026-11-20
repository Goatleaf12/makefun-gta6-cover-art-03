// Editor wiring for Sunset State Cover Studio: state, photo handling,
// panel interactions and PNG export. The preview canvas is painted by
// render.js's drawCover at full export resolution, so the preview is the
// export, scaled by CSS.

import { SIZES, GRADES, RECIPES, recipeById } from './palette.js';
import { LAYOUTS, layoutById, panelPolys, pointInPoly } from './geometry.js';
import { drawCover } from './render.js';

export const SAMPLE_FILES = [
  'sunset-shore.jpg', 'ocean-avenue.jpg', 'speedboat-run.jpg', 'neon-alley.jpg',
  'skyline-dusk.jpg', 'boardwalk-carnival.jpg', 'rooftop-pool.jpg',
  'desert-highway.jpg', 'marina-night.jpg', 'causeway-aerial.jpg',
];

const TAG_POOL = [
  { place: 'Ocean Drive', sub: '6:42 PM · Looking for trouble' },
  { place: 'Vice Beach', sub: 'Golden hour · No lifeguard' },
  { place: 'Port Leonida', sub: 'Slip 9 · Engine running' },
  { place: 'The Causeway', sub: '90 mph · Windows down' },
  { place: 'Neon District', sub: 'After midnight' },
  { place: 'Boardwalk', sub: 'Last ride of summer' },
  { place: 'Marina Row', sub: 'String lights · Low tide' },
  { place: 'Downtown', sub: 'Skyline at dusk' },
  { place: 'The Strip', sub: 'Cruising slow' },
];

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function loadSamples() {
  const imgs = [];
  for (const f of SAMPLE_FILES) imgs.push(await loadImage(`samples/${f}`));
  return imgs;
}

export function makeStateFromRecipe(recipe) {
  const state = {
    sizeId: recipe.size,
    layoutId: recipe.layout,
    gradeId: recipe.grade,
    fx: { ...recipe.fx },
    captions: { ...recipe.captions },
    gutterStyle: 'dark',
    showTags: true,
    panelPhotos: [],
    panelViews: [],
    panelTags: [],
    selected: 0,
  };
  fitPanels(state, 10, false);
  return state;
}

export function panelCount(state) {
  return layoutById(state.layoutId).panels(state.sizeId).length;
}

export function fitPanels(state, photoCount, keep) {
  const n = panelCount(state);
  const photos = [], views = [], tags = [];
  for (let i = 0; i < n; i++) {
    photos.push(keep && state.panelPhotos.length ? state.panelPhotos[i % state.panelPhotos.length] : i % Math.max(1, photoCount));
    views.push(keep && state.panelViews[i] ? state.panelViews[i] : { zoom: 1, px: 0, py: 0 });
    tags.push(keep && state.panelTags[i] ? state.panelTags[i] : { ...TAG_POOL[i % TAG_POOL.length] });
  }
  state.panelPhotos = photos;
  state.panelViews = views;
  state.panelTags = tags;
  if (state.selected >= n) state.selected = n - 1;
}

const $ = (id) => document.getElementById(id);

export function initEditor(markShotReady = false) {
  const canvas = $('cover');
  let photos = [];
  let brush = -1; // photo index chosen in the strip, waiting for a panel click
  let state = makeStateFromRecipe(recipeById('sunset-headliner'));
  let lastPolys = [];

  function redraw() {
    const { polys } = drawCover(canvas, state, photos, { selection: true });
    lastPolys = polys;
    $('panelLabel').textContent = `PANEL ${state.selected + 1} OF ${polys.length}`;
    const tag = state.panelTags[state.selected] || { place: '', sub: '' };
    if (document.activeElement !== $('tagPlace')) $('tagPlace').value = tag.place;
    if (document.activeElement !== $('tagSub')) $('tagSub').value = tag.sub;
  }

  function setStatus(msg) { $('statusLine').textContent = msg; }

  // ---- photo strip ------------------------------------------------------
  function renderStrip() {
    const strip = $('photoStrip');
    strip.innerHTML = '';
    photos.forEach((img, i) => {
      const el = document.createElement('div');
      el.className = 'thumb' + (i === brush ? ' brush' : '');
      el.draggable = true;
      const im = document.createElement('img');
      im.src = img.src;
      im.alt = `photo ${i + 1}`;
      el.appendChild(im);
      const badge = document.createElement('span');
      badge.textContent = String(i + 1);
      el.appendChild(badge);
      el.addEventListener('click', () => {
        brush = brush === i ? -1 : i;
        renderStrip();
        setStatus(brush >= 0 ? `Photo ${i + 1} picked — click a panel to place it` : 'READY');
      });
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(i));
      });
      strip.appendChild(el);
    });
  }

  async function addPhotoFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const img = await loadImage(URL.createObjectURL(file));
      photos.push(img);
    }
    renderStrip();
    setStatus(`READY — ${photos.length} PHOTOS LOADED`);
    redraw();
  }

  $('fileInput').addEventListener('change', (e) => addPhotoFiles([...e.target.files]));
  const photosCol = document.querySelector('.photos-col');
  photosCol.addEventListener('dragover', (e) => e.preventDefault());
  photosCol.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) addPhotoFiles([...e.dataTransfer.files]);
  });
  $('fillAll').addEventListener('click', () => {
    const src = brush >= 0 ? brush : state.panelPhotos[state.selected] || 0;
    state.panelPhotos = state.panelPhotos.map(() => src);
    redraw();
    setStatus(`All panels filled from photo ${src + 1}`);
  });
  $('spreadAll').addEventListener('click', () => {
    state.panelPhotos = state.panelPhotos.map((_, i) => i % photos.length);
    redraw();
    setStatus('Photos spread across panels');
  });

  // ---- canvas interactions ----------------------------------------------
  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * canvas.width,
      ((e.clientY - r.top) / r.height) * canvas.height,
    ];
  }
  function hitPanel(x, y) {
    for (let i = lastPolys.length - 1; i >= 0; i--) {
      if (pointInPoly(x, y, lastPolys[i])) return i;
    }
    return -1;
  }
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = canvasPoint(e);
    const hit = hitPanel(x, y);
    if (hit < 0) return;
    if (brush >= 0) {
      state.panelPhotos[hit] = brush;
      state.panelViews[hit] = { zoom: 1, px: 0, py: 0 };
      state.selected = hit;
      brush = -1;
      renderStrip();
      redraw();
      return;
    }
    state.selected = hit;
    drag = { panel: hit, x, y, view: { ...state.panelViews[hit] } };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [x, y] = canvasPoint(e);
    const view = state.panelViews[drag.panel];
    const b = lastPolys[drag.panel];
    const bw = Math.max(...b.map((p) => p[0])) - Math.min(...b.map((p) => p[0]));
    const bh = Math.max(...b.map((p) => p[1])) - Math.min(...b.map((p) => p[1]));
    view.px = clamp(drag.view.px + ((x - drag.x) / Math.max(1, bw)) * 2, -1, 1);
    view.py = clamp(drag.view.py + ((y - drag.y) / Math.max(1, bh)) * 2, -1, 1);
    redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [x, y] = canvasPoint(e);
    const hit = hitPanel(x, y);
    if (hit < 0) return;
    state.selected = hit;
    const view = state.panelViews[hit];
    view.zoom = clamp(view.zoom * (e.deltaY < 0 ? 1.09 : 0.92), 1, 3.2);
    redraw();
  }, { passive: false });
  canvas.addEventListener('dblclick', (e) => {
    const [x, y] = canvasPoint(e);
    const hit = hitPanel(x, y);
    if (hit < 0) return;
    state.panelViews[hit] = { zoom: 1, px: 0, py: 0 };
    state.selected = hit;
    redraw();
  });
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const idx = Number(e.dataTransfer.getData('text/plain'));
    const [x, y] = canvasPoint(e);
    const hit = hitPanel(x, y);
    if (hit >= 0 && Number.isInteger(idx) && photos[idx]) {
      state.panelPhotos[hit] = idx;
      state.panelViews[hit] = { zoom: 1, px: 0, py: 0 };
      state.selected = hit;
      redraw();
    }
  });

  // ---- controls -----------------------------------------------------------
  function buildChips() {
    const sizeTabs = $('sizeTabs');
    SIZES.forEach((s) => {
      const b = document.createElement('button');
      b.textContent = s.label;
      b.className = 'tab' + (s.id === state.sizeId ? ' on' : '');
      b.dataset.size = s.id;
      b.addEventListener('click', () => {
        state.sizeId = s.id;
        fitPanels(state, photos.length, true);
        buildChips();
        redraw();
      });
      sizeTabs.appendChild(b);
    });
    const gradeRow = $('gradeRow');
    gradeRow.innerHTML = '';
    GRADES.forEach((g) => {
      const b = document.createElement('button');
      b.textContent = g.label;
      b.className = 'chip' + (g.id === state.gradeId ? ' on' : '');
      b.addEventListener('click', () => {
        state.gradeId = g.id;
        buildChips();
        redraw();
      });
      gradeRow.appendChild(b);
    });
    const recipeRow = $('recipeRow');
    recipeRow.innerHTML = '';
    RECIPES.forEach((r) => {
      const b = document.createElement('button');
      b.textContent = r.label;
      b.className = 'chip recipe';
      b.addEventListener('click', () => {
        state = makeStateFromRecipe(r);
        syncControls();
        buildChips();
        redraw();
        setStatus(`Recipe applied: ${r.label}`);
      });
      recipeRow.appendChild(b);
    });
    const grid = $('layoutGrid');
    grid.innerHTML = '';
    LAYOUTS.forEach((l) => {
      const b = document.createElement('button');
      b.className = 'layout-btn' + (l.id === state.layoutId ? ' on' : '');
      const mini = document.createElement('canvas');
      mini.width = 84; mini.height = 52;
      const mx = mini.getContext('2d');
      mx.fillStyle = '#241536';
      mx.fillRect(0, 0, 84, 52);
      const polys = panelPolys(l.id, state.sizeId, 84, 52, 3);
      polys.forEach((poly, i) => {
        mx.beginPath();
        poly.forEach(([x, y], j) => (j ? mx.lineTo(x, y) : mx.moveTo(x, y)));
        mx.closePath();
        mx.fillStyle = i % 2 ? '#ff8c42' : '#ff6ec7';
        mx.globalAlpha = 0.55 + (i % 3) * 0.15;
        mx.fill();
      });
      b.appendChild(mini);
      const label = document.createElement('span');
      label.textContent = l.label;
      b.appendChild(label);
      b.addEventListener('click', () => {
        state.layoutId = l.id;
        fitPanels(state, photos.length, true);
        buildChips();
        redraw();
      });
      grid.appendChild(b);
    });
  }

  function bindSlider(id, key, scale = 100) {
    $(id).addEventListener('input', (e) => {
      state.fx[key] = Number(e.target.value) / scale;
      redraw();
    });
  }
  bindSlider('fxStrength', 'strength');
  bindSlider('fxContrast', 'contrast');
  bindSlider('fxSaturation', 'saturation');
  bindSlider('fxGrain', 'grain');
  bindSlider('fxVignette', 'vignette');
  $('fxHalftone').addEventListener('change', (e) => { state.fx.halftone = e.target.checked; redraw(); });
  $('fxPaper').addEventListener('change', (e) => { state.fx.paper = e.target.checked; redraw(); });
  $('showTags').addEventListener('change', (e) => { state.showTags = e.target.checked; redraw(); });
  $('gutterStyle').addEventListener('change', (e) => { state.gutterStyle = e.target.value; redraw(); });

  const captionFields = [
    ['capTitle', 'title'], ['capSubtitle', 'subtitle'], ['capTagline', 'tagline'],
    ['capSeal', 'seal'], ['capVolume', 'volume'], ['capWanted', 'wanted'],
    ['capRibbon', 'ribbon'], ['capQuote', 'quote'],
  ];
  captionFields.forEach(([id, key]) => {
    $(id).addEventListener('input', (e) => { state.captions[key] = e.target.value; redraw(); });
  });
  $('capStars').addEventListener('input', (e) => { state.captions.stars = Number(e.target.value); redraw(); });
  $('tagPlace').addEventListener('input', (e) => { state.panelTags[state.selected].place = e.target.value; redraw(); });
  $('tagSub').addEventListener('input', (e) => { state.panelTags[state.selected].sub = e.target.value; redraw(); });

  function syncControls() {
    $('fxStrength').value = state.fx.strength * 100;
    $('fxContrast').value = state.fx.contrast * 100;
    $('fxSaturation').value = state.fx.saturation * 100;
    $('fxGrain').value = state.fx.grain * 100;
    $('fxVignette').value = state.fx.vignette * 100;
    $('fxHalftone').checked = state.fx.halftone;
    $('fxPaper').checked = state.fx.paper;
    $('showTags').checked = state.showTags;
    $('gutterStyle').value = state.gutterStyle;
    captionFields.forEach(([id, key]) => { $(id).value = state.captions[key]; });
    $('capStars').value = state.captions.stars;
  }

  // ---- export -------------------------------------------------------------
  async function exportOne(sizeId) {
    const size = SIZES.find((s) => s.id === sizeId);
    const off = document.createElement('canvas');
    drawCover(off, { ...state, sizeId }, photos, {});
    const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-state-${size.file}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setStatus(`Saved sunset-state-${size.file}.png`);
  }
  SIZES.forEach((s) => {
    $(`export-${s.id}`).addEventListener('click', () => exportOne(s.id));
  });
  $('exportAll').addEventListener('click', async () => {
    for (const s of SIZES) {
      await exportOne(s.id);
      await new Promise((r) => setTimeout(r, 350));
    }
    setStatus('Saved all 3 sizes — check your downloads');
  });

  // ---- boot -----------------------------------------------------------------
  (async () => {
    try {
      await Promise.all([
        document.fonts.load('100px Anton'), document.fonts.load('60px Pacifico'),
        document.fonts.load('700 40px Oswald'), document.fonts.load('600 40px Oswald'),
      ]);
      photos = await loadSamples();
      fitPanels(state, photos.length, false);
      buildChips();
      syncControls();
      renderStrip();
      redraw();
      setStatus(`READY — ${photos.length} SAMPLE PHOTOS LOADED`);
      if (markShotReady) {
        requestAnimationFrame(() => { window.__shotReady = true; });
      }
    } catch (err) {
      setStatus(`Could not load samples: ${err.message}`);
    }
  })();

  return { getState: () => state, getPhotos: () => photos };
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
