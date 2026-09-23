---
title: Making "mastered" mean something in Moneywell Town
description: Moneywell Town won the Work in Fintech AI Summit hackathon. The design choices that mattered most were about honesty, from the review scheduler to a puffin that won't give you the answer.
published: 2026-09-23
draft: true
---

Moneywell Town is a browser game that teaches UK teenagers how money works. You learn a topic from someone in town, then walk into the outskirts where creatures quiz you on it. The four answer buttons are your four moves, so the quiz is the battle. We built it as Team 17 for the Work in Fintech AI Summit hackathon on 28 August 2026, and it won first place.

The format came from the research. In the LFBF Young Persons' Money Index for 2025/26, 80% of 15 to 18 year olds said they want to learn more about money, 9% said school is where they actually learn it, and 34% picked games or apps with competitions as the thing that would help. The harder question was whether something learned at 16 is still there at 19, when the tenancy deposit and the first payslip arrive.

## Spaced repetition that can't be gamed

Every answer feeds a five-box Leitner scheduler, with questions coming back after 1, 3, 7, 14 and 30 days. Spaced retrieval beats cramming for long-term retention, and that's the whole point of the game.

Two rules keep the progress honest. A wrong answer drops a question by one box instead of sending it back to the start, because losing a month of progress over one slip reads as punishment to a sixteen-year-old. And a correct answer only promotes a question that was actually due. Without that gate you could climb to the top box in one evening, and "mastered" would mean "answered four times tonight" instead of "remembered across a month".

Every progress screen is derived from the review log when it's shown, never stored, so no number on screen can disagree with the history behind it.

## The explanation always appears

Every question carries a required explanation field, so there's no way to skip it. Get it right and you see why. Get it wrong, lose some HP, and you still see why. The teaching moment is the same either way.

## A helper that won't do your homework

Press P and a phone opens on Skipper, a puffin in a captain's cap and the game's only network call. His instructions are built from every lesson page, so he knows what the town teaches. Quiz questions are left out on purpose: he never writes out an answer. He names the building that teaches it, and a button walks you to its door.

Card numbers, sort codes, email addresses and National Insurance numbers are stripped before anything is sent. Twenty-two crisis phrases never reach a model at all, and get a fixed signpost to Childline, Samaritans and StepChange instead.

## Keeping it smooth

The town is a custom 2D tile renderer written in React and TypeScript. Moving the ambient animation across the 792-tile world out of React's render cycle and into CSS made tile updates 2.5 times faster, and end-to-end frame rate rose 53% once camera, movement and input scheduling were rebalanced off the main thread.

## What's next

We're taking it to Web Summit Lisbon in November as an ALPHA startup. You can play it at [moneywelltown.com](https://moneywelltown.com).
