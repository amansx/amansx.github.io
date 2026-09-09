---
title: "Not Your Model, Not Your Research"
description: "From the Millennium Prize problems and Jos Stam's Stable Fluids to the allegation that OpenAI stole a proof: creativity, research custody, and China's open-model strategy."
date: 2026-09-09
category: "Systems / Research infrastructure"
read_time: "11 minute read"
thumbnail: "/assets/thumb-not-your-model.svg"
social_image: "/assets/thumb-not-your-model.png"
---

Not your model, not your research. Here the phrase describes a custody limit: the researcher does not control the hosted model, its memory, its training boundary, or the provider's evidence about where one idea ended and another began.

## What is a Millennium Prize problem?

In 2000, the Clay Mathematics Institute named seven problems whose solutions would close some of the deepest gaps in modern mathematics. Each carries a one-million-dollar prize, but the real reward is historical: a solution must survive publication, expert scrutiny, and time. Only the Poincaré conjecture has been resolved.

The Navier-Stokes problem asks whether the equations used to describe fluid motion always produce smooth, well-behaved solutions in three dimensions, given suitable starting conditions, or whether a singularity can form in finite time. A singularity is a mathematical breakdown where some quantity becomes unbounded and the classical solution stops behaving as expected.

This is easy to confuse with a different achievement. Engineers and graphics researchers already solve useful approximations of Navier-Stokes every day. Weather models, aircraft simulations, visual effects, games, and interactive art can all compute fluid motion without settling the prize problem. The prize asks for a proof about the equations themselves. A simulation asks for a useful numerical answer under chosen assumptions.

> Mathematics asks whether the river can become impossible. Graphics asks whether we can make convincing smoke before the next frame.

## Back in the day came Jos Stam

By the late 1990s, physically based fluid animation was possible, but interactivity was fragile. Earlier graphics solvers commonly advanced a fluid directly from one grid state to the next. If velocity increased, the grid became finer, or the timestep grew too large, errors could compound until the simulation blew up. The safe response was to take smaller steps and perform more computation, which worked against real-time control.

Jos Stam's creative move in *Stable Fluids* was not to discover Navier-Stokes. It was to change the definition of success. An engineering simulation may prioritize strict physical accuracy. An animator needs believable motion, immediate response, and a system that does not explode halfway through an interaction. Stam accepted some artificial damping in exchange for stability at large timesteps.

His solver separated the fluid update into understandable operations:

```text
add force → transport → diffuse → project
```

1. Add forces from the animator or environment.
2. Move information by tracing each destination backward through the old flow.
3. Model viscosity with a stable implicit solve.
4. Remove artificial compression so the velocity conserves mass.

The backward transport step became especially influential. Instead of pushing a value forward and hoping it lands safely on the grid, each destination cell asks where its contents came from and samples that earlier location. The method is stable even when a particle travels across several cells in one step. Interpolation smooths away some fine swirls, but the system keeps running.

Diffusion handles viscosity. A direct explicit update can overshoot when the timestep is large. Stam instead solves an implicit linear system for the future field, so the new grid already satisfies the diffusion relationship between neighboring cells. The solve costs more per step, but it removes the small-timestep restriction that made interaction brittle.

The final projection restores incompressibility. Intermediate operations can leave cells behaving like unexplained sources or drains. Using the Helmholtz-Hodge decomposition, the solver finds a pressure field whose gradient contains that compressive component, then subtracts the gradient from velocity. The remaining field has zero divergence and conserves mass.

*Stable Fluids* appeared at SIGGRAPH 1999. SIGGRAPH is the Association for Computing Machinery's flagship conference on computer graphics and interactive techniques, where foundational research often moves directly into films, games, design tools, and GPU hardware. A live, controllable three-dimensional fluid at that venue was not merely a paper result. It was a demonstration that artists could work with simulated smoke, gases, and flowing textures as responsive material.

The original implementation was roughly 500 lines of C. It supported two-dimensional and three-dimensional flows, transported density and texture coordinates, responded to forces in real time, and ran on the workstation hardware of its day. More accurate methods later restored lost detail, handled free surfaces, and moved the computation onto GPUs. Modern production solvers are far beyond the 1999 code, but the architecture remains recognizable.

We still use the idea because it solved the product problem as well as the mathematical one. Variations of Stable Fluids appear in visual effects, games, interactive paint, browser experiments, mobile graphics, and real-time smoke. The work endured because Stam explained the compromise and published enough for other people to reproduce, criticize, and improve it.

## Then came the allegation

On September 8, 2026, a widely shared [X post alleged that OpenAI stole a Navier-Stokes proof](https://x.com/ns123abc/status/2097423705240428932?s=20). Its story is direct: outside mathematicians had been working with Codex; OpenAI had their logs; the company found promising private work, scaled it with 10,000 agents, and then denied seeing the researchers' proof.

[![Screenshot of Nik's original X post alleging that OpenAI used private Codex research to complete the proof](/assets/x-post-nik.png)](https://x.com/ns123abc/status/2097423705240428932?s=20)

[![Screenshot attached to the X post showing Sam Altman's response](/assets/x-post-sam-altman.png)](https://x.com/ns123abc/status/2097423705240428932/photo/1)

[![Screenshot attached to the X post showing OpenAI's statement on data access](/assets/x-post-openai-statement.png)](https://x.com/ns123abc/status/2097423705240428932/photo/2)

### What the public statements establish

Sam Altman wrote: “It is true that we tried this because there were rumors on the internet.” OpenAI says the company began testing its internal system against the remaining Millennium Prize problems after hearing that NYU mathematician Tristan Buckmaster and Anthropic researcher Levent Alpöge might have made progress.

OpenAI states that neither its researchers nor its agents saw the outside work before public release and that no specific user data was accessed for the project. The same statement says the company cannot rule out that de-identified data derived from the researchers' product usage helped improve its models.

OpenAI reports that the successful branch used about 10,000 concurrent agents, 2.7 million messages, and roughly 130 billion output tokens. It released a written proof and a Lean formalization. The X post alleges targeted access to private work; OpenAI denies targeted access. Altman and OpenAI confirm that the company's effort began after rumors of the outside research.

### The custody question

The model provider holds the model, product logs, training pipeline, and internal audit evidence. The researcher controls the material retained outside the service and the records the service allows them to export. The dispute cannot be independently reconstructed from the public artifacts alone.

## Creativity is becoming harder to defend

Ideas have always leaked through conversation, peer review, hiring, publication, and parallel discovery. Hosted AI changes the geometry of that risk. The notebook, collaborator, library, editor, and execution environment can now be one service. Every failed path can be as informative as the final answer, and all of it may pass through infrastructure controlled by a potential competitor.

This does not require an employee to open a transcript and copy a sentence. Aggregate training can absorb patterns across many interactions. Internal evaluation can reveal where users find unusual value. Product telemetry can identify emerging classes of problems. The appropriation risk becomes statistical and infrastructural, which makes intention difficult to prove and provenance difficult to audit.

OpenAI's consumer policy says content from individual services may be used to improve models unless the user opts out. Business products and the API are excluded from training by default. Those controls matter. They also mean that paying for a subscription is not, by itself, a research-confidentiality agreement.

## China solves the trust problem differently

China cannot assume that the rest of the world will trust its institutions, cloud services, censorship rules, or state influence. Its leading AI labs have responded with a strategically powerful move: distribute models that developers can download, inspect, adapt, and run under their own control.

DeepSeek and Alibaba's Qwen family do not require every user to send private work to a Chinese endpoint. Open-weight releases let a university, startup, government, or manufacturer keep inference and sensitive data inside its chosen boundary. The world does not have to trust the provider in the same way because possession moves closer to the user.

Leading U.S. labs have generally chosen the opposite bargain. Their strongest models remain behind APIs and subscriptions. Customers receive remarkable capability, but must trust policy, contract, and corporate governance because they cannot inspect the weights or reproduce the service independently.

```text
release weights → run locally → inspect + adapt → earn adoption
       ↑                                             │
       └──────────── ecosystem compounds ────────────┘
```

This is a major reason China is gaining ground in the AI race. Open models spread through universities, startups, devices, and national infrastructure. Every deployment produces ports, evaluations, optimizations, derivatives, and trained practitioners. The ecosystem compounds outside the original laboratory.

The caveat matters. Open weights are not automatically open source. The Open Source Initiative also asks for the code and detailed data information needed to study and modify a system. Chinese models can retain opaque training data, licensing limits, censorship behavior, and security risks. A downloadable model is not a guarantee of truth or freedom.

But it changes who holds the artifact. A closed U.S. model asks the world to trust the institution. An open Chinese model allows the world to verify more, host it elsewhere, remove the network connection, and walk away with a working system. For countries and companies wary of both superpowers, that difference is procurement, sovereignty, and leverage.

## The method is part of the discovery

Jos Stam's work lasted because he released more than an impressive animation. He explained the constraint, the compromise, the stable alternative, and the implementation. Other people could reproduce the effect, challenge the tradeoff, and improve the method.

OpenAI published a proof and Lean formalization, and it denies accessing the outside researchers' specific data. The X post alleges that private work was used. The public record does not provide the provider-held logs and model lineage needed to reconstruct that dispute independently. As creativity moves into closed systems, creators have less evidence with which to demonstrate custody.

A serious research tool should isolate work from training by default, pin model and tool versions, preserve a complete exportable history, record retrieved sources, make retention explicit, and produce tamper-evident lineage. Formal verification can show that a proof is internally valid. It cannot show where the creative direction originated.

> A result can be public while the power that produced it remains private. Science needs both the answer and a path others are allowed to walk.

## Try Smokey McFlame Face

A 64 x 64 fluid grid turns Stam's method into a bright nebula plume. It rises from a circular core, follows the pointer, and curls through a slowly moving field of stars.

<iframe src="/experiments/stable-fluids/smokey-mcflame-face/" title="Smokey McFlame Face interactive fluid simulation" loading="lazy"></iframe>

Pure JavaScript and canvas. Start the simulation, then move a mouse, pen, or finger through the field.

[Clay Millennium Prize Problems](https://www.claymath.org/millennium-problems/)

[The X post alleging theft](https://x.com/ns123abc/status/2097423705240428932?s=20)

[Sam Altman's response](https://x.com/sama/status/2097385167002415140)

[Jos Stam, Stable Fluids](https://www.josstam.com/_files/ugd/cf1fd6_898fe9b63df946689101b8d074f8efba.pdf)

[Jos Stam's publication notes](https://www.josstam.com/publications)

[OpenAI's Navier-Stokes account](https://openai.com/index/navier-stokes-solution/)

[OpenAI's Lean formalization](https://github.com/openai/NavierStokesAndEuler)

[OpenAI data-use policy](https://openai.com/policies/how-your-data-is-used-to-improve-model-performance/)

[DeepSeek-R1 release](https://api-docs.deepseek.com/news/news250120/)

[Qwen open resources](https://qwenlm.github.io/about/)

[Open Source AI Definition](https://opensource.org/ai/open-source-ai-definition)

[China's open-model strategy](https://www.uscc.gov/sites/default/files/2026-03/Two_Loops--How_Chinas_Open_AI_Strategy_Reinforces_Its_Industrial_Dominance.pdf)
