/**
 * Measured results behind the Optimising chapter. Nothing here is estimated.
 *
 * Pi: the four matched runs of the shipped configuration (runs 7, 8, 9 and 11 of
 * the smoke benchmark in the private "PI Deepseek Optimisation" repository), 24
 * JavaScript tasks each, same model (DeepSeek V4.1 Flash, max reasoning), same
 * prompts and verifiers. Run 10 is excluded because it deliberately reverted one
 * change as an A/B test. Counts are trials by number of tool calls.
 */
export const piBenchmark = {
  trials: 96,
  stock: {
    passed: 96,
    meanCalls: 4.09,
    medianSeconds: 8.7,
    calls: { 3: 24, 4: 45, 5: 22, 6: 4, 7: 1 },
  },
  optimised: {
    passed: 96,
    meanCalls: 3.13,
    medianSeconds: 9.3,
    calls: { 3: 87, 4: 7, 5: 1, 6: 1, 7: 0 },
  },
} as const;

/** Jev Ultrafast v2, from docs/performance.md in the local jev-ultrafast checkout (21 Sep 2026). */
export const jevChecks = { checks: 5, parallelSeconds: 3.2, serialSeconds: 12.2 } as const;
