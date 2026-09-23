---
title: Keeping a window still while your head moves
description: Notes from building RayNeo Spatial, which puts Windows monitors in the air around you on RayNeo GT glasses, and the bugs that made it much harder than I thought.
published: 2026-09-23
draft: false
---

RayNeo Spatial is a Windows app for RayNeo GT glasses. It puts your Windows monitors in the air around you, three of them in a curve by default, and they're meant to stay in the same place when you turn your head. The glasses have a sensor (an IMU) that reports which way your head is pointing, and a Direct3D 11 renderer draws each screen in the right spot.

I assumed the hard part would be the rendering. It was actually getting the screens to stay still.

## Two coordinate systems

The sensor gives its rotation as a quaternion in a right-handed system with Z pointing up. Direct3D uses a left-handed system with Y pointing up. If you get even one sign wrong, the whole world can end up mirrored or rotated by up to 180 degrees. I ended up doing the conversion in exactly one place, in the camera code, with tests around it, and there are no "flip this axis" settings anywhere in the app.

Recentering caused a sneakier version of the same problem. My first attempt worked out the rotation relative to your head's own axes, which is fine if you're looking straight ahead. But if you recentered with your head tilted, it mixed some of your left-right turning into up-down and roll. When I tested it wearing the glasses, I was losing up to 16 degrees of turning and getting 26 to 34 degrees of tilt that wasn't really there. Working it out relative to the world instead fixed it. I also replaced my guess about how the sensor is mounted in the glasses with a proper calibration step that measures it.

## The workspace that slowly rotated

Gyroscopes drift over time, so you have to estimate how much they're off (the bias) while your head is still, and subtract it. I had two separate bits of code trying to fix that drift, one adjusting the bias and one correcting the final pose.

They ended up fighting each other. Over about ten minutes the whole workspace would slowly rotate until the left screen was nearly in front of me. It was really hard to spot because every single frame looked fine. The fix was to let only the bias estimate deal with drift, and switch the other correction off by default.

## Small head movements

An earlier version froze the pose completely whenever it thought you were still. That meant small head movements got ignored, and then suddenly jumped once you moved past a threshold, which felt awful. Now the pose always updates, and being still only affects when the bias is allowed to adjust. There's a test that checks at least 90% of small half-degree, one-degree and two-degree movements actually come through, with no single step bigger than 0.05 degrees.

## A quaternion gotcha

One function scales a rotation by some fraction, like "turn 30% of the way". Quaternions have a trap here: `q` and `-q` are the same rotation. If you don't check which one you've got first, the angle can come out as 360 minus what it should be. That function, including my comment about the bug, is the code on the left screen in the demo on my home page.

## Testing without wearing the glasses

There are nine test suites covering the camera maths, how the pose behaves, fake head-movement scenarios, calibration, decoding the sensor data, the screen layout, the virtual display logic, projection and the controller. Every bug above has a test scenario that failed before the fix and passes after. You still need the glasses to check how it feels, but I don't have to put them on to know the maths is right.

The [code is on GitHub](https://github.com/AkshayReddyGujjula/Rayneo-Spatial-App). It's my own project and isn't affiliated with RayNeo.
