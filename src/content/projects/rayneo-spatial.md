---
title: RayNeo Spatial
tagline: A head-tracked Windows desktop for RayNeo GT glasses. An optional magnetic heading lock reduces drift in its floating monitors.
order: 3
tier: flagship
search: "It is an augmented reality (AR) and 3D graphics project with 3DoF head tracking from the glasses' gyroscope, accelerometer and calibrated magnetometer, written in C++ for Windows."
period: 2026 – present
stack: [C++20, Direct3D 11, DXGI, HID, CMake]
links:
  - { label: Source on GitHub, href: "https://github.com/AkshayReddyGujjula/Rayneo-Spatial-App" }
facts:
  - { value: "3DoF", label: head tracking with optional magnetic heading lock }
  - { value: "1–8", label: screens in any layout }
  - { value: "10", label: CTest suites }
---

The glasses stream gyroscope, accelerometer and magnetometer readings over HID. I decode them, calibrate the sensor-to-head orientation and estimate pose with a fusion filter that adjusts gyro bias only while the head is at rest. A separate magnetometer calibration enables a slow heading lock: it corrects yaw drift against the local magnetic field and rejects sudden disturbances. Pitch and roll still come from inertial fusion. A Direct3D 11 renderer places each screen at its own yaw, pitch, roll and distance. The default is a three-screen arc at −45°, 0° and +45°.

The screens are real Windows desktops. Virtual monitors from the Parsec display driver are captured with DXGI Desktop Duplication, with a GDI fallback, so any app you drag onto them works. A native dashboard edits layouts, recentres the view, controls a soft reading hold, per-screen dimming and night tint, and shows device and engine diagnostics.
