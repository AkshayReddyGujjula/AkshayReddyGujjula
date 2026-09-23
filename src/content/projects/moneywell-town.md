---
title: Moneywell Town
tagline: A browser game that teaches UK teenagers how money works, from interest and tax to credit and scams. Built in a week and won first place.
order: 2
tier: flagship
period: Aug 2026 – present
award: 1st place, Work in Fintech AI Summit hackathon
stack: [React, TypeScript, Vite, CSS]
links:
  - { label: Play at moneywelltown.com, href: "https://moneywelltown.com" }
  - { label: About the team, href: "https://github.com/MoneywellTown" }
facts:
  - { value: "2.5×", label: faster tile updates }
  - { value: "+53%", label: end-to-end frame rate }
  - { value: "144", label: illustrated lesson pages }
  - { value: "6,530", label: build-time checks }
cover: ../../assets/projects/moneywell-town/town.png
coverAlt: The Moneywell Town overworld in pixel art, with Northwell Bank, the fountain and the noticeboard.
---

You learn a topic from someone in town, then walk into the outskirts where creatures quiz you on it. The four answer buttons are the four move slots, so the quiz is the battle. Every question carries a required explanation, so the teaching moment appears whether you get it right or wrong.

Answers feed a five-box Leitner scheduler on 1, 3, 7, 14 and 30 day intervals. A wrong answer drops a question by one box, so a single slip never wipes out a month of progress. A correct answer only promotes a question that was actually due, so "mastered" has to be earned across weeks of reviews.

The town is a custom 2D tile renderer. Moving ambient updates across the 792-tile world out of React's render cycle and into CSS made tile updates 2.5 times faster, and end-to-end frame rate rose 53% once camera, movement and input scheduling were rebalanced.

We are taking it to Web Summit Lisbon in November as an ALPHA startup.
