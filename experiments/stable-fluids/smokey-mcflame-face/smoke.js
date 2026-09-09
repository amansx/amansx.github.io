// Keep the simulation deliberately small so the fluid math stays visible.
const N = 64;
// Add a one-cell border around the N x N active grid for boundary conditions.
const STRIDE = N + 2;
// Store every scalar field in one flat typed array for compact, fast access.
const CELLS = STRIDE * STRIDE;
// Convert grid coordinates to the matching flat-array index: i = x + width * y.
const at = (x, y) => x + STRIDE * y;

// Hold horizontal velocity u, vertical velocity v, and smoke density d.
const u = new Float32Array(CELLS);
const v = new Float32Array(CELLS);
const d = new Float32Array(CELLS);
// Reuse three scratch fields instead of allocating memory every animation frame.
const u0 = new Float32Array(CELLS);
const v0 = new Float32Array(CELLS);
const d0 = new Float32Array(CELLS);

// Cache the visible canvas and its drawing context.
const canvas = document.querySelector("#smoke");
const ctx = canvas.getContext("2d", { alpha: false });
// Render the fluid into one pixel per grid cell, then enlarge it smoothly.
const gridCanvas = document.createElement("canvas");
gridCanvas.width = gridCanvas.height = N;
const gridCtx = gridCanvas.getContext("2d", { alpha: true });
const pixels = gridCtx.createImageData(N, N);
// Cache the play control and palette label used by the interface.
const play = document.querySelector("#play");
const paletteName = document.querySelector("#palette");
const stage = document.querySelector(".stage");
// Cache the compact soundtrack controls and two audio decks used for crossfading.
const sound = document.querySelector("#sound");
const volume = document.querySelector("#volume");
const trackButtons = [...document.querySelectorAll("[data-track]")];
const decks = [document.querySelector("#deck-a"), document.querySelector("#deck-b")];

// Keep user-provided music next to the experiment so playback stays local.
const TRACKS = [
  { name: "Missing Budapest", src: "/experiments/stable-fluids/smokey-mcflame-face/audio/missing-budapest.mp3" },
  { name: "Marble Blue", src: "/experiments/stable-fluids/smokey-mcflame-face/audio/marble-blue.mp3" },
  { name: "Made In Moonlight", src: "/experiments/stable-fluids/smokey-mcflame-face/audio/made-in-moonlight.mp3" },
  { name: "Medieval Times", src: "/experiments/stable-fluids/smokey-mcflame-face/audio/medieval-times.mp3" },
  { name: "TranceMixer Budapest Live", src: "/experiments/stable-fluids/smokey-mcflame-face/audio/trancemixer-budapest-live.mp3" }
];
// Seven seconds is long enough to hear one track dissolve into the next.
const CROSSFADE_SECONDS = 7;
// Track which deck and song are leading the equal-power crossfade.
let activeDeck = 0;
let trackIndex = 0;
let fading = false;
let fadeAmount = 0;
let pendingTrackIndex = 1;
let muted = false;
// Start below full volume so the radio enters gently with the animation.
let masterVolume = Number(volume.value);

// Preload the first song on one deck and the second song on the other.
decks.forEach((deck, index) => {
  deck.src = TRACKS[index].src;
  deck.load();
});

// Generate one quiet background field of distant stars at startup.
const stars = Array.from({ length: 84 }, () => ({
  // Normalized positions keep the star field responsive at every canvas size.
  x: Math.random(),
  y: Math.random(),
  // Small speed differences create depth while every star shares one heading.
  speed: .009 + Math.random() * .016,
  // Radius, phase, and pulse control each star's distant gleam.
  radius: .7 + Math.random() * 1.4,
  phase: Math.random() * Math.PI * 2,
  pulse: .6 + Math.random() * 1.2,
  // Depth gives nearby stars a little more travel than distant ones.
  depth: .2 + Math.random() * .8
}));

// Each palette is a three-stop gradient from candle to high smoke.
const PALETTES = [
  { name: "Electric dream", colors: [[255, 224, 87], [255, 87, 207], [119, 197, 255]] },
  { name: "Neon lagoon", colors: [[210, 255, 92], [57, 238, 210], [95, 121, 255]] },
  { name: "Solar orchid", colors: [[255, 238, 115], [255, 111, 168], [185, 103, 255]] },
  { name: "Candy cloud", colors: [[255, 157, 112], [255, 105, 203], [122, 210, 255]] },
  { name: "Prism mint", colors: [[255, 216, 89], [94, 255, 198], [175, 117, 255]] }
];
// Start with one palette and remember the previous one for a soft color crossfade.
let palette = PALETTES[0];
let oldPalette = palette;
// Record when the palette changed so the render step can interpolate for two seconds.
let paletteChangedAt = 0;
// Store one future deadline so the random interval stays stable between frames.
let nextPaletteAt = 0;

// Track simulation state, frame timing, and the pointer in normalized canvas space.
let running = false;
let frameId = 0;
let lastFrame = 0;
let elapsed = 0;
const pointer = { x: .5, y: .28, active: false, movedAt: 0 };
// Target wind remembers the last pointer heading after the pointer stops.
const targetWind = { x: .004, y: 0 };
// Wind eases toward that target so smoke and stars turn as one fluid system.
const wind = { x: .004, y: 0 };
// Pointer speed briefly expands the centered halo, then it settles around the core.
let haloEnergy = 0;
let haloImpulse = 0;
let lastGestureAt = 0;

// Copy values into the ghost border so velocity cannot leak through the box.
function setBoundary(kind, field) {
  // A horizontal velocity flips at left and right walls; scalars are copied.
  for (let i = 1; i <= N; i++) {
    field[at(0, i)] = kind === 1 ? -field[at(1, i)] : field[at(1, i)];
    field[at(N + 1, i)] = kind === 1 ? -field[at(N, i)] : field[at(N, i)];
    // A vertical velocity flips at top and bottom walls; scalars are copied.
    field[at(i, 0)] = kind === 2 ? -field[at(i, 1)] : field[at(i, 1)];
    field[at(i, N + 1)] = kind === 2 ? -field[at(i, N)] : field[at(i, N)];
  }
  // A corner is the average of its two neighboring boundary cells.
  field[at(0, 0)] = .5 * (field[at(1, 0)] + field[at(0, 1)]);
  field[at(0, N + 1)] = .5 * (field[at(1, N + 1)] + field[at(0, N)]);
  field[at(N + 1, 0)] = .5 * (field[at(N, 0)] + field[at(N + 1, 1)]);
  field[at(N + 1, N + 1)] = .5 * (field[at(N, N + 1)] + field[at(N + 1, N)]);
}

// Approximate Ax = b with eight Gauss-Seidel sweeps through neighboring cells.
function solve(kind, x, source, a, c) {
  // Repeated relaxation spreads new information across the grid without instability.
  for (let pass = 0; pass < 8; pass++) {
    for (let y = 1; y <= N; y++) for (let gridX = 1; gridX <= N; gridX++) {
      // x = (source + a * sum(neighbors)) / c is the local linear-system update.
      x[at(gridX, y)] = (source[at(gridX, y)] + a * (x[at(gridX - 1, y)] + x[at(gridX + 1, y)] + x[at(gridX, y - 1)] + x[at(gridX, y + 1)])) / c;
    }
    // Reapply wall behavior after every relaxation pass.
    setBoundary(kind, x);
  }
}

// Diffusion solves x - viscosity * dt * Laplacian(x) = source.
function diffuse(kind, x, source, amount, dt) {
  // Scaling by N squared converts the normalized diffusion rate to grid units.
  const a = dt * amount * N * N;
  // The 2D five-point Laplacian gives four neighbors, hence 1 + 4a.
  solve(kind, x, source, a, 1 + 4 * a);
}

// Semi-Lagrangian advection asks where each current cell came from one step ago.
function advect(kind, out, source, flowU, flowV, dt) {
  // Convert normalized velocity into cell travel over this timestep.
  const scale = dt * N;
  for (let y = 1; y <= N; y++) for (let x = 1; x <= N; x++) {
    // Backtrace through velocity instead of pushing material forward.
    const px = Math.max(.5, Math.min(N + .5, x - scale * flowU[at(x, y)]));
    const py = Math.max(.5, Math.min(N + .5, y - scale * flowV[at(x, y)]));
    // Split the traced point into four sample cells and bilinear weights.
    const x0 = Math.floor(px), x1 = x0 + 1, sx = px - x0;
    const y0 = Math.floor(py), y1 = y0 + 1, sy = py - y0;
    // Bilinear interpolation is stable and supplies Stam's characteristic softening.
    out[at(x, y)] = (1 - sx) * ((1 - sy) * source[at(x0, y0)] + sy * source[at(x0, y1)]) + sx * ((1 - sy) * source[at(x1, y0)] + sy * source[at(x1, y1)]);
  }
  // Apply the same wall rule to the newly transported field.
  setBoundary(kind, out);
}

// Projection removes divergence so the velocity field conserves volume.
function project(flowU, flowV, pressure, divergence) {
  for (let y = 1; y <= N; y++) for (let x = 1; x <= N; x++) {
    // div(u) = du/dx + dv/dy, estimated here with centered differences.
    divergence[at(x, y)] = -.5 * (flowU[at(x + 1, y)] - flowU[at(x - 1, y)] + flowV[at(x, y + 1)] - flowV[at(x, y - 1)]) / N;
    // Start the pressure Poisson solve from zero.
    pressure[at(x, y)] = 0;
  }
  // Scalar pressure and divergence copy rather than reflect at walls.
  setBoundary(0, divergence);
  setBoundary(0, pressure);
  // Solve Laplacian(pressure) = divergence using the same neighbor relaxer.
  solve(0, pressure, divergence, 1, 4);
  for (let y = 1; y <= N; y++) for (let x = 1; x <= N; x++) {
    // Subtract grad(pressure), leaving an approximately divergence-free flow.
    flowU[at(x, y)] -= .5 * N * (pressure[at(x + 1, y)] - pressure[at(x - 1, y)]);
    flowV[at(x, y)] -= .5 * N * (pressure[at(x, y + 1)] - pressure[at(x, y - 1)]);
  }
  // Restore no-flow boundary behavior after pressure correction.
  setBoundary(1, flowU);
  setBoundary(2, flowV);
}

// Inject a circular nebula source, buoyancy, a hand-drawn wave, and pointer attraction.
function addForces(dt) {
  // Keep the luminous source near the middle while its plume sways above it.
  const sourceX = N * .5 + Math.sin(elapsed * 1.7) * 1.2;
  const sourceY = Math.round(N * .6);
  for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) {
    // A radial falloff makes the source rounded rather than square.
    const weight = Math.max(0, 1 - Math.hypot(ox, oy) / 4);
    const index = at(Math.round(sourceX + ox), sourceY + oy);
    // Density is the visible smoke carried by the velocity field.
    d[index] = Math.min(9, d[index] + weight * dt * 112);
    // A small radial impulse makes the center breathe like a distant nebula.
    u[index] += ox * weight * dt * .7;
    v[index] += oy * weight * dt * .7;
    // Negative canvas y then carries the emitted flame upward.
    v[index] -= weight * dt * 7.2;
    // A sine force is the wave principle: bend left, then right, as time advances.
    u[index] += weight * Math.sin(elapsed * 2.6 + oy * .7) * dt * 3.2;
  }
  for (let y = 1; y <= N; y++) for (let x = 1; x <= N; x++) {
    const index = at(x, y);
    // Density adds gentle buoyancy throughout the plume, not only at the source.
    v[index] -= Math.min(d[index], 7) * dt * .018;
    // Offset the wave by height so the smoke reads as a chain of soft S curves.
    u[index] += Math.sin(elapsed * 2.1 + y * .31) * Math.min(d[index], 5) * dt * .012;
    // Persistent wind carries every smoky cell along the last pointer heading.
    const smokeWeight = Math.min(d[index], 3);
    u[index] += wind.x * smokeWeight * dt * 4;
    v[index] += wind.y * smokeWeight * dt * 4;
    if (pointer.active && d[index] > .02) {
      // Convert the pointer from normalized canvas space to grid coordinates.
      const dx = pointer.x * N - x;
      const dy = pointer.y * N - y;
      // Inverse distance makes the pull broad and calm instead of snapping sharply.
      const pull = .85 * dt / (Math.hypot(dx, dy) + 5);
      // Accelerate smoky cells toward the pointer, scaled by their local density.
      u[index] += dx * pull * Math.min(d[index], 2);
      v[index] += dy * pull * Math.min(d[index], 2);
    }
  }
}

// Advance velocity with Stam's diffuse, project, advect, project sequence.
function stepVelocity(dt) {
  // Diffuse old velocity into scratch fields using a tiny viscosity.
  diffuse(1, u0, u, .000018, dt);
  diffuse(2, v0, v, .000018, dt);
  // Make the diffused field incompressible before it transports itself.
  project(u0, v0, u, v);
  // Carry each velocity component backward through that corrected field.
  advect(1, u, u0, u0, v0, dt);
  advect(2, v, v0, u0, v0, dt);
  // Project again because advection can reintroduce small divergence errors.
  project(u, v, u0, v0);
  // Remove a little energy so continuous forces settle instead of accumulating forever.
  for (let i = 0; i < CELLS; i++) {
    u[i] *= .992;
    v[i] *= .992;
  }
}

// Advance smoke density through the finished velocity field.
function stepDensity(dt) {
  // Diffuse a little so adjacent grid cells blend into a soft plume.
  diffuse(0, d0, d, .000008, dt);
  // Backtrace density through velocity to move smoke without numerical blowup.
  advect(0, d, d0, u, v, dt);
  // Fade old smoke so the canvas reaches a visual steady state.
  for (let i = 0; i < CELLS; i++) d[i] = Math.min(9, Math.max(0, d[i] * .991));
}

// Keep a damaged numerical field from spreading across later solver passes.
function stabilizeFields() {
  let invalid = false;
  for (let i = 0; i < CELLS; i++) {
    if (!Number.isFinite(u[i]) || !Number.isFinite(v[i]) || !Number.isFinite(d[i])) {
      invalid = true;
      break;
    }
    // A bounded velocity still leaves ample room for the visible plume to move.
    u[i] = Math.max(-4, Math.min(4, u[i]));
    v[i] = Math.max(-4, Math.min(4, v[i]));
  }
  if (!invalid) return;
  // Recover to a clean opening state if a browser interruption produced invalid math.
  u.fill(0);
  v.fill(0);
  d.fill(0);
  u0.fill(0);
  v0.fill(0);
  d0.fill(0);
  primeSmoke();
}

// Linearly interpolate between two RGB triplets.
const mixColor = (a, b, t) => a.map((value, i) => value + (b[i] - value) * t);
// Convert one RGB triplet into a canvas color string with optional transparency.
const cssColor = (color, alpha = 1) => `rgba(${color.map(Math.round).join(",")},${alpha})`;
// Sample a palette's three-stop gradient at t from zero to one.
function samplePalette(selected, t) {
  // Use the lower pair below halfway and the upper pair above halfway.
  const band = t < .5 ? 0 : 1;
  const localT = t < .5 ? t * 2 : (t - .5) * 2;
  // Blend the two colors surrounding the current gradient position.
  return mixColor(selected.colors[band], selected.colors[band + 1], localT);
}

// Pick a different soothing palette and let rendering crossfade into it.
function choosePalette(now) {
  // Preserve the current palette as the start of the next transition.
  oldPalette = palette;
  // Retry until the random choice differs from the current palette.
  do palette = PALETTES[Math.floor(Math.random() * PALETTES.length)]; while (palette === oldPalette);
  // Save transition time and expose the new palette name in the interface.
  paletteChangedAt = now;
  // Wait nine to twelve seconds before selecting another palette.
  nextPaletteAt = now + 9000 + Math.random() * 3000;
  paletteName.textContent = palette.name;
}

// Apply an equal-power fade: cos(theta) out while sin(theta) fades in.
function applyVolumes() {
  // Muting sets both decks to zero without interrupting their shared timeline.
  const master = muted ? 0 : masterVolume;
  // theta runs from zero to pi / 2 across one crossfade.
  const theta = fadeAmount * Math.PI * .5;
  // The outgoing and incoming amplitudes retain more perceived loudness than a linear fade.
  decks[activeDeck].volume = master * (fading ? Math.cos(theta) : 1);
  decks[1 - activeDeck].volume = master * (fading ? Math.sin(theta) : 0);
}

// Begin the next song on the silent deck while the current one still plays.
function beginCrossfade(nextIndex = (trackIndex + 1) % TRACKS.length) {
  // Ignore repeat clicks until the current handoff completes.
  if (fading) return;
  fading = true;
  fadeAmount = 0;
  pendingTrackIndex = nextIndex;
  // Lock track selection until the two decks finish their audio handoff.
  trackButtons.forEach(button => { button.disabled = true; });
  // Rewind the prepared next deck before bringing it into the mix.
  const next = decks[1 - activeDeck];
  next.src = TRACKS[nextIndex].src;
  next.load();
  next.currentTime = 0;
  next.play().catch(() => {});
  applyVolumes();
}

// Promote the incoming deck and prepare the old deck for the following song.
function finishCrossfade() {
  // Pause and rewind the deck that just faded out.
  const old = decks[activeDeck];
  old.pause();
  old.currentTime = 0;
  // The incoming deck becomes the new source of playback and progress.
  activeDeck = 1 - activeDeck;
  trackIndex = pendingTrackIndex;
  fading = false;
  fadeAmount = 0;
  // Restore direct selection as soon as only one deck remains audible.
  trackButtons.forEach(button => { button.disabled = false; });
  // Highlight the song that now owns the active deck.
  trackButtons.forEach((button, index) => button.classList.toggle("is-active", index === trackIndex));
  // Load the song after the new active track onto the now-silent spare deck.
  old.src = TRACKS[(trackIndex + 1) % TRACKS.length].src;
  old.load();
  applyVolumes();
}

// Start every currently relevant deck from the user's main play gesture.
function playSoundtrack() {
  const current = decks[activeDeck];
  // Restart a completed song rather than leaving the player at its final frame.
  if (current.ended) current.currentTime = 0;
  current.play().catch(() => {});
  // Resume the incoming song too when the user paused during a crossfade.
  if (fading) decks[1 - activeDeck].play().catch(() => {});
}

// Pause both decks so visual motion and soundtrack stop together.
function pauseSoundtrack() {
  decks.forEach(deck => deck.pause());
}

// Start the next song seven seconds before this one ends.
function updateSoundtrack() {
  const current = decks[activeDeck];
  // Metadata arrives asynchronously, so wait until duration is known.
  if (!Number.isFinite(current.duration) || current.duration === 0) return;
  // Remaining time drives the automatic overlap between the two files.
  const remaining = current.duration - current.currentTime;
  if (!fading && remaining <= CROSSFADE_SECONDS) beginCrossfade();
  if (fading) {
    // The incoming deck's playback time is a pause-safe zero-to-one fade clock.
    fadeAmount = Math.max(0, Math.min(1, decks[1 - activeDeck].currentTime / CROSSFADE_SECONDS));
    applyVolumes();
    // Complete the handoff when the outgoing file reaches its end.
    if (current.ended || fadeAmount >= .999) finishCrossfade();
  }
}

// Convert density cells into a softly enlarged field of colored pixels.
function render(now) {
  // Fade between palettes for two seconds after each random change.
  const fade = Math.min(1, (now - paletteChangedAt) / 2000);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    // Exponential mapping keeps dense smoke bright without clipping abruptly.
    const smoke = 1 - Math.exp(-d[at(x + 1, y + 1)] * .34);
    // Color position rises with the plume and ripples slightly across its width.
    const gradient = Math.max(0, Math.min(1, 1 - y / N + Math.sin(x * .18) * .06));
    // Crossfade the old and new gradient samples, not just their endpoints.
    const color = mixColor(samplePalette(oldPalette, gradient), samplePalette(palette, gradient), fade);
    // Preserve the saturated palette instead of lifting dense smoke toward white.
    const bright = color.map(channel => Math.min(255, channel * 1.08));
    const pixel = 4 * (x + N * y);
    pixels.data[pixel] = bright[0];
    pixels.data[pixel + 1] = bright[1];
    pixels.data[pixel + 2] = bright[2];
    // Transparent empty cells let the distant star field remain behind the smoke.
    pixels.data[pixel + 3] = Math.min(1, smoke * 1.3) * 255;
  }
  // Paint deep space before compositing stars and the transparent fluid field.
  ctx.fillStyle = "#050811";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Gleam gently while all stars drift in the same quiet direction.
  for (const star of stars) {
    const gleam = .22 + .58 * (.5 + .5 * Math.sin(now * .001 * star.pulse + star.phase));
    // Positions are advanced by persistent flow, so leaving the canvas cannot snap them back.
    const starX = star.x;
    const starY = star.y;
    ctx.fillStyle = `rgba(210,230,255,${gleam})`;
    ctx.beginPath();
    ctx.arc(starX * canvas.width, starY * canvas.height, star.radius * canvas.width / 720, 0, Math.PI * 2);
    ctx.fill();
  }
  // Upload the N x N smoke field, then scale it to the responsive canvas.
  gridCtx.putImageData(pixels, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(gridCanvas, 0, 0, canvas.width, canvas.height);
  // Draw a compact circular nebula core at the source of the simulated flame.
  const center = canvas.width * .5;
  const base = canvas.height * .6;
  // Keep halo and planet concentric while pointer energy changes only the halo radius.
  const haloRadius = canvas.width * (.048 + haloEnergy * .034);
  // Sample the tweened smoke palette so the nebula flame changes with its plume.
  const flameLow = mixColor(samplePalette(oldPalette, 0), samplePalette(palette, 0), fade);
  const flameMid = mixColor(samplePalette(oldPalette, .5), samplePalette(palette, .5), fade);
  const flameHigh = mixColor(samplePalette(oldPalette, 1), samplePalette(palette, 1), fade);
  // Screen blending and a palette-colored shadow create the saturated outer glow.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.shadowColor = cssColor(flameMid);
  ctx.shadowBlur = canvas.width * (.018 + haloEnergy * .018);
  const glow = ctx.createRadialGradient(center, base, canvas.width * .012, center, base, haloRadius);
  glow.addColorStop(0, cssColor(flameLow, .72));
  glow.addColorStop(.32, cssColor(flameLow, .62));
  glow.addColorStop(.66, cssColor(flameMid, .36));
  glow.addColorStop(1, cssColor(flameHigh, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(center, base, haloRadius, 0, Math.PI * 2);
  ctx.fill();
  // A white-hot circular center keeps the nebula brilliant in every palette.
  const core = ctx.createRadialGradient(center, base, 0, center, base, canvas.width * .026);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(.3, cssColor(flameLow, 1));
  core.addColorStop(.72, cssColor(flameMid, .9));
  core.addColorStop(1, cssColor(flameHigh, .08));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(center, base, canvas.width * .026, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Mark the active target so the chase interaction is immediately legible.
  if (pointer.active) {
    ctx.strokeStyle = "rgba(245,241,232,.75)";
    ctx.lineWidth = Math.max(1, canvas.width / 700);
    ctx.beginPath();
    ctx.arc(pointer.x * canvas.width, pointer.y * canvas.height, 11, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Run one animation frame using a capped real-time timestep.
function animate(now) {
  // Stop scheduling work while paused.
  if (!running) return;
  // Cap dt so a background-tab pause cannot create one giant simulation step.
  const dt = Math.min(.033, (now - lastFrame) / 1000 || .016);
  lastFrame = now;
  elapsed += dt;
  // Ease toward the last cursor heading instead of turning every visual abruptly.
  const steering = Math.min(1, dt * 4.5);
  wind.x += (targetWind.x - wind.x) * steering;
  wind.y += (targetWind.y - wind.y) * steering;
  // Grow quickly while the pointer moves, then breathe back toward the planet.
  const haloTarget = now - lastGestureAt < 90 ? haloImpulse : 0;
  const haloEase = Math.min(1, dt * (haloTarget > haloEnergy ? 10 : 2.4));
  haloEnergy += (haloTarget - haloEnergy) * haloEase;
  // Normalize remembered wind so star depth changes speed without changing heading.
  const headingLength = Math.hypot(wind.x, wind.y) || 1;
  const headingX = wind.x / headingLength;
  const headingY = wind.y / headingLength;
  // Wind magnitude preserves the speed of the last meaningful pointer gesture.
  const flowSpeed = Math.max(.45, Math.min(5, headingLength / .004));
  // Advance every star along that persistent heading and wrap both axes.
  for (const star of stars) {
    star.x = (star.x + headingX * star.speed * star.depth * flowSpeed * dt + 1) % 1;
    star.y = (star.y + headingY * star.speed * star.depth * flowSpeed * dt + 1) % 1;
  }
  // Choose a new gradient at a calm, irregular interval around ten seconds.
  if (now >= nextPaletteAt) choosePalette(now);
  // Apply external forces before solving the velocity and density fields.
  addForces(dt);
  stepVelocity(dt);
  stepDensity(dt);
  stabilizeFields();
  // Advance the two-deck player in the same frame loop.
  updateSoundtrack();
  render(now);
  // Ask the browser for the next display-synchronized frame.
  frameId = requestAnimationFrame(animate);
}

// Resize drawing pixels to the canvas's CSS size for sharp high-DPI rendering.
function resize() {
  const box = canvas.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(box.width * scale));
  canvas.height = Math.max(1, Math.round(box.height * scale));
  render(performance.now());
}

// Translate mouse, pen, or touch coordinates into zero-to-one canvas space.
function movePointer(event) {
  const box = canvas.getBoundingClientRect();
  // Measure the new normalized point before replacing the previous one.
  const nextX = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
  const nextY = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
  const dx = nextX - pointer.x;
  const dy = nextY - pointer.y;
  const distance = Math.hypot(dx, dy);
  const movedAt = performance.now();
  // A meaningful pointer movement establishes a direction that persists afterward.
  if (pointer.active && distance > .001) {
    // Normalize distance by event time so a fast sweep creates faster continuing drift.
    const seconds = Math.max(.008, (movedAt - pointer.movedAt) / 1000);
    const pointerSpeed = distance / seconds;
    const flowMagnitude = .0025 + Math.min(.0175, pointerSpeed * .0045);
    targetWind.x = dx / distance * flowMagnitude;
    targetWind.y = dy / distance * flowMagnitude;
    // Fast gestures make the halo bloom without moving it away from the core.
    haloImpulse = Math.min(1, .18 + pointerSpeed * .24);
    lastGestureAt = movedAt;
  }
  pointer.x = nextX;
  pointer.y = nextY;
  pointer.movedAt = movedAt;
  pointer.active = true;
  // Repaint paused frames so the target marker follows the pointer before play.
  if (!running) render(performance.now());
}

// Hide the target marker without changing the remembered wind.
function leavePointer() {
  pointer.active = false;
  if (!running) render(performance.now());
}

// Warm the real solver into a visible opening plume without starting audio or motion.
function primeSmoke() {
  // Forty short steps are enough to lift color above the central source.
  for (let step = 0; step < 40; step++) {
    elapsed += .03;
    addForces(.03);
    stepVelocity(.03);
    stepDensity(.03);
  }
  // Begin interactive time at zero after preserving the computed fluid fields.
  elapsed = 0;
}

// Toggle one clear play control instead of running motion before consent.
function toggle() {
  running = !running;
  play.setAttribute("aria-pressed", String(running));
  stage.classList.toggle("is-playing", running);
  if (running) {
    lastFrame = performance.now();
    choosePalette(lastFrame);
    cancelAnimationFrame(frameId);
    playSoundtrack();
    frameId = requestAnimationFrame(animate);
  } else {
    pauseSoundtrack();
  }
}

// Wire accessible controls and pointer input.
play.addEventListener("click", toggle);
// Once running, selecting the space scene pauses both animation and radio.
stage.addEventListener("click", event => {
  if (event.target !== play && running) toggle();
});
// Let sound be disabled without stopping either the smoke or the playlist timeline.
sound.addEventListener("click", () => {
  muted = !muted;
  sound.textContent = muted ? "Unmute" : "Mute";
  sound.setAttribute("aria-pressed", String(muted));
  applyVolumes();
});
// Let every visible song title select that track directly.
trackButtons.forEach((button, index) => button.addEventListener("click", () => {
  // Ignore the already active song unless another deck is currently fading in.
  if (index === trackIndex && !fading) return;
  if (running) {
    if (!fading) {
      // A direct choice becomes visible immediately while its audio fades in.
      trackButtons.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === index));
      beginCrossfade(index);
    }
    return;
  }
  // While paused, load the selected song immediately and prepare its successor.
  decks.forEach(deck => deck.pause());
  fading = false;
  fadeAmount = 0;
  trackIndex = index;
  decks[activeDeck].src = TRACKS[trackIndex].src;
  decks[activeDeck].currentTime = 0;
  decks[activeDeck].load();
  decks[1 - activeDeck].src = TRACKS[(trackIndex + 1) % TRACKS.length].src;
  decks[1 - activeDeck].load();
  trackButtons.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === trackIndex));
  applyVolumes();
}));
// Apply slider changes to both decks without disturbing their crossfade ratio.
volume.addEventListener("input", () => {
  masterVolume = Number(volume.value);
  // Reaching zero is the slider equivalent of pressing the mute button.
  if (masterVolume === 0) {
    muted = true;
    sound.textContent = "Unmute";
    sound.setAttribute("aria-pressed", "true");
  }
  // Moving a silent slider upward restores sound as a natural volume interaction.
  if (masterVolume > 0 && muted) {
    muted = false;
    sound.textContent = "Mute";
    sound.setAttribute("aria-pressed", "false");
  }
  applyVolumes();
});
canvas.addEventListener("pointermove", movePointer);
canvas.addEventListener("pointerdown", movePointer);
canvas.addEventListener("pointerleave", leavePointer);
window.addEventListener("resize", resize);
// Discard time spent in a hidden tab so returning cannot create a stale frame jump.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) lastFrame = performance.now();
});
window.addEventListener("pageshow", () => {
  lastFrame = performance.now();
});
// Seed visible smoke, then draw the paused opening frame.
primeSmoke();
resize();
