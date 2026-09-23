---
title: The time my AI image detector scored 0.990 and I didn't believe it
description: What I learned rebuilding UnDiffused, a Chrome extension that guesses whether an image is AI generated, after finding out the first version was basically flipping a coin.
published: 2026-09-23
draft: false
---

UnDiffused is a Chrome extension. You right-click an image and it tells you whether it thinks the image is AI generated, and it does all of this on your own computer without uploading anything. It started at the AI Ventures Hackathon at Imperial, and I've been rebuilding it properly since.

Honestly, the biggest thing I learned from this project was about testing.

## The first version didn't work

The version I shipped first used two ViT-B/16 checkpoints, 174 MB in total. At some point I actually sat down and measured it properly, and it scored 0.500 AUROC. That's the same as guessing. It had been sitting there looking confident and giving people answers, and none of them meant anything.

That was a bit embarrassing, but it gave me a rule I stuck to for the rest of the project: always test the exact model that ships, running in the browser the same way a user would run it.

## A score that was too good

For the rebuild I switched to DINOv2. To check it could handle image generators it hadn't seen before, I left one generator out of training completely. On that held-out generator it scored 0.990 AUROC.

I was pretty happy for about a day. Then I looked at where the images were coming from. The real photos were from a dataset called COCO, and the AI images were from ELSA, whose prompts came from a different dataset called LAION. Those two sources look different in lots of boring ways, like what the photos are of and how they were framed and compressed. So the model could tell them apart without learning anything about whether an image was real.

To test this I made matched pairs. Each pair is a real LAION image plus an ELSA image generated from that same photo's caption, so both images are roughly of the same thing. On those pairs, the model that scored 0.990 dropped to 0.659. It had mostly learned to recognise the two datasets.

## Training on the matched pairs

Once I trained on matched pairs, the gap between the easy test and the matched test went from about 0.32 to under 0.01. A frozen DINOv2-S/14 with a simple linear layer on top got 0.894. Fine-tuning the last four blocks got it to 0.954 AUROC on 400 matched pairs (800 images) that were never used for training or for picking thresholds.

I also tested what happens to images on the real internet, like JPEG compression, resizing, converting to WebP and taking screenshots. It stayed between 0.948 and 0.958 through all of those.

## Letting it say "not sure"

The extension gives one of three answers: likely real, can't tell, or likely AI generated. On the test set it says "can't tell" for 14.25% of images. For the rest, it wrongly flags a real image as AI 6.88% of the time. I'd rather it admit when it doesn't know than force a yes or no. There are also ten forensic tools you can open, like error level analysis and a frequency view, if you want to look at the image yourself.

## Getting it into the browser

A model that works in Python is only half the job. The shipped model is quantised to INT8, which makes it 24.9 MB (3.55 times smaller than the full-precision one), and it runs with ONNX Runtime Web and WebAssembly in about 0.7 to 0.9 seconds once it's loaded. Before every run it checks the input and output shapes, so if something's wrong it throws an error. That way a broken model can't quietly hand back a nonsense score.

## What it can't do

It's one model tested one careful way. The test set covers four open-source image generators, so I can't say anything about Midjourney or Firefly or whatever comes out next month. Some of LAION's "real" images are actually graphics or screenshots too. If an image has C2PA provenance data, that's more trustworthy than any detector. All of this, including the first version failing, is written up in the [repo](https://github.com/AkshayReddyGujjula/UnDiffused-AI).
