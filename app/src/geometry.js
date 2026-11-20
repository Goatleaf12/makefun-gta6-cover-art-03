// Panel geometry for Sunset State Cover Studio.
//
// Every layout is a function of the aspect family ('wide' | 'tall' |
// 'square') returning panels as polygons in fractions of the canvas, so
// one layout definition serves the preview and all three export sizes.
// R() makes an axis-aligned panel; P() a free polygon (slanted gutters).

function R(x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

function P(points) {
  return points;
}

const LAYOUTS = [
  {
    id: 'hero', label: 'Hero',
    panels(aspect) {
      if (aspect === 'tall') {
        return [
          R(0, 0, 1, 0.50), R(0, 0.515, 0.49, 0.20), R(0.51, 0.515, 0.49, 0.20),
          R(0, 0.73, 0.49, 0.27), R(0.51, 0.73, 0.49, 0.27),
        ];
      }
      if (aspect === 'square') {
        return [
          R(0, 0, 0.615, 0.615), R(0.635, 0, 0.365, 0.295), R(0.635, 0.315, 0.365, 0.30),
          R(0, 0.635, 0.32, 0.365), R(0.34, 0.635, 0.32, 0.365), R(0.68, 0.635, 0.32, 0.365),
        ];
      }
      return [
        R(0, 0, 0.585, 0.665), R(0, 0.68, 0.585, 0.32),
        R(0.60, 0, 0.40, 0.32), R(0.60, 0.335, 0.40, 0.325), R(0.60, 0.675, 0.40, 0.325),
      ];
    },
  },
  {
    id: 'hero-right', label: 'Hero Right',
    panels(aspect) {
      if (aspect === 'tall') {
        return [
          R(0, 0.285, 0.49, 0.20), R(0.51, 0.285, 0.49, 0.20),
          R(0, 0.50, 1, 0.50), R(0, 0, 0.49, 0.27), R(0.51, 0, 0.49, 0.27),
        ];
      }
      if (aspect === 'square') {
        return [
          R(0.385, 0, 0.615, 0.615), R(0, 0, 0.365, 0.295), R(0, 0.315, 0.365, 0.30),
          R(0, 0.635, 0.32, 0.365), R(0.34, 0.635, 0.32, 0.365), R(0.68, 0.635, 0.32, 0.365),
        ];
      }
      return [
        R(0.415, 0, 0.585, 0.665), R(0.415, 0.68, 0.585, 0.32),
        R(0, 0, 0.40, 0.32), R(0, 0.335, 0.40, 0.325), R(0, 0.675, 0.40, 0.325),
      ];
    },
  },
  {
    id: 'comic-slant', label: 'Comic Slant',
    panels(aspect) {
      const s = aspect === 'tall' ? 0.05 : 0.07;
      return [
        P([[0, 0], [1, 0], [1 - s, 0.36], [s, 0.36]]),
        P([[s, 0.375], [0.52, 0.375], [0.48, 0.665], [0, 0.665]]),
        P([[0.545, 0.375], [1 - s, 0.375], [1, 0.665], [0.505, 0.665]]),
        P([[0, 0.68], [0.485, 0.68], [0.515, 1], [0, 1]]),
        P([[0.51, 0.68], [1, 0.68], [1, 1], [0.54, 1]]),
      ];
    },
  },
  {
    id: 'grid-nine', label: 'Grid 3×3',
    panels() {
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) out.push(R(c / 3, r / 3, 1 / 3, 1 / 3));
      }
      return out;
    },
  },
  {
    id: 'mosaic', label: 'Mosaic',
    panels(aspect) {
      if (aspect === 'tall') {
        return [
          R(0, 0, 0.56, 0.34), R(0.58, 0, 0.42, 0.22), R(0.58, 0.235, 0.42, 0.225),
          R(0, 0.355, 0.42, 0.30), R(0.44, 0.355, 0.56, 0.30),
          R(0, 0.67, 0.56, 0.33), R(0.58, 0.67, 0.42, 0.33),
        ];
      }
      return [
        R(0, 0, 0.375, 0.545), R(0.39, 0, 0.275, 0.375), R(0.68, 0, 0.32, 0.545),
        R(0.39, 0.39, 0.275, 0.29), R(0, 0.56, 0.375, 0.44),
        R(0.39, 0.695, 0.275, 0.305), R(0.68, 0.56, 0.32, 0.44),
      ];
    },
  },
  {
    id: 'single', label: 'Single',
    panels() {
      return [R(0, 0, 1, 1)];
    },
  },
  {
    id: 'split-duo', label: 'Split Duo',
    panels(aspect) {
      const s = aspect === 'tall' ? 0.16 : 0.10;
      return [
        P([[0, 0], [1, 0], [1, 0.42], [0.5 + s, 0.58], [0, 0.58]]),
        P([[0, 0.60], [0.5 + s, 0.60], [1, 0.44], [1, 1], [0, 1]]),
      ];
    },
  },
  {
    id: 'cover-story', label: 'Cover Story',
    panels(aspect) {
      if (aspect === 'tall') {
        return [
          R(0, 0, 1, 0.42), R(0, 0.435, 0.49, 0.20), R(0.51, 0.435, 0.49, 0.20),
          R(0, 0.65, 0.32, 0.35), R(0.34, 0.65, 0.32, 0.35), R(0.68, 0.65, 0.32, 0.35),
        ];
      }
      return [
        R(0, 0, 1, 0.46), R(0, 0.475, 0.325, 0.245), R(0.3375, 0.475, 0.325, 0.245),
        R(0.675, 0.475, 0.325, 0.245), R(0, 0.735, 1, 0.265),
      ];
    },
  },
  {
    id: 'filmstrip', label: 'Filmstrip',
    panels(aspect) {
      if (aspect === 'square' || aspect === 'tall') {
        return [
          R(0, 0, 1, 0.30),
          R(0, 0.315, 0.325, 0.325), R(0.3375, 0.315, 0.325, 0.325), R(0.675, 0.315, 0.325, 0.325),
          R(0, 0.655, 0.325, 0.345), R(0.3375, 0.655, 0.325, 0.345), R(0.675, 0.655, 0.325, 0.345),
        ];
      }
      return [
        R(0, 0, 0.295, 1),
        R(0.31, 0, 0.335, 0.49), R(0.66, 0, 0.34, 0.49),
        R(0.31, 0.51, 0.335, 0.49), R(0.66, 0.51, 0.34, 0.49),
      ];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export { LAYOUTS };

/** Panel polygons in canvas pixels for a layout at W×H, inset by the gutter. */
export function panelPolys(layoutId, aspect, W, H, gutter) {
  const frac = layoutById(layoutId).panels(aspect);
  return frac.map((poly) => insetPoly(poly.map(([fx, fy]) => [fx * W, fy * H]), gutter / 2));
}

function insetPoly(poly, by) {
  if (!by) return poly;
  let cx = 0, cy = 0;
  for (const [x, y] of poly) { cx += x; cy += y; }
  cx /= poly.length; cy /= poly.length;
  return poly.map(([x, y]) => {
    const dx = x - cx, dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const shrink = Math.max(0, 1 - by / len);
    return [cx + dx * shrink, cy + dy * shrink];
  });
}

/** Axis-aligned bounds of a polygon. */
export function polyBounds(poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
