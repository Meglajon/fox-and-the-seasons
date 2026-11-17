// Boot: settings, input bindings, canvas, audio unlock, font, and the title screen.
import { initEngine, start, setScene, engine, debugStep } from './core/engine.js';
import { input, DEFAULT_BINDINGS } from './core/input.js';
import { loadSettings, state, saveGame } from './core/state.js';
import { initAudio } from './audio/audio.js';
import { drawToasts } from './ui/ui.js';
import { applySettings } from './ui/screens.js';
import { TitleScene } from './scenes/title.js';

loadSettings();
if (state.settings.bindings) input.bindings = { ...DEFAULT_BINDINGS, ...state.settings.bindings };
initEngine(document.getElementById('game'));
engine.drawToasts = drawToasts;
applySettings();
input.gesture.push(initAudio);
addEventListener('visibilitychange', () => { if (document.hidden && state.data) saveGame(); });

const fontReady = document.fonts
  ? Promise.race([document.fonts.load('24px "Patrick Hand"'), new Promise((r) => setTimeout(r, 2500))])
  : Promise.resolve();
fontReady.catch(() => {}).finally(() => {
  document.getElementById('boot')?.remove();
  document.getElementById('game').focus();
  setScene(new TitleScene());
  start();
});
// Exposed for debugging in the browser console.
window.__fox = { engine, state, step: debugStep, input };
