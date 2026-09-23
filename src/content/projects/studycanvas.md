---
title: StudyCanvas
tagline: A spatial AI study workspace. Highlight a passage, ask about it, and the answer becomes a node you can branch, quiz yourself on or turn into flashcards.
order: 1
tier: flagship
search: "It also has Exam Room, which writes timed mock exam papers from your own notes and past papers, plus spaced-repetition flashcards, quizzes, voice notes and handwriting. It is an education and study tool for students."
origin: Started at HackLondon 2026
period: Jan 2026 – present
stack: [React, TypeScript, React Flow, FastAPI, Python, Gemini API, Pyodide]
links:
  - { label: Open studycanvas.app, href: "https://studycanvas.app" }
  - { label: Engineering record, href: "https://github.com/AkshayReddyGujjula/StudyCanvas-Public" }
facts:
  - { value: "10", label: students using it weekly }
  - { value: "21", label: canvas node types }
  - { value: "103k", label: lines of source }
  - { value: "398", label: commits since February }
cover: ../../assets/projects/studycanvas/learning-canvas.png
coverAlt: A StudyCanvas workspace with a PDF on the left and linked answer, quiz and code nodes spread across the canvas.
---

AI chat collapses learning into one scrolling column. A useful answer might come from one line of a PDF, lead to three follow-up questions, become a flashcard and later a mock-exam topic, and a transcript loses all of that structure. StudyCanvas keeps the source and the reasoning on the same infinite canvas.

A highlight sends Gemini the exact selection, its page context and the parent answer, and the response streams into a linked node. Every in-flight request owns an `AbortController`, so closing a node cancels the work and settles what has arrived into something readable. Python runs in the browser through Pyodide, so the server never executes a student's code. Workspaces are local-first: a real folder through the File System Access API, with IndexedDB where that isn't available.

Ten students use it every week, including the students I tutor.
