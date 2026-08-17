---
title: "Five Minutes in Paris"
date: 2015-11-08
category: "Archive / Product systems"
description: "Presenting OurUniversity at Capgemini’s Business Priority Week hackathon, and making workplace learning feel social, visible, and worth returning to."
read_time: "8 minute read"
thumbnail: "/assets/our-university-paris.jpg"
source: "https://www.youtube.com/watch?v=4pDdzNo8b6Y"
---

The screen behind me showed 4:39. I had five minutes to explain a system we had built in 36 hours, in a room near Paris, while a leaderboard waited behind the demo.

The video is titled “IGATE / Capgemini BPW Hackathon Presentation,” was published on November 8, 2015, and identifies the event as Business Priority Week that November. I was presenting **OurUniversity**, a prototype for making workplace learning social, measurable, and worth returning to.

## What Business Priority Week was

Business Priority Week was part of Capgemini University’s internal learning program at Les Fontaines, the company’s campus near Paris. Capgemini described the format as a blend of classroom learning and activities organized around strategic priorities, meant to create a shared language across teams. In 2015, the university reported 3.3 million learning hours for more than 161,000 participants.

The company’s 2015 annual report gives the hackathon more shape: designers and developers from six international teams, including an IGATE team, built application prototypes in 36 hours. The target was not a generic demo. It was the experience of people learning through Capgemini University.

The timing matters. Capgemini completed its acquisition of IGATE on July 1, 2015, adding roughly 30,000 colleagues. By November, this stage was also a small piece of integration in public: an IGATE team contributing to a Capgemini-wide learning event only months after the deal closed.

## The problem was isolation

The pitch opens with an observation that still holds: learning weakens when it happens alone. A course catalog can store material, but storage does not create curiosity, accountability, or a useful sense of progress.

OurUniversity started with identity. A learner registered, selected an avatar, and could remain pseudonymous while participating. That was a thoughtful tension for 2015. The system wanted social interaction without demanding a public profile as the price of entry.

From there, the demo moved through a working loop:

1. **Understand yourself.** Graphs compared the learner with their own earlier activity, turning course history into a visible trajectory.
2. **Find people.** A short identifier or QR code added a friend without requiring a broad directory search.
3. **Compare interests.** Peer views showed differences across areas such as machine learning and data mining.
4. **Choose and complete work.** The catalog exposed courses, ratings, usage, downloadable presentations, scores, and retakes.
5. **Create a reason to return.** Challenges and trophies connected learning outcomes to another person.

## The product model behind the demo

Under the interface were five related models: a pseudonymous identity, a course catalog, a progress record, a peer graph, and an incentive ledger. None was especially powerful alone. Their value came from the joins between them.

A completed course updated the progress record. Progress changed the graphs. Topic activity improved discovery. A peer challenge gave the next course social context. A high score produced a trophy that could be shared or contested. The demo’s memorable line was that it was both a game and learning, but the deeper idea was a closed feedback system.

> The prototype turned a training catalog into a small social economy of attention, evidence, and recognition.

## What the transcript reveals

The presentation uses “machine learned” casually while moving through topic recommendations and ratings. The recording does not establish a trained recommendation model, and it would be revisionist to claim one. What it clearly demonstrates is the product surface a ranking system would need: behavioral signals, course affinity, peer relationships, scores, recency, and repeated use.

The trophy mechanism is equally interesting. A learner could challenge a friend and risk losing a trophy if the friend scored higher. I joked on stage that this sounded like betting on education. The wording was loose, but the mechanism had a serious purpose: transform an inert badge into a stake that could produce another learning session.

Some choices have aged. A modern version would be more restrained with comparison, explain how recommendations are calculated, and give people strong controls over visibility. The durable pieces are privacy-aware identity, progress over time, social accountability, and a path from insight to action.

## Five minutes as a systems trace

The pitch moves in the same order a user would experience the product: register, choose an identity, inspect progress, connect with someone, discover a course, complete it, improve a score, and receive recognition. That order made a large prototype understandable before the timer expired.

Looking back, the work connects directly to how I think about distributed systems now. Independent actors need identity, discoverable state, coordination rules, observable progress, and feedback. In 2015 those actors were learners rather than services, but the design problem was already about making a network behave coherently.

The video keeps the moment intact: the Capgemini screen, the BPW leaderboard, the countdown, and a newly combined IGATE and Capgemini audience watching an idea move from isolated training to shared momentum.

## Sources

- [Presentation video](https://www.youtube.com/watch?v=4pDdzNo8b6Y)
- [Capgemini 2015 annual report](https://www.icono.tchirieff.fr/assets/2015_rapport_annuel.pdf)
- [Capgemini University and Business Priority Week](https://www.capgemini.com/co-es/careers/carreras-profesionales/universidad-de-capgemini/)
- [Completion of the IGATE acquisition](https://www.capgemini.com/ar-es/news/press-releases/capgemini-completa-la-adquisicion-de-igate-corporation/)
