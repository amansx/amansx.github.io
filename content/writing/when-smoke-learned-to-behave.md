---
title: "Stable Systems from Unsolved Mathematical Problems"
description: "Discovering Jos Stam's CPU-powered Stable Fluids in 2010 and the four practical functions that turn a small grid into believable smoke."
date: 2010
category: "Graphics / Simulation"
read_time: "7 minute read"
thumbnail: "/assets/thumb-stable-fluids.svg"
social_image: "/assets/thumb-stable-fluids.png"
---

<iframe src="/experiments/stable-fluids/smokey-mcflame-face/" title="Smokey McFlame Face interactive fluid simulation" scrolling="no"></iframe>

In 2010, I discovered Jos Stam's CPU-powered Stable Fluids algorithm and became fascinated by a simple contradiction: smoke could look alive without making the computer solve every detail of real smoke.

The demonstration felt like a magic trick. A small grid could curl, drift, and respond to a hand in real time. The more interesting part was that the trick became easier to understand when it was separated into four ordinary functions:

1. Add something.
2. Let it spread.
3. Carry it with the flow.
4. Remove accidental compression.

That was the lasting lesson for me. A hard physical problem became approachable when each part was given one clear job.

## First, imagine graph paper

Picture a sheet of graph paper. Every square stores two things:

- a tiny arrow showing where the air is moving;
- a number showing how much smoke is in that square.

The arrows form the velocity field. The smoke numbers form the density field. The program updates both fields many times each second, then draws the density as color.

The grid does not know that it is drawing smoke. It only knows how to store an amount and move that amount according to nearby arrows. The illusion emerges from repeating the same small operations.

## The same kind of magic as ray casting

What made Stable Fluids remarkable was not only the final picture. The useful work could run on the CPU. It did not depend on a modern GPU compute pipeline, specialized hardware, or a giant particle simulation. A processor moved through a compact grid, repeated a few numerical operations, and produced motion that looked far richer than the machinery behind it.

That feeling reminded me of ray casting. Early ray-casting engines took a simple two-dimensional map, sent one ray through each vertical slice of the screen, and turned the distance to the nearest wall into a convincing three-dimensional corridor. The technique did not simulate an entire world. It calculated the parts needed to create the view.

Stable Fluids solves a different problem, but it makes a similar engineering bargain. Instead of following every molecule, it keeps a small field of velocities and densities. Instead of demanding a perfectly exact answer, it protects stability and preserves the motion people notice.

Both algorithms are powerful because they understand the machine and the eye at the same time. They reduce a difficult physical scene to regular CPU work, spend computation where it changes the image, and allow approximation where the viewer will still believe the result.

## A practical answer to Navier-Stokes

Navier-Stokes describes how fluids move. The famous unsolved Millennium Prize problem asks for a proof about whether its three-dimensional solutions always remain smooth under the required conditions. Stable Fluids does not provide that proof.

It does something extremely useful instead. It breaks a region of fluid into a finite grid and calculates an approximate answer for the next frame. The continuous equations become numbers the CPU can repeatedly update.

In that practical sense, Navier-Stokes was solved for a particular graphics problem. The algorithm gave artists and programmers a reliable way to compute believable fluid motion without knowing the exact motion of every molecule or proving what the equations do for every possible case.

The approximation deliberately loses some fine detail. Diffusion softens the image, grid cells limit resolution, and each frame is only a numerical estimate. What it gains is stability. For interactive graphics, a slightly softened plume that keeps moving is often more valuable than a sharper simulation that can blow up.

## The four functions

### 1. Add: put energy and smoke into the grid

Nothing moves until something enters the system. The add function places smoke in a few cells and pushes the velocity arrows.

A candle adds hot material near its wick. A mouse movement adds a sideways push. Gravity, wind, and buoyancy are also just additions to the velocity field.

In simple terms:

```text
new value = old value + source * elapsed time
```

Smokey McFlame Face adds density around the bright center. It also adds an upward push so the color begins to rise. Your pointer adds direction and speed.

### 2. Diffuse: let neighboring cells share

Real smoke does not keep a perfectly sharp edge. Molecules mix, momentum spreads, and thick regions soften into nearby space.

Diffusion models that sharing. Each cell looks at its neighbors and moves a little closer to their values. A high-viscosity fluid shares more strongly and looks thick. A low-viscosity fluid keeps sharper motion.

Doing this with one careless update can become unstable when a frame takes too long. Stam's important choice was to solve for a future grid whose neighboring values already agree. That takes a few repeated passes, but it remains calm at useful frame rates.

The visual tradeoff is gentle blur. Fine detail may fade, but the simulation does not suddenly explode.

### 3. Advect: carry smoke through the velocity field

Advection is the transport step. It answers the question: if this cell contains smoke now, where did that smoke come from?

The obvious approach is to push every old cell forward. That creates a bookkeeping problem. Several cells may land in one place, while other places receive nothing.

Stam reversed the question. For every destination cell, trace its velocity arrow backward through time, find the earlier position, and sample the smoke there.

```text
earlier position = current position - velocity * elapsed time
```

The earlier position usually falls between grid cells, so the algorithm blends the nearest values. That blending loses a little sharpness, but every destination receives an answer. This backward lookup is the heart of the stability people notice.

### 4. Project: stop air from appearing or disappearing

After diffusion and movement, some grid cells may accidentally behave like pumps or drains. More velocity points into a cell than leaves it, or more leaves than enters it.

For smoke, we usually want incompressible flow. The air should move without material appearing from nowhere.

The project function measures this imbalance, called divergence. It builds a pressure field that explains the unwanted compression, then subtracts the pressure slope from the velocity.

```text
corrected velocity = velocity - pressure change
```

After projection, the arrows form a flow that is much closer to balanced. The function is used more than once because diffusion and advection can each introduce new imbalance.

## The order matters

The velocity update follows a practical rhythm:

```text
add forces
diffuse velocity
project velocity
advect velocity
project velocity again
```

Smoke density then uses the finished velocity:

```text
add smoke
diffuse smoke
advect smoke
```

Projection applies to velocity rather than density. Density is the visible passenger. Velocity is the road network carrying it.

## Why it fascinated me

Before finding Stable Fluids, convincing simulation felt like a subject hidden behind advanced mathematics and expensive software. Stam's work did not make the mathematics trivial. It made the engineering legible.

The algorithm showed that stability could be a creative choice. For an interactive image, a believable result that always runs can be more useful than a more exact result that fails when the timestep grows.

It also changed how I looked at systems outside graphics. Separate state from motion. Give each transformation one responsibility. Correct invalid state after operations that can introduce it. Prefer graceful loss of detail over catastrophic failure.

That is why I kept returning to the algorithm. It was not only a way to draw smoke. It was a compact lesson in designing a system that remains useful under pressure.

## From Stable Fluids to Smokey

Smokey McFlame Face keeps the model deliberately small: a 64 x 64 grid, plain JavaScript running the solver on the CPU, and a canvas. The colorful plume is density. The invisible arrows are velocity. Buoyancy pulls the smoke upward, your last pointer movement becomes persistent wind, and projection keeps the motion coherent.

The stars are not part of the fluid solver. They share its last wind vector so the whole scene responds as one small world. The glowing center is the source, and its halo expands with pointer energy before settling back around the planet.

The result is playful, but the machinery is still recognizable: add, diffuse, advect, project. Four small functions, repeated quickly enough, turn a grid of numbers into something that feels alive.

[Run Smokey McFlame Face](/experiments/stable-fluids/smokey-mcflame-face/)

[Read Jos Stam's Stable Fluids paper](https://www.josstam.com/_files/ugd/cf1fd6_898fe9b63df946689101b8d074f8efba.pdf)

[Explore Jos Stam's publications](https://www.josstam.com/publications)
