// A simple video player that opens over the game to show the trailer.
import { input } from '../core/input.js';
import { audio } from '../audio/audio.js';

export const TRAILER_SRC = 'media/trailer.mp4';
export const TRAILER_POSTER = 'media/trailer-poster.jpg';

export function openTrailer() {
  if (document.getElementById('trailerBox')) return;
  const box = document.createElement('div');
  box.id = 'trailerBox';
  box.innerHTML = `
    <div class="tb-inner">
      <video src="${TRAILER_SRC}" poster="${TRAILER_POSTER}" controls autoplay playsinline></video>
      <button class="tb-close" aria-label="Close trailer">✕ Close</button>
    </div>`;
  document.body.appendChild(box);

  // Pause the game's own music while the trailer plays, and keep keys away from the game.
  const wasRunning = audio.ctx && audio.ctx.state === 'running';
  if (wasRunning) audio.ctx.suspend();
  const prevText = input.text;
  const close = () => {
    if (!box.isConnected) return;
    box.remove();
    input.text = prevText;
    if (wasRunning) audio.ctx.resume();
  };
  input.text = (e) => { if (e.key === 'Escape') { close(); return true; } return false; };
  box.querySelector('.tb-close').addEventListener('click', close);
  box.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (e.target === box) close(); });
  const video = box.querySelector('video');
  video.addEventListener('ended', () => setTimeout(close, 800));
  video.play().catch(() => { /* autoplay blocked: the controls are there */ });
}

// The "Watch the trailer" button shown on the title screen.
export function showTrailerButton(on) {
  let btn = document.getElementById('trailerBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'trailerBtn';
    btn.textContent = '▶ Watch the trailer';
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => { e.stopPropagation(); openTrailer(); });
    document.body.appendChild(btn);
  }
  btn.style.display = on ? 'block' : 'none';
}
