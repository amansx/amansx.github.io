---
title: "Three Hours, Two Renderers, One Plasma Snake"
description: "The journey behind a renderer-agnostic Snake game built for a Squarespace interview in under three hours."
date: 2018-03-05
category: "Archive / Interview build"
read_time: "7 minute read"
thumbnail: "/assets/plasma-snakes-interview-build.png"
image: "../../assets/plasma-snakes-interview-build.png"
repository_url: "https://github.com/amansx/plasma-snakes"
---

The interview exercise was bounded by time, so I made the architecture do more than the clock could.

I built **Plasma Snakes** for a Squarespace interview in under three hours: a playable Snake engine with a glowing Babylon.js presentation, an ASCII renderer, sound, a power-up, and a clean boundary between the rules of the game and the way those rules appeared on screen.

The neon grid was the visible result. The renderer split was the actual decision.

## Start with the part that must be true

Snake has a small set of invariants. A player has a direction, a head, and an ordered body. A board has dimensions and a target. Each tick advances the head, checks the walls and the body, grows or removes the tail, and decides whether the run continues.

I encoded those rules in three small classes:

- `Player` owns direction, head position, and the body “skeleton”;
- `GameBoard` owns the 20-by-40 grid and current power-up coordinates;
- `GameEngine` owns stepping, collision detection, growth, speed changes, and renderer callbacks.

The body is stored as strings such as `"4,12"`. It is not a glamorous representation, but it made occupancy checks and renderer handoff direct under a severe deadline. The engine could answer the only question each view needed: what occupies this coordinate right now?

## One state, two views

The HTML includes a textarea and a canvas. Neither is the game. They are two projections of the same game state.

`RendererAscii` walks the board matrix and prints `_`, `*`, and `o` characters. `Renderer3D` reads the same player skeleton and power-up position, then applies materials to Babylon.js meshes. Direction input changes the player through the same `face()` method in both modes.

That separation gave the interview build a useful demonstration: the engine did not know or care whether a frame became text or WebGL.

```js
engine.step();

if (rendererA) rendererA.render();
if (rendererB) rendererB.render();
```

It also kept scope under control. I could prove the game logic cheaply in ASCII, then spend the remaining time on the 3D presentation without rewriting the rules.

## Spend the polish where it reads

The Babylon.js renderer creates an ArcRotate camera, a dark scene, emissive yellow and magenta materials, a fullscreen Start control, sound effects, background music, and a glow layer. The grid is made from narrow boxes laid across the ground plane. Snake segments rise slightly above it as bright cubes.

The power-up adds a small mechanical twist: for two turns, the step interval changes from 100 milliseconds to 1,000 milliseconds. It is visually obvious, changes the rhythm immediately, and required very little extra surface area in the engine.

The audio is similarly economical. There is a loop for the run, a short sound when the snake feeds, and cheering at game over. Each choice has a clear state transition to attach to.

## Avoid work inside the loop

The board contains 800 possible cells. Instead of constructing and destroying boxes every tick, the 3D renderer creates the cells once. Inactive blocks are moved out of view; active snake and power-up positions are brought back and given the correct material.

```js
clearBlocks() {
  for (const block of this.blocks) block.position.y = 100;
  this.blocks = [];
}
```

That is a tiny object pool. It kept allocation out of the game loop and made frame behavior predictable. Under a three-hour constraint, the simplest performance strategy was to stop doing unnecessary work.

## The repository clock

The public Git history is concentrated on March 5, 2018:

```text
07:54:40 ET  repository initialized
07:55:55 ET  engine, renderers, styles, and audio committed
07:57:26 ET  metadata cleanup
08:30:42 ET  code documentation added
17:09:42 ET  deployed link added to the README
```

The application had been built locally before the source import, so Git cannot measure the full interview clock. It does preserve the shape of the finish: core artifact first, followed by cleanup, documentation, and the hosted demo.

## What survived the deadline

There are things I would refine now: prevent immediate direction reversal, replace key codes, make speed changes easier to reason about, and separate audio policy from rendering. None of that changes what made the exercise successful.

The time limit forced a good priority order:

1. make the rules explicit;
2. make the rules render anywhere;
3. use the final pass to establish a visual identity;
4. document enough that another engineer can follow the decisions.

Plasma Snakes looked like a neon game, but it was really an argument for boundaries. Under pressure, a small interface between state and presentation bought more than any single effect.

[View the Plasma Snakes repository](https://github.com/amansx/plasma-snakes)
