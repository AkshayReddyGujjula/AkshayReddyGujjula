---
title: How we made "mastered" actually mean something in Moneywell Town
description: Moneywell Town is a money game for teenagers that won the Work in Fintech AI Summit hackathon. A few small design rules ended up mattering more than anything flashy.
published: 2026-09-23
draft: false
---

Moneywell Town is a browser game that teaches UK teenagers about money: interest, tax, credit, scams and mortgages. You learn a topic by talking to someone in the town, then you head out of town where creatures quiz you on it. The four answer buttons are your four battle moves, so answering questions is how you fight. We built it as Team 17 for the Work in Fintech AI Summit hackathon on 28 August 2026, and we won first place, which I'm still pretty happy about.

We picked a game because of a survey. In the LFBF Young Persons' Money Index for 2025/26, 80% of 15 to 18 year olds said they want to learn more about money, only 9% said they actually learn it at school, and 34% said games or apps with competitions would help them most. The harder question for us was whether someone who learns this at 16 still remembers it at 19, when they're signing their first tenancy.

## Spaced repetition

Every answer goes into a Leitner system with five boxes. Questions come back after 1, 3, 7, 14 and 30 days depending on which box they're in. Spacing out practice like this helps people remember things for longer than cramming does, which was kind of the whole point.

We added two rules so the progress would be honest. If you get a question wrong, it only drops back one box instead of all the way to the start. Losing a month of progress for one mistake would feel really harsh to a 16 year old and they'd probably just stop playing. And if you get a question right, it only moves up if it was actually due. Without that, you could reach the top box in one evening by answering the same thing four times, and "mastered" wouldn't mean you'd remembered anything for a month.

The progress screens work everything out from the history of answers each time they're opened, so the numbers on screen always match what you actually did.

## You always get the explanation

Every question has an explanation attached, and the game shows it whether you get it right or wrong. If you get it wrong you lose some HP, but you still see why the answer was what it was. That was important to us because the wrong answers are where you actually learn something.

## Skipper, the puffin

If you press P, a phone opens with Skipper on it, a puffin wearing a captain's hat. He's the only part of the game that talks to an AI model. His instructions are built from all the lesson pages, so he knows what the town teaches. We deliberately didn't give him the quiz questions, so he can't just tell you the answer. He tells you which building teaches it instead, and there's a button that walks you there.

We were careful with safety because the players are teenagers. Card numbers, sort codes, email addresses and National Insurance numbers get removed before anything is sent. If someone types something that sounds like they're in crisis, it never goes to the model at all, and they get a message pointing them to Childline, Samaritans and StepChange.

## Making it run smoothly

The town is drawn by a custom 2D tile renderer written in React and TypeScript. At first the ambient animations were going through React's render cycle for all 792 tiles, which was slow. Moving those animations into CSS made tile updates 2.5 times faster, and after we sorted out how the camera, movement and input were scheduled, the frame rate went up by 53%.

## What's next

We're taking it to Web Summit Lisbon in November as an ALPHA startup, which is exciting and slightly terrifying. You can play it at [moneywelltown.com](https://moneywelltown.com).
