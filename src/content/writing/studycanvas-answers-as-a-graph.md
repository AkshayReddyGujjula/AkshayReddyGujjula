---
title: Why StudyCanvas streams answers into a graph
description: Chat collapses learning into one column. Keeping the source, the questions and the answers on one canvas changed how I built streaming, grounding and storage.
published: 2026-09-23
draft: true
---

I started StudyCanvas because revising with an AI chat kept losing things. A useful answer might come from one line of a lecture PDF, lead to three follow-up questions, become a flashcard, and turn up again a month later as a mock-exam topic. In a chat transcript all of that collapses into one scrolling column, and the line of the PDF it came from is gone.

So StudyCanvas puts everything on one infinite canvas. You highlight a passage in a PDF, ask about it, and the answer arrives as a node linked back to that passage. You can branch it, quiz yourself on it, or turn it into cards. That one idea, answers as nodes rather than messages, ended up deciding most of the engineering.

## Streaming into a node

A chat app appends tokens to the bottom of a transcript. StudyCanvas has to update one node in the middle of a graph while the student keeps working elsewhere on the canvas.

Each answer is a live node, and incoming chunks update it in place. The stream is a plain fetch response with small control frames mixed into the text, so one answer can also create sibling nodes as it goes: a quiz, a set of flashcards, a source reference. I chose that over WebSockets because it runs through the same serverless HTTP path as everything else.

The part that took longest to get right was stopping. Every request in flight owns an `AbortController`. Close the node, or navigate away, and the request is cancelled, and whatever had already arrived is settled into something readable instead of a half-sentence stuck in a loading state. It sounds small, but with a dozen nodes streaming at once it's the difference between a canvas that feels solid and one that feels haunted.

## Grounding you can see

The obvious move for "ask questions about a document" is retrieval: chunk the PDF, embed it, search a vector index. I didn't, on purpose.

A question in StudyCanvas is built from a few bounded, labelled pieces: the exact text you selected, the text around it on the page, the answer you branched from, recent history, and anything you explicitly mention. For one document in one study session that's usually better context than a similarity search, and, more importantly, the student can see exactly what the model was given. The cost is that StudyCanvas isn't built for searching across a large library of documents. I'd make that trade again for this product.

## Local-first, because it's your notes

Workspaces live on the student's device. In Chromium on a desktop, a workspace can be a real folder you choose, through the File System Access API. Everywhere else the same workspace lives in IndexedDB. Both hold the canvas, the source PDFs, audio, version history and exam sessions, and a ZIP export works as an escape hatch from either.

That keeps the privacy surface small and the hosting bill low, and it means the API can stay stateless. It validates a request, assembles only the context that action needs, calls the right model tier and streams the result back. There's no document library on a server anywhere.

## Constraints as inputs

StudyCanvas runs on Vercel, which means hard limits on request size, run time and bundle size. I stopped treating those as obstacles and started designing around them. Large PDFs fall back to extraction in the browser with PDF.js. Python in a code node runs locally through Pyodide, so the server never executes a student's code. Paid model calls go through durable quotas with per-user caps and a project-wide ceiling, because per-instance counters reset on every cold start.

## Where it is now

It's live at [studycanvas.app](https://studycanvas.app), and ten students use it every week, including the students I tutor. The [engineering record](https://github.com/AkshayReddyGujjula/StudyCanvas-Public) covers the architecture, the decisions and the things that went wrong in much more detail, including the limits: no real-time collaboration yet, and AI answers can still be wrong. Grounding makes them easier to check. It doesn't make them correct.
