/**
 * CV entries phrased for the CV page, which reads differently from the site's
 * project write-ups. Education, skills and teaching come from `profile.ts`.
 */

export interface CvEntry {
  title: string;
  context: string;
  period: string;
  stack: string;
  link?: { label: string; href: string };
  points: string[];
}

export const cvProjects: CvEntry[] = [
  {
    title: "StudyCanvas",
    context: "Spatial AI study platform",
    period: "Jan 2026 – present",
    stack: "React, TypeScript, FastAPI, Python, Gemini API",
    link: { label: "studycanvas.app", href: "https://studycanvas.app" },
    points: [
      "Designed, built and deployed a React and FastAPI study platform on Vercel, used weekly by 10 students including my tutees. PDF highlights create source-grounded Gemini requests from the exact selection, page context and parent response, with answers streamed into linked nodes that form a traceable learning graph.",
      "Architected a 21-node-type React Flow canvas with cancellable streamed generation. Controlled Gemini cost through static task tiers, added Vision OCR for handwriting and browser-side Python through Pyodide, and built local-first storage on the File System Access API with an IndexedDB fallback.",
    ],
  },
  {
    title: "UnDiffused",
    context: "On-device AI-image detection",
    period: "Dec 2025 – present",
    stack: "TypeScript, React, ONNX Runtime Web, PyTorch, DINOv2",
    link: { label: "GitHub", href: "https://github.com/AkshayReddyGujjula/UnDiffused-AI" },
    points: [
      "Built a privacy-first Chrome extension for AI-image detection, fine-tuning a DINOv2-S/14 model and quantising it to a 24.9 MB INT8 ONNX artifact, 3.55× smaller than FP32, running entirely on-device through ONNX Runtime Web and WebAssembly in 0.7–0.9 seconds.",
      "Achieved 0.954 AUROC on 400 unseen content-matched real and generated pairs across four diffusion models. Designed pair-safe evaluation and calibrated abstention, holding 0.948–0.958 AUROC under JPEG compression, resizing, WebP conversion and screenshot recapture.",
    ],
  },
];

export const cvCompetitions: CvEntry[] = [
  {
    title: "Work in Fintech AI Summit Hackathon, 1st place",
    context: "Moneywell Town",
    period: "Aug 2026",
    stack: "React, TypeScript, Vite",
    link: { label: "moneywelltown.com", href: "https://moneywelltown.com" },
    points: [
      "Built Moneywell Town, a client-side financial-literacy platform with a custom 2D tile renderer, an adaptive five-box Leitner spaced-repetition engine and interactive financial modelling modules.",
      "Cut render latency 2.5× in the tile-update path by moving ambient updates across a 792-tile world out of React's render cycle into CSS, which lifted end-to-end frame rate 53% once camera, movement and input scheduling were rebalanced off the main thread.",
    ],
  },
  {
    title: "UCL Data Science Society Hackathon, 1st place Finance Track",
    context: "Congress vs the market",
    period: "Jan 2026 – Mar 2026",
    stack: "Python, scikit-learn",
    points: [
      "Led a three-person team analysing 11,879 congressional stock trades from 172 members over five years against the S&P 500 (Quiver Quant, GovTrack and yfinance APIs). Found a 46.9% beat rate and significant underperformance (p < 0.001), challenging the insider-advantage narrative.",
      "Trained a Random Forest on party, committee alignment, trade value and disclosure lag, and reported the near-random result (5-fold CV, AUC 0.571, F1 0.548) as the finding rather than tuning it away, consistent with the Efficient Markets Hypothesis.",
    ],
  },
  {
    title: "Imperial × Anthropic Claude Hackathon, 5th of 100+",
    context: "Medi-Scribe",
    period: "Mar 2026",
    stack: "Python, Flask, Claude API",
    link: {
      label: "GitHub",
      href: "https://github.com/AkshayReddyGujjula/ClaudeImperialHackathon",
    },
    points: [
      "Built Medi-Scribe, an AI pre-appointment interview tool that structures patient symptoms into a GP handoff summary. Issued independent Claude API calls in parallel rather than chaining them to keep the interview responsive, with voice input, acute-symptom flagging and client-side PDF export.",
    ],
  },
];
