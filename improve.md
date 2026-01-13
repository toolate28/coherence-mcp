# Improvement Workflow: The Spiral Loop

This document outlines the **Improve** phase of the Coherence MCP lifecycle. We utilize a $\lambda_0-\lambda_1$ spiral workflow to prioritize changes and ensure stability against non-linear perturbations.

## Core Concepts

### 1. Fibonacci Prioritization
We do not view all test runs as equal. To escape local minima and adapt to recent system state changes (cache warming, JIT optimization, or drift), we weight benchmarking results using the **Fibonacci Sequence**:

$$ Score = \frac{\sum (L_i \cdot F_i)}{\sum F_i} $$

Where $L_i$ is the latency of the $i$-th run, and $F_i$ is the $i$-th Fibonacci number ($1, 1, 2, 3, 5, ...$). This ensures that the most recent iterations contribute significantly more to the final score than early runs.

### 2. Chaos Integration ("Fractal Noise")
Code that works in a vacuum often fails in the wild. We inject **Fractal Noise** into our benchmarks using a Golden Ratio perturbation function:

$$ Noise \sim \mathcal{N}(0, \frac{\phi}{5}) $$

This tests the system's ability to handle jitter, latency spikes, and input variance without breaking the **Lambda1 Entropy Threshold** ($\lambda_1 = 0.8$).

## Reading the Terminal (Negative Space)

This project utilizes **VS Code Shell Integration** (`OSC 633`) to emit status signals directly to the terminal interface, keeping the logs clean.

### The Dot System
When running `npm run bench:chaos`, observe the dots emitted in the output:

*   🔵 **Blue Dot**: Run successful. Entropy was within limits ($\Delta S < \lambda_1$).
*   🔴 **Red Dot**: "Soft Fail". The chaos injection caused an entropy spike > $\lambda_1$. The benchmark continued, but the instability was noted.

### The Gutter
In the VS Code terminal gutter (to the left of the command):
*   **Green Circle**: The entire chaos epoch passed within safety limits.
*   **Red Circle**: At least one run exceeded the entropy threshold. Use `Ctrl+Up` to navigate to the failed command and inspect the JSON output.

### Sticky Scroll
The benchmark emits "Phase" headers that stick to the top of the terminal viewport, allowing you to see which query regime (Init, Chaos, or Score) is currently executing even during rapid scrolling output.
