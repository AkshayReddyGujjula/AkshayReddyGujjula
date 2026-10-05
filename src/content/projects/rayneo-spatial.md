---
title: RayNeo Spatial
tagline: A head-tracked Windows desktop for RayNeo GT glasses. An optional magnetic heading lock reduces drift in its floating monitors.
order: 3
tier: flagship
search: "It is an augmented reality (AR) and 3D graphics project with 3DoF head tracking from the glasses' gyroscope, accelerometer and calibrated magnetometer, written in C++ for Windows."
period: Sept 2026 – present
stack: [C++20, Direct3D 11, DXGI, Win32, HID, CMake]
links:
  - { label: Source on GitHub, href: "https://github.com/AkshayReddyGujjula/Rayneo-Spatial-App" }
facts:
  - { value: "~20°", label: thermal drift removed over a 22-minute worn session }
  - { value: "6×", label: less on-screen text jitter }
  - { value: "19", label: "synthetic test scenarios, plus recorded on-head sessions" }
  - { value: "1–8", label: screens in any layout }
---

The glasses stream gyroscope, accelerometer and magnetometer readings at 476 Hz over raw HID. I decode them, calibrate the sensor-to-head orientation and estimate pose with a Madgwick fusion filter, written from scratch, that adjusts gyro bias only while the head is at rest. A separate magnetometer calibration enables a slow heading lock: it corrects yaw drift against the local magnetic field and rejects sudden disturbances. Pitch and roll still come from inertial fusion. Together they remove about 20° of thermal drift over a 22-minute worn session and cut on-screen text jitter 6×. Every change to the filter is checked against recorded on-head sessions and 19 synthetic scenarios. A Direct3D 11 renderer places each screen at its own yaw, pitch, roll and distance. The default is a three-screen arc at −45°, 0° and +45°.

The screens are real Windows desktops. Virtual monitors from the Parsec display driver are captured with DXGI Desktop Duplication, with a GDI fallback, so any app you drag onto them works. A native dashboard edits layouts, recentres the view, controls a soft reading hold, per-screen dimming and night tint, and shows device and engine diagnostics.
