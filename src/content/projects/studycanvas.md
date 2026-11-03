---
title: StudyCanvas
tagline: A spatial AI study workspace. Highlight a passage, ask about it, and the answer becomes a node you can branch, quiz yourself on or turn into flashcards.
order: 1
tier: flagship
search: "It also has Blurt, where you close the book and say what you remember and it marks you against the lecture, confidence ratings from Lost to Perfect, and Exam Room, which writes timed mock exam papers from your past papers, plus spaced-repetition flashcards, quizzes, voice notes and handwriting. It is an education and study tool for students."
origin: Started at HackLondon 2026
period: Jan 2026 – present
stack: [React, TypeScript, React Flow, FastAPI, Python, Claude Haiku 5.5, Pyodide]
links:
  - { label: Open studycanvas.app, href: "https://studycanvas.app" }
  - { label: Engineering record, href: "https://github.com/AkshayReddyGujjula/StudyCanvas-Public" }
facts:
  - { value: "10", label: students using it weekly }
  - { value: "23", label: tools on one canvas }
  - { value: "228k", label: lines of source }
  - { value: "2,138", label: commits since February }
cover: ../../assets/projects/studycanvas/learning-canvas.png
coverAlt: A StudyCanvas workspace with a PDF in the middle and linked answer, summary, flashcard and quiz nodes around it, each rated with a confidence slider.
---

AI chat collapses learning into one scrolling column. A useful answer might come from one line of a PDF, lead to three follow-up questions, become a flashcard and later a mock-exam topic, and a transcript loses all of that structure. StudyCanvas keeps the source and the reasoning on the same infinite canvas.

A highlight sends Claude Haiku 5.5 the exact selection, its page context and the parent answer, and the response streams into a linked node. Gemini still handles voice, images, web search and scanned pages, and takes over for text if Claude is ever unavailable. Every in-flight request owns an `AbortController`, so closing a node cancels the work and settles what has arrived into something readable. Python runs in the browser through Pyodide, so the server never executes a student's code. Workspaces are local-first: a real folder through the File System Access API, with IndexedDB where that isn't available.

Every answer, quiz, flashcard and summary carries a confidence slider from Lost to Perfect, and the rating fades over time to decide what comes back first. Blurt tests recall with the book closed: you say what you remember, it maps your words onto the lecture's key ideas, and it marks what you missed.

Ten students use it every week, including the students I tutor.
