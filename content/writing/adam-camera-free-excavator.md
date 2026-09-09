---
title: "Tracking an Excavator Without Cameras"
description: "How ADAM used GPS, UWB, 9-axis motion sensing, LoRa, embedded geospatial indexing, and a browser-based digital twin to understand heavy equipment in real time."
date: 2018
category: "Hardware / Industrial systems"
read_time: "9 minute read"
thumbnail: "/assets/thumb-adam-excavator.svg"
social_image: "/assets/thumb-adam-excavator.png"
---

<iframe src="https://www.youtube-nocookie.com/embed/nvwv5xzTZI0" title="ADAM prototype tracking a Doosan excavator in real time" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

In 2018, I built a hardware prototype that could watch an excavator without using a camera.

The word "watch" matters. ADAM did not simply place a GPS pin on a map. It built a live spatial model of a working machine: where it was on a construction site, how its body and arm were oriented, whether it appeared active, and how close tagged personnel were to it.

The field hardware ran on an ESP32. Its attached sensors included GPS, Ultra Wide Band ranging, and a 9-axis IMU. The ESP32 sent compact telemetry over LoRa to a BeagleBoard command module. A browser application built using React, Babylon.js and Three.js turned that state into a live 3D excavator. BuntDB provided the embedded geospatial index.

The project was called ADAM. It was developed for Doosan in collaboration with BCG Digital Ventures, and the venture subsequently secured $20 million in funding through BCGDV.

## Why not use cameras?

Construction sites are difficult places for vision systems. Dust clouds can obscure a lens. Lighting changes between open sun, shadow, and night work. Machines block one another, vibration shifts mounting positions, and every useful view creates another camera to clean, power, connect, and maintain.

A camera also gives you pixels before it gives you facts. Software still has to identify the machine, estimate its pose, recognize people, and infer distance. For this prototype, the useful questions were already known:

- Where is the excavator on the site?
- Which direction are its articulated parts moving?
- Is the machine active or idle?
- Is a tagged person entering a dangerous proximity zone?
- Is equipment operating while nobody is close enough to be its operator?

ADAM chose sensors that answered those questions directly. It did not replace every possible camera use. It demonstrated that spatial awareness and operating context could survive conditions in which a clean line of sight could not be assumed.

## Four views of the same machine

No single sensor carried the system. Each one described the excavator at a different scale.

### GPS: where it is on the site

GPS supplied the broad outdoor position. That was enough to place the machine on a geospatial map, associate it with a work zone, and follow movement across the site.

GPS is useful at site scale, but it is not the right instrument for measuring the last few meters between a person and a bucket. Satellite fixes can drift, structures can block the sky, and global coordinates say little about local articulation. ADAM used GPS as the large coordinate system, not the whole answer.

### Ultra Wide Band: who is near it

Ultra Wide Band, or UWB, supplied precise local ranging. A tag on the machine and tags carried by personnel could estimate their separation from radio time of flight. This gave the prototype a direct proximity signal without trying to identify a human shape in a dusty image.

That distinction made the safety model clearer. GPS answered "where on the site?" UWB answered "how far from this machine?" A person crossing a configured distance threshold could become an event, an alert, or an input to a risk calculation.

UWB still requires careful placement and calibration. Metal, obstruction, multipath, and tag position can affect a measurement. The prototype treated it as a ranging system whose quality had to be observed, not as a magic collision-avoidance guarantee.

### 9-axis IMU: how it is moving

A 9-axis inertial measurement system combines an accelerometer, gyroscope, and magnetometer. Together they produce orientation and motion estimates that are more useful than any one sensor alone.

Mapped onto the articulated parts of the 3D model, that telemetry turned roll, pitch, yaw, acceleration, and vibration into visible motion. The browser did not play a canned excavator animation. The digital excavator became a legible proxy for the physical machine.

Motion and vibration also helped distinguish quiet equipment from equipment that appeared operational. Combined with UWB presence, the system could surface a particularly wasteful state: machinery showing activity while no tagged operator was nearby.

### LoRa: how the site speaks

The prototype did not need to stream video. Its payloads were compact: identity, time, position, orientation, motion, range, and status. LoRa was a good fit for carrying that kind of low-bandwidth telemetry over a wide industrial area while keeping sensor nodes power-conscious.

The radio layer turned isolated instruments into a site-level system. Devices could report through a gateway rather than depending on high-bandwidth connectivity at every machine.

## The hardware split

The ESP32 was the field node attached to the machine. GPS, UWB, and the 9-axis IMU met there, close to the physical signals they measured. It timestamped and packaged those readings for the LoRa link.

The BeagleBoard was the command module. It received site telemetry and gave the application an edge computer on which to normalize device messages, maintain useful state, and serve the operational view. This separation kept sensing close to the machine while giving coordination and storage a more capable local home.

## From radio packets to a digital twin

The interesting work began after a packet arrived. Raw sensor values are not a product. They have different coordinate systems, update rates, noise profiles, and failure modes.

The pipeline normalized device identity and timestamps, transformed geographic and local coordinates, smoothed motion, and connected each reading to the correct asset. BuntDB kept the live state close to the application and supplied spatial indexing through an R-tree. That made questions such as "what is inside this zone?" and "what is nearest to this asset?" natural operations rather than full scans.

React organized the operational interface. Babylon.js and Three.js handled the browser's spatial presentation: the site, the machine model, and the articulated transforms. The 3D view was not decoration. It compressed a stream of orientation values into something an operator could understand immediately.

```text
GPS + UWB + 9-axis IMU
          |
        ESP32
          |
        LoRa
          |
BeagleBoard command module
          |
BuntDB + React + Babylon.js / Three.js
          |
live pose + proximity + utilization
```

## State was more valuable than telemetry

A useful industrial interface should not force someone to interpret six graphs before deciding whether a situation matters. ADAM translated streams into states.

The state model could combine machine activity with nearby personnel:

```text
quiet machine + no nearby tag       -> parked
active machine + operator nearby    -> operating
active machine + person too close   -> proximity risk
active machine + no operator nearby -> possible idle waste
```

These are operational interpretations, not universal truths. A production system needs calibrated thresholds, tag-health checks, role awareness, uncertainty, and site-specific safety policy. But even the prototype showed why combining sensors is more powerful than displaying them independently.

For safety, the critical output was distance with context. A person five meters from a parked excavator is different from a person five meters from a moving boom. For utilization, the critical output was activity with presence. A machine consuming energy without useful work or an operator nearby is a cost that can be observed and reduced.

## The wider ADAM venture

The tracking prototype sat inside a larger industrial thesis. ADAM was structured as an incubation partnership between Doosan and BCG Digital Ventures, not as a one-off visualization.

The broader opportunity included predictive maintenance from high-frequency equipment data, digital-twin frameworks for plants and heavy assets, and a scalable software business that could serve Doosan before expanding to other industrial customers.

This early build made that ambition tangible. It joined a physical machine, custom sensor hardware, long-range telemetry, local spatial storage, and a browser twin into one working path. ADAM subsequently secured $20 million in venture funding through BCGDV.

Funding did not turn a prototype into a finished industrial safety system. It showed that the prototype had completed one of its most important jobs: reduce a large venture idea to a system people could see, test, challenge, and choose to back.

## What the video preserves

The two-minute recording is simple and unusually useful. A real Doosan excavator occupies the upper half of the frame. A laptop in the foreground shows the ADAM interface and a blue 3D excavator over a map. As the physical machine changes pose, the browser model follows.

There is no polished launch film and no attempt to hide the wiring. The value is the correspondence between the two objects: steel outside, state inside the browser.

That is what a good digital twin should do. It should not merely resemble a machine. It should let the machine explain itself.

## What stayed with me

ADAM taught me to begin with the failure environment. Dust and occlusion made cameras unreliable, so the architecture used multiple forms of radio and inertial sensing. Global position, local range, and orientation were separate truths that became more useful when joined.

It also reinforced an idea that appears throughout distributed systems: real-time does not mean sending everything. It means preserving the right state quickly enough to change a decision. A small packet about pose, position, and proximity can be more valuable than a high-resolution stream nobody can interpret in time.

Most of all, the project showed how hardware becomes understandable through software. The 3D excavator was an interface to a distributed physical system. It made coordinate transforms, radio packets, and sensor fusion visible as motion, distance, risk, and use.

[Watch the ADAM prototype](https://www.youtube.com/watch?v=nvwv5xzTZI0)

[Doosan on its 2018 digital transformation](https://www.doosan.com/en/media-center/press-release_view?id=20171096&page=18&param2=construction)

[Qorvo DWM1001 UWB module](https://www.qorvo.com/products/p/DWM1001C)

[Bosch 9-axis sensor fusion](https://www.bosch-sensortec.com/en/software-tools/software/sensor-fusion-software-bsx)

[Semtech on LoRa asset tracking](https://www.semtech.com/lora/applications/smart-supply-chain-logistics)

[BuntDB geospatial indexing](https://github.com/tidwall/buntdb)

[Babylon.js digital twins and IoT](https://www.babylonjs.com/digitalTwinIot/)
