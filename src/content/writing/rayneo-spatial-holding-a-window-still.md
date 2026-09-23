---
title: Holding a window still while your head moves
description: What it took to make Windows desktops stay put in space on RayNeo GT glasses, from coordinate frames to a bug that slowly rotated the whole workspace.
published: 2026-09-23
draft: true
---

RayNeo Spatial turns Windows into a spatial workspace on RayNeo GT glasses. Real Windows monitors float around you, three of them in an arc by default, and they stay where they are as you turn your head. The glasses report their orientation from an IMU; a Direct3D 11 renderer draws each screen where it belongs.

Making a window move is easy. Making it stay still is the hard part.

## Two worlds that disagree

The sensor's quaternion is right-handed with Z up. The Direct3D scene is left-handed with Y up. Get one sign wrong and the world is mirrored by up to 180 degrees, so there are no sign toggles anywhere in the app: the conversion is written once, in the camera, and tested.

Recentering had a subtler version of the same problem. I first built the relative rotation in the head's own frame, which mixes yaw into pitch and roll whenever you recenter with your head tilted. In the field that cost up to 16 degrees of lost pan and 26 to 34 degrees of tilt that wasn't there. Building it in the earth frame instead fixed it. How the sensor sits in the glasses comes from a measured calibration, not a guess about which axis is which.

## A bug that took ten minutes to see

Gyroscopes drift. The fix is to estimate the gyro's bias while your head is still and subtract it. I had two mechanisms doing that job: bias adaptation, and a separate drift correction on the published pose.

Both removed the same error, so they fought. Over about ten minutes the whole workspace slowly rotated until the left screen was almost in the middle. Nothing looked wrong in any single frame. The fix was to give steady error exactly one owner, the bias estimate, and turn the correction off by default.

## Small movements matter

An early version froze the pose whenever you were "still". Small head adjustments then disappeared, and arrived as a snap once they crossed a threshold. Now the pose path is always live, and being at rest only controls when the bias is allowed to adapt. A synthetic test checks that at least 90% of half-degree, one-degree and two-degree adjustments come through, with no step bigger than 0.05 degrees.

## Maths you can trust

One function scales a rotation by a fraction. Quaternions have a trap here: `q` and `-q` describe the same rotation, and if you don't normalise which hemisphere you're in, the angle comes out as 360 minus the real one. That's the snippet on the left display in the demo on my home page, comment and all.

## Tested without the glasses

Nine CTest suites cover the camera frames, pose behaviour, synthetic head-motion scenarios, calibration, protocol decoding, layout, the virtual display logic, projection and the controller. Every bug in the list above has a scenario that fails before the fix and passes after it. The worn-glasses feel still needs the hardware, but the maths doesn't.

The [source is on GitHub](https://github.com/AkshayReddyGujjula/Rayneo-Spatial-App). It's an independent project, not an official RayNeo product.
