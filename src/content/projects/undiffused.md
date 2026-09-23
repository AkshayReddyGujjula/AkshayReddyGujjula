---
title: UnDiffused
tagline: A privacy-first Chrome extension that estimates whether an image is AI-generated, entirely on your device, and shows its working.
order: 4
tier: flagship
period: Dec 2025 – present
stack: [TypeScript, React, ONNX Runtime Web, PyTorch, DINOv2]
links:
  - { label: Source and evaluation, href: "https://github.com/AkshayReddyGujjula/UnDiffused-AI" }
facts:
  - { value: "0.954", label: AUROC on 400 unseen pairs }
  - { value: "24.9 MB", label: INT8 model, 3.55× smaller }
  - { value: "0.7–0.9 s", label: per image, on-device }
  - { value: "10", label: forensic tools }
---

The first model the extension shipped performed at chance. Its replacement looked better until I caught it learning a dataset shortcut. So I rebuilt the evaluation around content-matched pairs, where each real image has a generated twin of the same subject, before trusting any number.

The shipped detector is a fine-tuned DINOv2-S/14, quantised to INT8 and run through ONNX Runtime Web with WebAssembly. It scores 0.954 AUROC across four diffusion models, holds between 0.948 and 0.958 under JPEG compression, resizing, WebP conversion and screenshot recapture, and abstains instead of guessing when it is unsure. Ten interactive forensic tools sit behind every verdict so you can check it yourself.
