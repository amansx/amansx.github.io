---
title: "Giving Solace a Go Voice"
description: "How a C++-to-Go binding made a proven event broker feel native to Go and helped introduce the language at BGC Partners."
date: 2020-06-05
category: "Systems / Open source"
read_time: "5 minute read"
repository_url: "https://github.com/amansx/solace-go"
---

Solace is the kind of infrastructure that becomes more interesting the closer you get to it.

At its center is an event broker: publishers send events without knowing who will consume them, subscribers describe what they care about, and the broker handles routing in between. Solace supports both topic-based publish/subscribe and queue-based point-to-point messaging. It can favor very high rates and very low latency with Direct messaging, or durability and acknowledgements with Guaranteed messaging.

That combination is especially compelling in financial systems. A price update and a workflow command do not necessarily need the same delivery contract, but they can still move across the same messaging backbone.

## The missing ergonomic layer

At BGC Partners, I wanted to bring Go into a technology stack that already depended on Solace. The broker was not the experiment. Go was.

The lowest-risk route was to preserve the mature native client and build an interface that made its capabilities natural to use from Go. That became `solace-go`, first committed on June 5, 2020.

The repository has four layers:

```text
Go application
    ↓ channels, structs, methods
Go / cgo binding
    ↓ C-compatible callback boundary
C++ wrapper
    ↓ native calls
Solace C client → PubSub+ event broker
```

The C++ wrapper links against Solace's C client. A small C boundary exposes stable functions and callback structures. cgo crosses that boundary, and the Go package turns native callbacks into typed events delivered through buffered channels.

## Making callbacks feel like Go

The native client reports messages, connection changes, errors, and publisher acknowledgements through callbacks. The binding maps each family into a Go type and channel:

- `MessageEvent` carries destination, payload, message ID, correlation ID, reply-to data, redelivery state, and user properties;
- `ConnectionEvent` reports up, down, reconnecting, and reconnected states;
- `PublisherEvent` reports acknowledgements and rejections;
- `ErrorEvent` preserves native return codes and broker responses.

The public API then lets applications register ordinary Go callbacks while goroutines drain those channels. A buffer of 5,000 events creates a deliberate pressure boundary between the native callback thread and application work.

This was not about hiding Solace. Direct and Guaranteed delivery, topic subscriptions, queue bindings, manual acknowledgements, correlation data, and binary payloads remain visible because those semantics matter. The wrapper removes language friction without erasing the messaging model.

## Adoption through a useful bridge

Introducing a language into a production stack is rarely won by a syntax comparison. It is won by making the new language useful beside the systems people already trust.

The driver gave Go applications access to the existing Solace backbone without asking the organization to replace that backbone. It also provided examples, Docker-based local setup, and builds for Linux, macOS, and Windows. The repository later received outside fixes and compression support, the healthy consequence of publishing a real internal need as open source.

At BGC, this work helped establish Go as a practical option for real-time services. The outcome recorded from the project was a 200% improvement in real-time message-delivery performance. More importantly, the driver lowered the cost of the next Go service: the messaging bridge already existed.

The lesson I kept is simple: a compatibility layer can be an organizational tool. Build the bridge to the infrastructure that already matters, and a new language stops looking like a rewrite.

[View solace-go on GitHub](https://github.com/amansx/solace-go)

[Read Solace's event messaging overview](https://docs.solace.com/Messaging/messaging-overview.htm)
