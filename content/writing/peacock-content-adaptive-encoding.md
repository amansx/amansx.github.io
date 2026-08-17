---
title: "Encoding Peacock at Library Scale"
description: "How a Go Kubernetes operator coordinated content-adaptive video encoding across CPU, GPU, and interruptible capacity without throwing away expensive progress."
date: 2025-05
category: "Systems / Media infrastructure"
read_time: "9 minute read"
thumbnail: "/assets/thumb-peacock-cae.svg"
---

The expensive way to encode a video library is to treat every second of every title as equally difficult.

A quiet dialogue scene, a burst of smoke, dense film grain, and fast action do not create the same compression problem. Give all of them the same bitrate and you either spend too much on simple frames or fail to preserve quality in the complex ones.

At NBCUniversal, I built a Go Kubernetes operator and controller layer for Peacock's Content Adaptive Encoding platform. The platform varied bitrate according to content complexity, evaluated perceived output quality with VMAF, and helped convert the Peacock content library to the new encoding format within months.

The media algorithm was only half the system. The other half was making long-running FFmpeg work distributable, observable, and recoverable across CPU, GPU, and interruptible AWS capacity.

## What content-adaptive encoding changes

Traditional fixed encoding ladders apply broadly chosen bitrate targets. Content-adaptive encoding asks a more useful question: what is the least data this particular material needs to retain the intended perceptual quality?

VMAF provided the quality signal. It compares an encoded result with its source and estimates how a viewer may perceive the difference. The system could use that feedback to avoid spending the same bitrate on a simple scene that a visually complex scene genuinely needed.

That matters twice. Smaller viable encodes reduce delivery bandwidth and storage or processing costs. They can also make more of a catalog playable on older or constrained devices. Instead of making an entire title consistently too heavy, the system can preserve a lower operating bitrate and accept that the most difficult moments may still stress the device.

```text
source media -> complexity-aware variants -> FFmpeg encode -> VMAF check -> adaptive output
```

## Make the encoding lifecycle declarative

The project needed more than a queue of shell commands. It needed a durable description of what should be encoded, which variant was intended, what work had completed, and what should happen after a worker disappeared.

I built the operator and custom controllers in Go using existing Kubernetes Go libraries. CRD families represented CAE encode variants and their media and encoding state. The reconcilers observed that state and moved the encoding lifecycle toward its declared outcome.

The boundary is important: this was not a custom scheduler, an aggregated API server, or a replacement for Kubernetes. It was a domain-specific control plane built with Kubernetes' extension model. The exact internal Kind and field names are intentionally not reproduced here.

## Split the expensive unit of work

A single monolithic encode is fragile on interruptible infrastructure. If an instance disappears near the end, the cheapest compute can become the most expensive choice because accumulated work vanishes with it.

The platform divided media into smaller FFmpeg chunks that could run concurrently across CPU- and GPU-based nodes. Taints and tolerations constrained specialized work to suitable capacity. The same machinery supported full-library migration runs and narrower task-based runs.

Chunking changed the failure unit. Completed chunks remained completed. When Spot capacity was reclaimed, controllers could identify and reassign unfinished work instead of restarting an entire long-running encode.

## Protect progress according to its value

Not all running work had the same replacement cost. An encode that had just begun was comparatively cheap to restart. One that was nearly complete represented substantial accumulated compute.

The controllers reconciled PodDisruptionBudgets from encode progress. Early-stage work could remain more available for voluntary movement; near-complete work received stronger protection from avoidable voluntary disruption.

A PodDisruptionBudget is not a shield against an involuntary Spot termination. The recovery mechanism for that failure was chunk-level state and reassignment. The progress-aware budget and the recoverable work model solved different halves of the reliability problem.

```text
voluntary disruption -> progress-aware budget -> avoid needless loss near completion
Spot interruption    -> persisted chunk state  -> requeue only unfinished work
```

## Keep multiple reconcilers from doing the same thing

Controllers are retry machines. That is useful until two reconcilers believe they both own the same expensive lifecycle transition.

The platform used Kubernetes Leases for leader election and work ownership. A database-backed lock guarded lifecycle decisions that also needed application-level idempotency. Together, they provided two related guarantees: one active coordinator for a responsibility, and safe repeated decisions when retries or failover occurred.

This distinction matters. A Lease answers “who may act now?” The database-backed guard answers “has this transition already been committed?” A distributed media pipeline needs both questions answered clearly.

## The result

The platform helped move the Peacock library to Content Adaptive Encoding within months. Content-aware bitrate selection substantially reduced delivery bandwidth, while Spot execution reduced encoding infrastructure cost. Lower viable bitrates also made more content workable on older devices.

There are no public asset counts, exact savings percentages, concurrency figures, or internal resource names attached to this account. The engineering result does not need invented precision: a domain-specific Kubernetes control plane coordinated a library-scale migration while balancing quality, cost, placement, and the value of work already completed.

The durable lesson was not “run FFmpeg on Kubernetes.” It was to model progress as a first-class system property. Once the controller knew what had finished, what it was worth, and where it could run, cheap compute became useful without making interruption catastrophic.

[VMAF project](https://github.com/Netflix/vmaf/)

[Kubernetes disruption budgets](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)

[Kubernetes Leases](https://kubernetes.io/docs/concepts/architecture/leases/)

[Amazon EC2 Spot interruptions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html)
