---
title: "CoupangBlueGreen: A Deployment API Teams Could Trust"
description: "How a Kubernetes controller joined application stacks and live Caddy routing into one recoverable rollout state machine."
date: 2026-01
category: "Systems / Deployment infrastructure"
read_time: "8 minute read"
thumbnail: "/assets/thumb-coupang-bluegreen.svg"
---

A deployment script can move an application forward. A deployment system has to know how to stop, recover, explain itself, and earn another team's trust.

At Coupang, I built **CoupangBlueGreen**, an internal Kubernetes controller for legacy HTTP applications in environments where Argo Rollouts and Istio were unavailable. It replaced application-specific pipeline logic with a CRD-driven deployment method that reconciled two complete application stacks, live traffic, rollback, retention, and cleanup.

The controller began as a technical solution. It became infrastructure when Coupang's Taiwan 3P engineering team, outside my Seattle team and reporting structure, made it a production dependency.

## A rolling update was not the required model

A Kubernetes Deployment can gradually replace an old ReplicaSet with a new one. The Taiwan applications needed a different contract: two independently addressable stacks had to exist at the same time.

One stack was active. One was a candidate. Traffic needed to move deliberately only after readiness, the previous version needed to remain available for rollback, and cleanup needed to happen after the rollout was accepted.

Without a shared controller, every application team had to rebuild that lifecycle in CI pipelines and deployment scripts, or operate without it.

## Give the lifecycle one declarative record

I created a CRD describing the application, active and candidate stacks, traffic state, retention, and cleanup policy. The controller created versioned Deployments and Services, waited for the candidate to become ready, shifted traffic, retained the previous stack, and removed it when the rollout reached its terminal state.

```text
declare candidate
      ↓
create versioned stack
      ↓
wait for readiness
      ↓
shift traffic -> promote -> retain previous -> clean up
      ↘ failure -> restore previous route
```

The CRD was intentionally narrow. A platform API succeeds when its users can understand the states without first becoming experts in the controller implementation.

## Kubernetes state was only half the rollout

The original ingress path used open-source NGINX. Open-source NGINX can apply generated configuration through graceful reloads, but native API-driven changes to live upstreams and traffic weights would have required NGINX Plus or additional custom machinery.

I moved this ingress path to Caddy. Its Admin API gave the controller a programmatic surface for updating live routing configuration, and individual Caddy configuration loads were atomic.

That did not make Kubernetes and Caddy one distributed transaction. A Deployment or Service update and a Caddy configuration update still happened through different systems. The controller's job was to observe both and repeatedly move them toward the same rollout state.

## Make partial failure converge somewhere safe

The most dangerous rollout state is not simply “failed.” It is disagreement: Kubernetes believes the candidate is active while the proxy still sends traffic to the previous stack, or traffic has moved while the candidate is no longer ready.

CoupangBlueGreen treated Kubernetes resources and Caddy routing as parts of one reconciliation state machine:

- if the candidate was not ready, the controller withheld traffic;
- if a rollout failed partway through, it restored the previous route;
- if the candidate became active, it retained the former stack for a predictable rollback window;
- after successful completion, cleanup removed the retired resources.

The system did not assume every multi-step operation would complete in one pass. It made every pass safe to repeat.

## Adoption was part of the engineering

The Taiwan 3P team had its own roadmap and operational requirements. They had not used Istio or Argo Rollouts in this environment. Handing them a powerful but opaque API would have recreated the same dependency on specialist knowledge.

The harder work was making rollout states legible, keeping the CRD and YAML supportable, and making rollback predictable enough for production trust. CoupangBlueGreen replaced per-application scripts with one deployment methodology the team could operate themselves.

Over time, it became part of how Taiwan 3P continued shipping legacy applications. The system was subsequently being rolled out in South Korean data centers that had not migrated to Istio. That later rollout was reuse of the platform beyond its original adopter; I do not claim to have led the South Korean expansion.

The project changed category when another organization depended on it. It was no longer just a controller I wrote. It was a deployment contract.

[Caddy Admin API](https://caddyserver.com/docs/api)

[Caddy architecture and atomic configuration](https://caddyserver.com/docs/architecture)

[Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
