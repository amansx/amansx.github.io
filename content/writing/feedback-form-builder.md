---
title: "The Form Builder Before State-Driven UI Became the Default"
description: "A drag-and-drop, schema-driven form editor built from Handlebars, Way.js, jQuery, and a deliberately explicit data model."
date: 2016-03-09
category: "Archive / Interface systems"
read_time: "8 minute read"
thumbnail: "/assets/feedback-form-builder.png"
image: "../../assets/feedback-form-builder.png"
repository_url: "https://github.com/amansx/feedback-form-builder"
---

Before component trees and state stores became the default language of frontend work, I built a form editor around the same underlying idea: the interface should be a projection of structured data, and edits should flow back into that data without hand-wiring every field.

This was not a world without frameworks. AngularJS had already made two-way binding famous, and React was beginning to reshape how teams thought about UI. But those patterns were not yet universal muscle memory. For this project, I assembled the model explicitly from smaller pieces: Handlebars templates, Way.js bindings, jQuery events, and a data structure I controlled.

The result was a drag-and-drop builder that could create multi-page feedback forms, edit every control through a generated property panel, reorder or remove tools, and export the whole composition as nested JSON.

## Treat controls as data

The builder begins with a registry. Every available item is declared as a root, container, or control. The type determines where it may be dropped; the registry determines its caption, defaults, and whether it can contain another instance of itself.

```js
var TOOLS_REGISTRY = {
  page:       { type: TOOLTYPE_CONTAINER, caption: "page" },
  button:     { type: TOOLTYPE_CONTROL, caption: "button" },
  textbox:    { type: TOOLTYPE_CONTROL, caption: "text box" },
  calendar:   { type: TOOLTYPE_CONTROL, caption: "Calendar" },
  image:      { type: TOOLTYPE_CONTROL, caption: "image" },
  video:      { type: TOOLTYPE_CONTROL, caption: "youtube video" }
};
```

That registry drove the toolbox instead of requiring a separate block of interface code for every item. Adding a tool meant adding its declaration and Handlebars template, not rewriting the editor.

## A small document model

Each dropped tool receives a generated ID and a node record containing its type, data, parent, and child controls. Containers keep an ordered child list. The editor applies simple placement rules before it mutates either the DOM or the model: controls can only enter containers, unknown targets reject drops, and containers decide whether they can contain themselves.

The result is a small document model rather than a pile of detached elements.

`DataModel` owns that registry. It can register fields, return a live data reference for the property panel, remove a node and its descendants, and serialize the editor as a nested tree. The JSON export walks the visible hierarchy and joins it back to the model data by ID.

That separation mattered because the form being designed was not the editor DOM. The DOM was one representation of a portable schema.

## Binding without an application framework

The most interesting layer lives in the Handlebars helpers. An `updateable` helper emits a `way-data` path such as `TL2.label` and registers the same property in the model. A `control` helper inspects naming conventions such as `CHK_` for checkboxes and `TXA_` for textareas, then generates the right property editor input with the same binding path.

```js
retval += 'way-data="' + guid + '.' + name + '" ';
DataModel.registerUpdateableNode(guid, name, defaultVal);
```

Way.js then binds the preview, the property editor, and the model. Change the label in the right-hand panel and the control in the canvas updates. Select another tool and the property panel is generated from that node's available data. The behavior now feels ordinary; at the time, it was the core of the experiment.

## The editor as a compiler

The system had three useful phases:

1. **Declare** a vocabulary of pages and controls.
2. **Compose** a document through drag, drop, edit, move, and remove operations.
3. **Export** a nested JSON description that another renderer or service could consume.

That is closer to a small compiler than a conventional form. The palette is a language, the canvas is an authoring surface, and the JSON tree is the intermediate representation.

The builder included page containers, buttons, text and password fields, textareas, radio buttons, checkboxes, select and multi-select controls, calendars, links, images, labels, separators, and YouTube blocks. The implementation was intentionally open to custom tools because the schema and template system were already generic.

## Dating the artifact

The earliest verifiable public portfolio record is March 9, 2016, when Form Builder appeared in the original Anixir site alongside Square City. The standalone repository was later preserved as a separate project.

That distinction is worth preserving. The repository date records the migration, not necessarily the first day the tool existed.

## What I recognize in it now

Today I would reach for stronger types, immutable updates, accessible drag-and-drop, tests around serialization, and a clearer separation between editor state and rendered output. I would still keep the central design:

- one registry defines the tool vocabulary;
- one model owns the document;
- templates describe presentation;
- bindings connect editing controls to model paths;
- JSON is the durable output.

The libraries have changed. The architecture has not aged nearly as much.

[View the Feedback Form Builder repository](https://github.com/amansx/feedback-form-builder)
