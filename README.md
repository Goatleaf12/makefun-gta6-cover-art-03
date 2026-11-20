# Sunset State Cover Studio

A GTA-style cover-art maker for the make.fun **gta6-cover-art-01** competition.
Design a pulp poster cover for the fictional state of Leonida: arrange photos
in comic panels, grade them like a 1980s crime paperback, and finish with
full magazine lettering — then export a pixel-exact PNG in three sizes.

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Goatleaf12/makefun-gta6-cover-art-03/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Goatleaf12/makefun-gta6-cover-art-03/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Competition page: https://make.fun/bounty/gta6-cover-art-01

## What it does

- **One render routine** (`app/src/render.js`) draws the editor preview and
  every export, so the PNG you download is exactly the cover you see.
- **9 panel layouts** defined per aspect ratio — Hero, Hero Right, Comic
  Slant (angled polygon panels), Grid 3×3, Mosaic, Single, Split Duo,
  Cover Story and Filmstrip — with per-panel location tags.
- **9 colour grades** — Vice Sunset, Neon Night, Golden Hour, Duotone
  Pink/Teal, Comic Ink (with halftone dots), Natural, Noir Mono, Chrome
  Dusk and Painterly Wash — plus strength, contrast, saturation, grain and
  vignette sliders, halftone and paper-texture finishes.
- **5 one-click cover recipes** (Sunset Headliner, Neon Confidential, Print
  Comic, Golden Coast, Chrome Dusk) that set layout, grade, size, captions
  and effects together, in the style of winning covers.
- **Full lettering**: gradient Anton title with hard shadow, thick outline
  and auto-fit; Pacifico neon script subtitle; stars and a review quote;
  starburst seal; volume and wanted tags; corner ribbon; a palm-silhouette
  bottom band with tagline, catalog microtext and a barcode drawn from the
  title's own hash.
- **A real editor**: dark three-column layout, header steps
  "1 Add photos · 2 Pick a size · 3 Export PNG", a photo strip with
  brush-pick and drag-onto-panel replace, per-panel pan / zoom / re-centre,
  fill-all and spread-all, and your own photos via file picker or drag-drop.
  Photos never leave the machine — everything runs locally, offline.
- **Exports** at exactly 1920×1080, 1080×1350 and 1080×1080 PNG, plus an
  EXPORT ALL button that downloads the three sizes in sequence.

Ten sample plates are included in `app/samples/`. They were painted
procedurally by `tools/make-samples.py` (layered skies, seas, skylines,
palms, neon signs and film grain, all from code) so the studio works the
moment it opens. The display fonts (Anton, Pacifico, Oswald — SIL Open Font
License 1.1, see `app/fonts/OFL.txt`) are fetched from the Google Fonts
repository by `tools/fetch-fonts.py`; the app itself makes no network
requests.

## Run it

```sh
node serve.ts
```

then open http://localhost:8080 in a desktop browser. Or just open
`app/index.html` through any static file server — it is plain HTML, CSS and
ES modules with no build step and no dependencies.

## Hand-in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

## Screenshots

1. `screenshots/1-cover-landscape.jpg` — the Sunset Headliner cover, 1920×1080 design at 1280×720.
2. `screenshots/2-editor.jpg` — the editor with photo strip, layout minimaps and grade chips.
3. `screenshots/3-cover-portrait.jpg` — Print Comic recipe: Comic Slant layout, halftone, "NEON HUSTLE".
4. `screenshots/4-cover-square.jpg` — Neon Confidential recipe: Grid 3×3, "MIDNIGHT VICE".

All four are real renders of the app, captured by `tools/take-screenshots.mjs`.
