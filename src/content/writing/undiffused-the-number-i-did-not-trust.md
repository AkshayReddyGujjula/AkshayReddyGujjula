---
title: The 0.990 I didn't trust
description: How UnDiffused went from a detector that performed at chance to 0.954 AUROC on content-matched pairs, and why the evaluation mattered more than the model.
published: 2026-09-23
draft: true
---

UnDiffused is a Chrome extension that estimates whether an image is AI-generated, entirely on your device. The most useful thing I learned building it was that a good number can be the most dangerous result you get.

## Measuring what shipped

The first version of the extension shipped with two ViT-B/16 checkpoints, 174 MB between them. When I finally measured it properly, it scored 0.500 AUROC. That's chance: a coin flip with extra steps. Nothing in the product said so.

That set the rule for everything after: measure the exact artefact that ships, not the model in a notebook.

## A result that was too good

For the rebuild I moved to DINOv2 and held one generator out of training to test generalisation. It scored 0.990 AUROC on that held-out generator. That should have been the end of the project.

It wasn't, because of where the images came from. The real photos came from COCO. The generated images came from ELSA, whose prompts were derived from LAION captions. Two different corpora, with different subjects, framing and processing. A model can tell those apart without learning anything about whether an image is real.

So I built content-matched pairs. Each pair is a LAION source image and an ELSA generation made from that image's own caption, so the subject stays roughly constant and only authenticity changes. On matched pairs the 0.990 model fell to 0.659. It had learned the seam between two datasets.

Holding a generator out didn't protect the evaluation, because the seam was still visible. That finding shaped the project more than any choice of architecture.

## Rebuilding on honest data

Training on matched pairs closed the gap between unmatched and matched scores from about 0.32 to under 0.01. A frozen DINOv2-S/14 with a linear head reached 0.894. Fine-tuning its last four blocks reached 0.954 AUROC on 400 unseen matched pairs, 800 images, none of them used for training or for fitting thresholds.

It holds between 0.948 and 0.958 after JPEG compression, resizing, WebP conversion and screenshot recapture, which matters because that's what happens to images on the real web.

## Saying "I'm not sure"

The score is calibrated, and the extension gives three answers rather than two: likely authentic, inconclusive, or likely AI-generated. On the external set it abstains on 14.25% of images. Among the ones it decides, the false-positive rate is 6.88%.

A forced yes or no would make the interface look simpler and the result less honest. Ten forensic tools sit behind every verdict, from error level analysis to frequency plots, so you can check its working yourself.

## Getting it into a browser

A good Python result isn't a working extension. The shipping model is INT8, 24.9 MB, 3.55 times smaller than FP32, and runs through ONNX Runtime Web and WebAssembly in about 0.7 to 0.9 seconds warm. The input and output contract is asserted before every inference, so a mismatched tensor or a non-finite logit fails loudly instead of quietly becoming a confidence score.

## The limits

This is one model against one carefully controlled protocol. The evaluation covers four open-source diffusion families, not Midjourney, Firefly or whatever comes next, and LAION's "real" images include graphics and screenshots. C2PA provenance, where it exists, should beat any detector. All of that is written down in the [repository](https://github.com/AkshayReddyGujjula/UnDiffused-AI), along with the v1 failure, because publishing the negative results is part of the work.
