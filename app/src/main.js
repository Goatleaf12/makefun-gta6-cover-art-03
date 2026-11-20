// Sunset State Cover Studio — entry point.
// No ?shot= query: the full editor. ?shot=editor: the editor, flagged
// ready for its screenshot once samples are in. ?shot=landscape /
// portrait / square: a fixed exported-cover scene (see shots.js).

import { initEditor } from './editor.js';
import { runShot } from './shots.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

if (shot && shot !== 'editor') {
  runShot(params);
} else {
  initEditor(shot === 'editor');
}
