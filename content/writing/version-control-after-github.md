---
title: "Git Is Distributed. Our Workflows Aren't."
description: "What a GitHub outage, agentic development, and Dolt reveal about the next boundary of version control."
date: 2026-08-17
category: "Systems / Developer infrastructure"
read_time: "9 minute read"
---

The strange thing about a GitHub outage is that Git usually keeps working.

On the morning of August 17, GitHub reported an unresolved incident with roughly a 20% error rate across several experiences, including Pull Requests and Issues. At the time I began writing, the status page showed Git Operations as operational, Issues as degraded, and Copilot in a major outage.

That distinction is the entire story. My local repository still had its history. I could branch, edit, inspect a diff, and commit. What had stalled was the shared machinery that decides how those commits become organizational fact.

## Git survived. The workflow did not.

Git is a distributed version-control system. A clone mirrors the repository and its history, so a remote disappearing does not erase the local ability to create versioned work. Git was designed to avoid making the central server the only holder of truth.

But the industry built a new center around that distributed core. Pull requests became the review protocol. Issues became planning memory. Actions became execution. Branch protection became policy. Webhooks and APIs became connective tissue. Increasingly, coding agents use those same surfaces as their queue, memory, and control plane.

> We distributed the commits, then centralized almost every decision made about them.

```text
Distributed data plane              Central coordination plane

clone A ─┐                          pull requests · issues
clone B ─┼── push / fetch ───────▶  actions · APIs · webhooks
clone C ─┘                          identity · policy · agents

local commits continue              collaboration can stall
```

A repository host is no longer just a remote. It is an operating system for software organizations. That makes an outage more revealing than “the website is down.” It exposes which parts of engineering can still move without the coordination service.

## Tools changed the unit of load

The Reddit thread around the incident quickly blamed AI-generated activity. That is a plausible hypothesis, not a root-cause analysis. GitHub had not published the cause of this incident when this note was written.

GitHub has, however, publicly described the broader workload shift. In April 2026 it said agentic development had accelerated sharply since late December 2025, with repository creation, pull-request activity, API use, automation, and large-repository workloads all growing quickly. The company had moved from planning for 10× capacity to designing for 30× the previous scale.

```text
human + agent + automation
            │
            ▼
          change
            │
            ├── git storage
            ├── mergeability and policy
            ├── search and notifications
            ├── actions and background jobs
            └── APIs and webhooks
                    │
                    └── pressure → retries → more pressure
```

A person may open a handful of pull requests in a day. A tool can create branches, commits, comments, checks, updates, and retries continuously. The commit is cheap; the fan-out is not.

Version control therefore has a new scaling question: how much speculative work must become globally visible before it is useful?

## Push the speculative loop back toward the edge

Git already gives source code a strong answer. Work locally. Record cheap snapshots. Explore on branches. Publish when collaboration is needed. Merge when the result deserves to become shared history.

Agentic tools should preserve that shape instead of turning every intermediate thought into a remote API call. Local branches can hold experiments. Local queues can absorb retries. Review artifacts can be assembled before publication. Remote coordination should receive fewer, more intentional state transitions.

This is not an argument to abandon GitHub. It is an argument to keep GitHub as a coordination boundary rather than treating it as the processor for every private step an automated tool takes.

## Dolt makes the boundary visible for data

Dolt comes to mind because it asks what happens when Git-style versioning applies to a SQL database instead of files. It stores data in a commit graph, exposes branches, diffs, merges, and history through both a Git-like CLI and SQL, and uses content-addressed Prolly trees whose roots participate in a Merkle DAG.

The interface is deliberately familiar: where Git uses `git checkout -b my-branch`, Dolt offers `dolt checkout -b my-branch`. In server mode, applications can also select branches and use procedures such as `DOLT_CHECKOUT()`.

```text
SQL transaction       data branch          Dolt commit          shared history
short + atomic   →   isolated work    →   versioned snapshot →  diff + merge

               speculative coordination stays off the main path
```

## Borrow the settlement pattern

Off-chain systems offer a useful design move: reserve globally coordinated settlement for state that genuinely needs to be shared. High-frequency, speculative activity can happen in a cheaper isolated context, then publish a smaller and more deliberate state transition.

For source code, the local Git branch is the execution context and the reviewed merge is settlement. For data, a Dolt branch can give an application, test run, or coding agent its own writable view. It can accumulate a coherent set of row and schema changes, expose the resulting diff through SQL, and merge the reviewed result into main. The branch becomes a coordination buffer.

This enables practical workflows. An agent can generate and validate data without polluting the shared database. CI can inspect proposed schema and row changes as one reviewable diff. A deployment can record the exact data commit it promotes. If an experiment fails, its branch remains inspectable or disposable instead of leaving partially coordinated changes on the shared path.

Dolt provides two useful layers for this model. SQL transactions preserve correctness within each short unit of work. Dolt commits record durable points in the longer lineage. Many fast transactions can happen inside one branch before the system asks people and services to coordinate on a merge. The gain is not merely transaction speed; it is less shared contention, fewer coordination round trips, and a better unit for review.

## Version control is becoming a systems primitive

The next generation of tools will version more than source files. Agent plans, test evidence, generated artifacts, schemas, datasets, and operational decisions all need history, isolation, comparison, and intentional publication.

The design lesson from this outage is not “self-host everything” or “replace GitHub with Dolt.” It is to identify the smallest durable unit that can remain local, the smallest shared unit worth publishing, and the services that must degrade without stopping both.

> Distributed storage is not enough. The workflow must have an offline shape.

Git gave us that shape for code decades ago. The pressure created by agentic tools may finally force the rest of the developer platform, and perhaps the data layer, to catch up.

[GitHub Status](https://www.githubstatus.com/)

[GitHub: An update on availability](https://github.blog/news-insights/company-news/an-update-on-github-availability/)

[The outage discussion on r/programming](https://www.reddit.com/r/programming/comments/1vqukkf/nothing_like_a_monday_morning_github_outage/)

[Git: Distributed Version Control Systems](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control.html)

[Dolt architecture](https://www.dolthub.com/docs/architecture/architecture/)

[Version control in Dolt](https://www.dolthub.com/docs/sql-reference/version-control/)
