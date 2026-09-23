---
title: RayNeo Spatial
tagline: A head-tracked Windows desktop for RayNeo GT glasses. Real Windows monitors float around you and stay put as you turn your head.
order: 3
tier: flagship
period: 2026 – present
stack: [C++20, Direct3D 11, DXGI, HID, CMake]
links:
  - { label: Source on GitHub, href: "https://github.com/AkshayReddyGujjula/Rayneo-Spatial-App" }
facts:
  - { value: "3DoF", label: head tracking from the glasses' IMU }
  - { value: "1–8", label: screens in any layout }
  - { value: "9", label: CTest suites }
---

The glasses' IMU streams over HID. I decode it, calibrate the sensor-to-head orientation and estimate pose with a fusion filter that adapts its gyro bias only while the head is at rest. A Direct3D 11 renderer then places each screen at its own yaw, pitch, roll and distance. The default is a three-screen arc at −45°, 0° and +45°.

The screens are real Windows desktops. Virtual monitors from the Parsec display driver are captured with DXGI Desktop Duplication, with a GDI fallback, so any app you drag onto them works. A native dashboard edits layouts, recentres the view and shows device and engine diagnostics.
