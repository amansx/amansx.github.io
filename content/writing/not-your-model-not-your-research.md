---
title: "Did AI Steal the Proof?"
description: "The accusation, Sam Altman's confirmation of the trigger, and the research-custody problem behind closed AI."
date: 2026-09-09
category: "Systems / Research infrastructure"
read_time: "11 minute read"
thumbnail: "/assets/thumb-not-your-model.svg"
social_image: "/assets/thumb-not-your-model.png"
---

The post says AI stole the proof. Sam Altman says the plagiarism accusation is unfounded. But his response confirms the event that makes the accusation resonate: OpenAI heard that a rival's model may have helped solve a Millennium Prize problem, then aimed its own private system at the same territory.

## The accusation, and what Altman confirms

The viral X post presents a complete theft narrative. A mathematics professor used Codex. OpenAI searched his private sessions, found the promising work, and unleashed 10,000 agents to finish it. The public evidence does not establish that OpenAI searched those sessions or copied the proof. That part remains an allegation.

Altman does, however, confirm the trigger. “It is true that we tried this because there were rumors on the internet,” he wrote. OpenAI's own account says the effort began on September 1 after rumors of progress by NYU mathematician Tristan Buckmaster and Anthropic researcher Levent Alpöge. The lab then tested its internal model on the open Millennium Prize problems and concentrated resources on Navier–Stokes.

Altman says the two approaches appear different now that both are visible. OpenAI says no specific user data was accessed. The company also says it cannot rule out that de-identified data derived from product usage helped improve its models. So the post and Altman do not agree that a proof was stolen. They agree on the sequence at the center of the suspicion: a rumor about researchers using frontier AI reached the model provider, and the provider used vastly greater private compute to pursue nearby work.

This distinction matters. There is no demonstrated chain from a private session to OpenAI's proof. There is a demonstrated structural conflict. The same company can sell the workbench, improve the model from some consumer usage, hear that valuable work may be happening, and become the best-funded competitor in the same research race.

A researcher can pay for the tool, use it as an intellectual workbench, and still lack a simple, independently verifiable account of whether that work influenced the capability competing beside them. That is the trust problem even if the plagiarism claim is never proven.

## Before fluids were interactive

Navier–Stokes describes fluid motion through coupled fields for velocity and pressure. In computer graphics, the equations give smoke, fire, and water something better than decorative turbulence: motion that responds coherently to forces and obstacles.

Before Stam's *Stable Fluids*, interactive physical solvers had a punishing failure mode. Explicit numerical schemes could become unstable when a timestep was too large. A fast flow or fine grid forced smaller steps, which made real-time interaction expensive. Push the simulation too hard and its values exploded. The system had to restart with a smaller timestep.

Stam changed the product constraint. Instead of asking for engineering-grade physical accuracy, he optimized for believable, controllable motion at interactive speed. Semi-Lagrangian advection traced each grid point backward through the velocity field. An implicit solve handled diffusion. A pressure projection returned the velocity field to a divergence-free state so the simulated fluid conserved mass.

```text
external force → advect → diffuse → project
                  ↑                    │
                  └──── next step ─────┘
```

Stam split one difficult update into understandable stages. Stability allowed larger timesteps; numerical dissipation was the deliberate cost of making the solver interactive.

The solver was unconditionally stable in the numerical sense: increasing the timestep would degrade the motion before it caused the simulation to blow up. It introduced numerical dissipation, so swirls faded faster than they would in reality. Stam documented the trade instead of hiding it. For animation, stability and control were worth more than strict physical fidelity.

The work nearly missed SIGGRAPH. It became Stam's most cited paper, enabled the first live interactive fluid demonstrations many attendees had seen, and later became roughly 100 lines of readable C for game developers. The paper explained the equations, the algorithm, the compromises, and the implementation path. A reader could take the work home.

> The durable artifact was not merely a fluid animation. It was a method another person could own.

## Now the method is infrastructure

OpenAI's 2026 result addresses a different question. It is not a faster smoke solver and does not replace computational fluid dynamics. The Millennium Prize problem asks whether smooth three-dimensional Navier–Stokes motion must remain smooth, or whether the equations can develop a singularity in finite time. OpenAI says its system constructed a forced flow that develops such a singularity and released both a written proof and a Lean formalization.

The production system is as consequential as the mathematics. OpenAI reports that about 10,000 concurrent agents worked on the successful branch of the effort. The Navier–Stokes run generated 2.7 million agent messages and roughly 130 billion output tokens. Agent groups explored different formulations, exchanged useful intermediate results, and were upgraded when a stronger internal model became available. Lean verification followed.

This is excellent systems design: parallel search, isolated work groups, selective information exchange, model hot-swapping, and a formal verification stage. It treats mathematical exploration as a distributed computation whose speculative branches can be searched at machine scale.

It is less satisfying as a model of academic research. The proof is public, but the decisive model is not. The orchestration is described, but the full experiment is not reproducible outside the company. We can inspect the final certificate without being able to rerun the intellectual factory that produced it.

## The boundary moved inside the tool

Social media taught users a crude bargain: if the service is free, your attention and behavior finance it. AI changes that bargain. The user may pay a subscription and still supply high-value interactions that improve an asset they neither own nor can inspect.

OpenAI's consumer policy says content from individual services, including ChatGPT and Codex, may be used to train models unless the user opts out. Business products and the API are excluded from training by default. Those are meaningful controls, and the distinction matters. It also means that payment alone does not establish research confidentiality. The product tier, settings, feedback actions, and contract determine the boundary.

For routine engineering, that may be acceptable. A closed model can be an extraordinary accelerator for architecture reviews, code generation, migrations, incident analysis, and design exploration. The organization can validate the output against tests, production behavior, and its own source of truth.

Unpublished academic work has a different threat model. Novelty and priority are part of the asset. A useful exchange with a model can reveal the problem, the failed approaches, the promising lemma, and the direction that finally moved. Removing a name from that trace does not remove its intellectual value.

```text
researcher-owned work
question · notebook · failed paths · promising result
                         │
                         ▼
service boundary
terms · data controls · retention · training policy
                         │
                         ▼
provider-owned capability
model · weights · training pipeline · capability gain
```

Anonymity is not provenance. Research custody requires an auditable account of collection, retention, training, model versions, and downstream use.

“Not your model, not your data” is therefore more than a slogan. If you cannot run the model, inspect its version, export the complete interaction history, or audit the training boundary, then your research process depends on institutional assurances. That may be a valid choice, but it is not the same as custody.

## China is winning the distribution race

Saying China is “winning AI” is too broad. The United States still leads in frontier training compute and its closed models remain slightly ahead on many measures. China's strategic advantage is different: its strongest labs have treated model availability as a distribution mechanism.

DeepSeek released R1 weights under the MIT license. Alibaba's Qwen family and a wider Chinese model ecosystem gave developers downloadable systems they could run locally, fine-tune, quantize, fork, and embed without routing every experiment through a foreign API. Research covering 2.2 billion Hugging Face downloads found a sharp decline in the open-model dominance of U.S. companies and a rise in Chinese industry, especially DeepSeek and Qwen.

That openness creates a compounding loop.

```text
release weights → run locally → adapt → diffuse
       ↑                              │
       └──── ecosystem compounds ─────┘
```

More access produces more deployments. More deployments create ports, optimizations, distillations, evaluations, and trained practitioners. Those improvements lower the cost of the next deployment. Compute scarcity can become pressure for efficiency rather than a permanent excuse for exclusion.

Open weights are not automatically open source. The Open Source Initiative's definition also requires the code and detailed data information needed to study and modify the system. Training-data transparency has declined even as open-weight adoption has grown. Chinese systems also carry governance, censorship, security, and provenance risks of their own. Openness makes those systems more inspectable and adaptable; it does not make them neutral.

Still, the strategic contrast is sharp. A closed laboratory accumulates capability inside one balance sheet. An open-weight ecosystem distributes capability into universities, startups, factories, devices, and other laboratories. The first can lead a benchmark. The second can become the substrate on which a generation learns to build.

## A scientific tool needs a scientific contract

AI for research should provide more than a privacy toggle. A credible research mode would isolate work from training by default, preserve an exportable and tamper-evident history, pin exact model and tool versions, record retrieved sources, expose transformation lineage, and make retention rules explicit. Formal verification can validate a proof's internal logic; provenance must validate how the proof entered the world.

Where the model itself cannot be released, the surrounding process should become more inspectable. Where the question is exceptionally sensitive, researchers should use enterprise or API agreements that exclude training, or run open-weight models inside infrastructure they control. The right choice depends on the cost of disclosure, not the convenience of the chat window.

Jos Stam's work endured because its value escaped the machine on which it was created. He published enough for other people to understand the trick, reproduce the effect, identify the loss of accuracy, and improve the method. That is how research becomes a field rather than a feature.

> A result can be public while the power that produced it remains private. Science needs both the answer and a path others are allowed to walk.

[The post alleging theft](https://x.com/ns123abc/status/2097423705240428932?s=20)

[Sam Altman's response](https://x.com/sama/status/2097385167002415140)

[Jos Stam, Stable Fluids](https://www.josstam.com/_files/ugd/cf1fd6_898fe9b63df946689101b8d074f8efba.pdf)

[Jos Stam's publication notes](https://www.josstam.com/publications)

[OpenAI's Navier–Stokes announcement](https://openai.com/index/navier-stokes-solution/)

[Lean formalization](https://github.com/openai/NavierStokesAndEuler)

[OpenAI data-use policy](https://openai.com/policies/how-your-data-is-used-to-improve-model-performance/)

[Open Source AI Definition](https://opensource.org/ai/open-source-ai-definition)

[Economies of Open Intelligence](https://arxiv.org/abs/2512.03073)

[China's open-model strategy](https://www.uscc.gov/sites/default/files/2026-03/Two_Loops--How_Chinas_Open_AI_Strategy_Reinforces_Its_Industrial_Dominance.pdf)
