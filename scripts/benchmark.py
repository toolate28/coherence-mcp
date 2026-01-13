#!/usr/bin/env python3
"""
scripts/benchmark.py
====================

Chaos-aware benchmark harness for Coherence MCP.
Integrates "fractal noise" (Golden Ratio perturbations) and Fibonacci-weighted scoring.
Emits VS Code Shell Integration sequences (OSC 633) to allow "Negative Space" observability.

Usage
-----
    python scripts/benchmark.py --iterations 5 --chaos-mode

Protocol
--------
1.  **Init**: emitted via OSC 633;P;Phase=Init
2.  **Chaos**: Gaussian perturbation noise = N(0, phi/5)
3.  **Score**: Weighted avg using Fib(n) for the last N runs to prioritize freshness.
"""

import argparse
import json
import logging
import math
import random
import statistics
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any, Optional

# =============================================================================
# CONSTANTS & CONFIG
# =============================================================================
PHI = (1 + math.sqrt(5)) / 2  # Golden Ratio (~1.618)
LAMBDA1_THRESHOLD = 0.8       # Entropy threshold (from wave spec)

# VS Code Shell Integration Sequences
# Ref: https://code.visualstudio.com/docs/terminal/shell-integration
OSC = "\x1b]"
ST = "\x07"  # String Terminator

QUERIES = [
    {"id": "q1", "query": "Determine wave.md entropic divergence"},
    {"id": "q2", "query": "Calculate curl of current context"},
    {"id": "q3", "query": "Validate coherence gates for ATOM-3FA"},
]

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("chaos-bench")

# =============================================================================
# SHELL INTEGRATION HELPERS
# =============================================================================
def emit_osc_property(key: str, value: str):
    """Emit OSC 633 ; P ; Key=Value ST to set terminal property."""
    if sys.stdout.isatty():
        sys.stdout.write(f"{OSC}633;P;{key}={value}{ST}")
        sys.stdout.flush()

def emit_status_dot(color: str):
    """Emit a colored dot to visualize state in the gutter/output."""
    # This is a visual aid, not an OSC sequence, but helps 'Red/Blue dot' check
    colors = {
        "blue": "\033[34m●\033[0m",
        "red": "\033[31m●\033[0m",
        "green": "\033[32m●\033[0m",
        "yellow": "\033[33m●\033[0m"
    }
    sys.stdout.write(colors.get(color, "."))
    sys.stdout.flush()

# =============================================================================
# CORE LOGIC
# =============================================================================

@dataclass
class BenchmarkRun:
    query_id: str
    latency_ms: float
    noise_level: float
    success: bool

def fractal_noise() -> float:
    """
    Generate fractal noise using Golden Ratio perturbation.
    Returns value from Normal distribution N(0, phi/5).
    """
    # Phi/5 ensures we stay within "safe" chaos bounds typically
    sigma = PHI / 5.0
    return random.normalvariate(0, sigma)

def run_mock_op(query: str, chaos: bool = False) -> BenchmarkRun:
    """Mock operation that simulates latency with optional chaos injection."""
    base_latency = 5.0  # ms
    noise = 0.0
    
    if chaos:
        noise = fractal_noise()
        
    # Chaos affects latency non-linearly
    # If noise is high (outlier), latency spikes (simulating resource contention)
    latency = base_latency + (abs(noise) * 10)
    
    # Simulate processing time
    time.sleep(latency / 1000.0)
    
    # Entropy check: if noise exceeds Lambda1, we consider it a 'soft fail' (Red Dot)
    success = abs(noise) < LAMBDA1_THRESHOLD
    
    return BenchmarkRun(
        query_id="mock", # simplistic
        latency_ms=latency,
        noise_level=noise,
        success=success
    )

def fibonacci_sequence(n: int) -> List[int]:
    """Generate first n Fibonacci numbers."""
    if n <= 0: return []
    if n == 1: return [1]
    fib = [1, 1]
    while len(fib) < n:
        fib.append(fib[-1] + fib[-2])
    return fib

def calculate_fibonacci_score(latencies: List[float]) -> float:
    """
    Calculate weighted average of latencies using Fibonacci weights.
    Later runs (more recent) get higher weights.
    """
    if not latencies:
        return 0.0
    
    n = len(latencies)
    weights = fibonacci_sequence(n)
    
    weighted_sum = sum(l * w for l, w in zip(latencies, weights))
    total_weight = sum(weights)
    
    return weighted_sum / total_weight

# =============================================================================
# REPL / MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Chaos Benchmark Harness")
    parser.add_argument("--iterations", "-n", type=int, default=5, help="Number of iterations")
    parser.add_argument("--chaos-mode", action="store_true", help="Enable fractal noise injection")
    args = parser.parse_args()

    emit_osc_property("ChaosEnabled", str(args.chaos_mode))
    print(f"Starting Benchmark (n={args.iterations}, chaos={args.chaos_mode})...")

    results = []
    
    for i in range(args.iterations):
        # Per-query loop
        for q in QUERIES:
            run = run_mock_op(q['query'], chaos=args.chaos_mode)
            results.append(run)
            
            # Visual feedback
            if run.success:
                emit_status_dot("blue")
            else:
                emit_status_dot("red")
                # Emit warning prop for shell integration
                emit_osc_property("EntropyWarning", "True")

        print(" ", end="") # Spacing between epochs
    
    print("\n")
    
    # Analysis
    latencies = [r.latency_ms for r in results]
    fib_score = calculate_fibonacci_score(latencies)
    avg_latency = statistics.mean(latencies)
    
    # Summary
    print(f"--- Summary ---")
    print(f"Total Runs: {len(results)}")
    print(f"Avg Latency: {avg_latency:.2f}ms")
    print(f"Fib-W Score: {fib_score:.2f}ms (Weighted towards recent runs)")
    
    if args.chaos_mode:
        max_noise = max([abs(r.noise_level) for r in results])
        print(f"Max Entropy: {max_noise:.4f} (Threshold: {LAMBDA1_THRESHOLD})")
        
        if max_noise > LAMBDA1_THRESHOLD:
            print(f"\n{OSC}633;D;1{ST}") # Signal 'error' state to shell decoration without crashing?
            # Actually, let's just print a warning
            print("WARNING: Entropy limit exceeded in one or more runs.")
            sys.exit(1) # Soft fail for CI
        else:
            print(f"Entropy within limits.")

    # Write summary json
    out_path = Path("benchmark_results.json")
    with open(out_path, "w") as f:
        json.dump({
            "summary": {
                "avg_latency": avg_latency,
                "fib_score": fib_score,
                "chaos": args.chaos_mode
            },
            "runs": [
                {
                    "q": r.query_id, 
                    "lat": r.latency_ms, 
                    "noise": r.noise_level,
                    "ok": r.success
                } for r in results
            ]
        }, f, indent=2)
        
    print(f"Results written to {out_path}")

if __name__ == "__main__":
    main()
