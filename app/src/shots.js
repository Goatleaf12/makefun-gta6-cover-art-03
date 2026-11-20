// Fixed scenes for the entry's screenshots, selected with ?shot=<name>.
// Each cover scene applies one recipe, paints it full-bleed with the same
// drawCover routine the editor uses, and raises window.__shotReady once
// the frame is on screen so the screenshot driver can capture it.

import { drawCover } from './render.js';
import { recipeById } from './palette.js';
import { loadSamples, makeStateFromRecipe } from './editor.js';

const SCENES = {
  landscape: 'sunset-headliner',
  portrait: 'print-comic',
  square: 'neon-confidential',
};

export async function runShot(params) {
  const kind = params.get('shot');
  const recipe = recipeById(SCENES[kind] || 'sunset-headliner');
  document.body.classList.add('shot-cover');
  await Promise.all([
    document.fonts.load('100px Anton'), document.fonts.load('60px Pacifico'),
    document.fonts.load('700 40px Oswald'), document.fonts.load('600 40px Oswald'),
    document.fonts.ready,
  ]);
  const photos = await loadSamples();
  const state = makeStateFromRecipe(recipe);
  const canvas = document.getElementById('cover');
  drawCover(canvas, state, photos, {});
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { window.__shotReady = true; });
  });
}
