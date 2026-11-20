// Colour grades and one-click cover recipes for Sunset State Cover Studio.
//
// A grade is a small bundle of canvas moves: a saturation / contrast /
// brightness shaping for the photo, a two-stop sky-and-street gradient
// washed over it, and the colours the lettering borrows (title gradient,
// script neon, band tint). A recipe is a whole cover in one click: size,
// layout, grade, captions and finish toggles in the winners' grammar.

export const SIZES = [
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080, file: '1920x1080' },
  { id: 'tall', label: '1080 × 1350', w: 1080, h: 1350, file: '1080x1350' },
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080, file: '1080x1080' },
];

export const GRADES = [
  {
    id: 'vice', label: 'Vice Sunset',
    sat: 1.32, con: 1.08, bri: 1.02,
    washTop: 'rgba(255,120,60,0.34)', washBottom: 'rgba(120,30,140,0.36)',
    title: ['#fff3c4', '#ffb347', '#ff5e7a'], script: '#ff6ec7', band: '#180a20',
    seal: '#ffb347', chip: '#ffd9a0',
  },
  {
    id: 'neon', label: 'Neon Night',
    sat: 1.24, con: 1.14, bri: 0.96,
    washTop: 'rgba(40,80,255,0.30)', washBottom: 'rgba(255,40,140,0.30)',
    title: ['#d8fbff', '#54d8ff', '#ff5ee1'], script: '#5ee7ff', band: '#0a0a22',
    seal: '#54d8ff', chip: '#b8f4ff',
  },
  {
    id: 'golden', label: 'Golden Hour',
    sat: 1.16, con: 1.04, bri: 1.06,
    washTop: 'rgba(255,196,92,0.32)', washBottom: 'rgba(160,84,30,0.28)',
    title: ['#fff8dc', '#ffd76a', '#ff8c42'], script: '#ffe9a8', band: '#221206',
    seal: '#ffd76a', chip: '#ffe9b8',
  },
  {
    id: 'duotone', label: 'Duotone Pink/Teal',
    sat: 1.0, con: 1.10, bri: 1.0, duotone: ['#0d2b3e', '#ff5e8a'],
    washTop: 'rgba(20,120,140,0.18)', washBottom: 'rgba(255,60,120,0.18)',
    title: ['#c8fff4', '#3fd8c2', '#ff5e8a'], script: '#3fd8c2', band: '#0a1a26',
    seal: '#3fd8c2', chip: '#c8fff4',
  },
  {
    id: 'comic', label: 'Comic Ink',
    sat: 1.38, con: 1.22, bri: 1.03, halftoneBoost: true,
    washTop: 'rgba(255,170,40,0.22)', washBottom: 'rgba(200,40,60,0.24)',
    title: ['#fffbe8', '#ffd23e', '#ff7847'], script: '#ff4d6d', band: '#1c0d12',
    seal: '#ffd23e', chip: '#fff0b8',
  },
  {
    id: 'natural', label: 'Natural',
    sat: 1.02, con: 1.02, bri: 1.01,
    washTop: 'rgba(255,255,255,0.05)', washBottom: 'rgba(20,40,60,0.08)',
    title: ['#ffffff', '#ffe9c9', '#ffb98a'], script: '#ffd9ec', band: '#101418',
    seal: '#ffe9c9', chip: '#ffffff',
  },
  {
    id: 'noir', label: 'Noir Mono',
    sat: 0.12, con: 1.24, bri: 0.99,
    washTop: 'rgba(200,210,225,0.14)', washBottom: 'rgba(8,8,14,0.30)',
    title: ['#ffffff', '#c9d2dd', '#7e8a99'], script: '#e8eef4', band: '#0a0a0c',
    seal: '#c9d2dd', chip: '#eef2f6',
  },
  {
    id: 'chrome', label: 'Chrome Dusk',
    sat: 1.10, con: 1.16, bri: 1.0,
    washTop: 'rgba(120,160,255,0.26)', washBottom: 'rgba(60,20,90,0.30)',
    title: ['#f4fbff', '#9fd0ff', '#e2a6ff'], script: '#a6c8ff', band: '#0c0a20',
    seal: '#9fd0ff', chip: '#dceeff',
  },
  {
    id: 'painterly', label: 'Painterly Wash',
    sat: 1.22, con: 0.98, bri: 1.05,
    washTop: 'rgba(255,150,120,0.20)', washBottom: 'rgba(90,60,160,0.22)',
    title: ['#fff6da', '#ffb98a', '#c97bff'], script: '#ffb8d9', band: '#1a0e24',
    seal: '#ffb98a', chip: '#ffe4c9',
  },
];

export const RECIPES = [
  {
    id: 'sunset-headliner', label: 'Sunset Headliner', size: 'wide', layout: 'hero', grade: 'vice',
    fx: { strength: 0.85, contrast: 1.0, saturation: 1.0, grain: 0.5, vignette: 0.55, halftone: false, paper: true },
    captions: {
      title: 'SUNSET STATE', subtitle: 'Vice Shores', tagline: 'EVERY SUNSET HAS A PRICE',
      seal: 'ORIGINAL COVER ART', volume: 'VOL. 06', wanted: 'MOST WANTED', ribbon: "COLLECTOR'S EDITION",
      quote: 'A POSTCARD FROM THE EDGE OF TROUBLE', stars: 5,
    },
  },
  {
    id: 'neon-confidential', label: 'Neon Confidential', size: 'square', layout: 'grid-nine', grade: 'neon',
    fx: { strength: 0.9, contrast: 1.05, saturation: 1.05, grain: 0.45, vignette: 0.6, halftone: false, paper: false },
    captions: {
      title: 'MIDNIGHT VICE', subtitle: 'Neon Confidential', tagline: 'THE CITY NEVER BLINKS',
      seal: 'EST. 2026 · LEONIDA', volume: 'NO. 09', wanted: 'AFTER DARK', ribbon: 'LATE NIGHT EDITION',
      quote: 'NINE FRAMES OF BAD DECISIONS', stars: 5,
    },
  },
  {
    id: 'print-comic', label: 'Print Comic', size: 'tall', layout: 'comic-slant', grade: 'comic',
    fx: { strength: 0.95, contrast: 1.08, saturation: 1.05, grain: 0.35, vignette: 0.4, halftone: true, paper: true },
    captions: {
      title: 'NEON HUSTLE', subtitle: 'Panel & Ink', tagline: 'READ IT BEFORE THE COPS DO',
      seal: 'PRINTED IN LEONIDA', volume: 'ISSUE 12', wanted: 'INKED & WANTED', ribbon: 'FIRST PRINTING',
      quote: 'PULP SUNSHINE, HARD INK', stars: 4,
    },
  },
  {
    id: 'golden-coast', label: 'Golden Coast', size: 'wide', layout: 'mosaic', grade: 'golden',
    fx: { strength: 0.8, contrast: 1.0, saturation: 1.0, grain: 0.4, vignette: 0.5, halftone: false, paper: true },
    captions: {
      title: 'GOLDEN COAST', subtitle: 'Salt & Honey', tagline: 'WHERE THE LIGHT PAYS RENT',
      seal: 'ORIGINAL COVER ART', volume: 'VOL. 03', wanted: 'SUN CHASER', ribbon: 'SUMMER EDITION',
      quote: 'SEVEN WINDOWS ON THE SHORELINE', stars: 5,
    },
  },
  {
    id: 'chrome-dusk', label: 'Chrome Dusk', size: 'tall', layout: 'cover-story', grade: 'chrome',
    fx: { strength: 0.85, contrast: 1.04, saturation: 1.0, grain: 0.5, vignette: 0.62, halftone: false, paper: false },
    captions: {
      title: 'CHROME DUSK', subtitle: 'The Long Drive Home', tagline: 'HEADLIGHTS OVER THE CAUSEWAY',
      seal: 'EST. 2026 · LEONIDA', volume: 'VOL. 11', wanted: 'NIGHT DRIVER', ribbon: 'DUSK EDITION',
      quote: 'A LOVE LETTER AT 90 MPH', stars: 5,
    },
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || RECIPES[0];
}
