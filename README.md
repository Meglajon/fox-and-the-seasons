# Fox & the Seasons

A cozy, hand-drawn 2D platformer that runs in your browser. Help Fennel the fox wake up the
seasons of Foxhollows: run, jump, bop grumpy critters, and use the power of **Spring** to sprout
bounce-flowers and climbing vines.

Everything is made in code, with no image or audio files:

- **Art**: wobbly "boiling" ink lines, watercolour fills and paper grain, drawn on a canvas.
- **Music**: an original lo-fi soundtrack composed as note data and played by a small
  synthesizer, with tape wobble, vinyl crackle and layers that react to the season you choose.

## Play

Open the GitHub Pages link for this repo (see "Publish" below), or run it locally:

```bash
python tools/serve.py 8080
```

Then open <http://localhost:8080>.

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Move | ← → or A D | Stick / D-pad |
| Jump (hold for higher) | Space or Z | A |
| Sprint / carry / throw | Shift or X | X |
| Next / previous season | E / Q | RB / LB |
| Use / talk / climb | ↑ or W | Up / Y |
| Flip furniture | F | Y |
| Pause / settings | Esc | Start |

Every key can be changed in the **settings cabinet** (Controls drawer).

**On phones and tablets** on-screen controls appear automatically: a direction pad on the left, and
**A** (jump), **B** (run / carry), **↑** (use) and **⟳** (season) on the right. Hold the phone upright and
the controls sit below the game; turn it sideways and they move into columns either side of the game.
You can switch them on or off in the settings cabinet (Display drawer → On-screen controls).

## What's in this build (first playable)

- Title screen with 3 save slots
- **Fennel's Den**: move furniture around, the wardrobe (fur, scarves, hats, extras, name),
  the settings cabinet (sound, controls, assist, display, save slots), a catalogue shop and a storage chest
- Level map of Foxhollows
- **Foxhollows Square**: 2 tutorial levels
- **Bloomwood**: 4 levels (including the auto-scrolling *Bramble Rush*) and the *Overgrown Pumpkin* boss
- 5 lives, extra lives from acorns and berries, checkpoints, golden seeds, and unlockables
- 5 original music tracks plus sound effects

Millpond Reach, Copperleaf Orchard, Sunglass Greenhouse and the Hollow Oak come in later builds.

## Publish on GitHub Pages

1. Create a repo on GitHub and push this folder to it.
2. In the repo, go to **Settings → Pages**, set **Source** to *Deploy from a branch*, and pick `main` / `/ (root)`.
3. After a minute your game is live at `https://<your-username>.github.io/<repo-name>/`.

## Project layout

```
index.html          the page that boots the game
src/core/           loop, input, saving
src/art/            hand-drawn art in code (tiles, fox, critters, furniture, backgrounds)
src/audio/          synth instruments, soundtrack and sound effects
src/game/           levels, player physics, critters, rewards
src/scenes/         title, den, map
src/ui/             menus, dialogue, settings cabinet, wardrobe, shop
tools/serve.py      local dev server (no caching)
```
