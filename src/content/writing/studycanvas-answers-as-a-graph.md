---
title: Why StudyCanvas puts answers on a canvas
description: I got fed up revising with AI chat, so I built a study app where every answer stays attached to the bit of the PDF it came from. Here's how that idea shaped the code.
published: 2026-09-23
draft: false
---

StudyCanvas started because revising with ChatGPT kept annoying me. I'd highlight something confusing in a lecture PDF, paste it into a chat, get a decent explanation, ask a follow-up, ask another one, and twenty messages later I'd have no idea which answer came from which line of the notes. Scrolling back up through a chat to find "that one explanation about half-open intervals" is a terrible way to revise.

So the idea was pretty simple. Put the PDF on an infinite canvas, and when you ask about a highlighted passage, the answer shows up as a card linked to that exact passage. You can ask a follow-up from any card, and it branches off. You can turn a card into flashcards or a quiz. Everything stays where you put it.

It turned out that one decision (answers are cards on a graph) ended up driving most of the engineering.

## Streaming into the middle of a graph

In a chat app, new text always goes at the bottom. In StudyCanvas the answer is streaming into one card somewhere on the canvas while you might be dragging another card around or reading the PDF. So each answer is a live node that updates in place as chunks arrive.

I used a normal fetch stream for this, with some small control messages mixed into the text. That lets one answer also create extra cards as it goes, like a quiz or a set of flashcards. I went with this over WebSockets mainly because it works through the same serverless setup as the rest of the API, so I didn't need a second kind of server.

Cancelling was the fiddly part. Every request has its own `AbortController`, so if you close a card or leave the page, the request actually stops. Whatever text had already arrived gets tidied up so you don't end up with a card stuck halfway through a sentence with a spinner on it forever. With ten cards streaming at once this mattered a lot more than I expected.

## Why I didn't use a vector database

The standard way to do "chat with your PDF" is to chunk the document, embed it and search a vector index. I thought about it and decided not to.

When you ask a question in StudyCanvas, the model gets a few specific things: the text you highlighted, the text around it on the page, the card you branched from, some recent history, and anything you mention by name. For one document in one revision session that's usually better context than whatever a similarity search would pull out. It also means you can see exactly what the model was given, which makes it easier to tell when an answer has gone off track. The downside is that it's not built for searching across a whole library of PDFs, and I'm fine with that for now.

## Keeping your notes on your computer

Workspaces are stored on your own device. On a desktop Chromium browser you can point StudyCanvas at a real folder using the File System Access API. On other browsers it falls back to IndexedDB. Either way it saves the canvas, the PDFs, audio notes, version history and exam sessions, and you can export everything as a ZIP.

This kept things simple on the server side too. The API doesn't store any documents. It checks the request, builds the context for that one action, calls Gemini and streams the answer back.

## Working around Vercel's limits

The app runs on Vercel, which has limits on request size, how long a function can run and how big the bundle can be. Rather than fighting them I built around them. Big PDFs get their text extracted in the browser with PDF.js instead of being uploaded. Python in code cards runs in the browser with Pyodide, so my server never runs anyone's code. The paid AI features go through quotas stored in a database, because counters kept in memory reset every time a serverless function cold starts.

## Where it's at

It's live at [studycanvas.app](https://studycanvas.app) and about ten students use it every week, including the students I tutor, which is a pretty good way to find bugs. If you want the full story, including the stuff that went wrong, the [engineering record](https://github.com/AkshayReddyGujjula/StudyCanvas-Public) goes into a lot more detail. The answers can still be wrong sometimes, but because each one is linked to its source it's much easier to check.
