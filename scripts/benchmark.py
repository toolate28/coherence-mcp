#!/usr/bin/env python3
"""
benchmark.py - Chaos-enabled benchmarking with Fibonacci scoring

This script implements a spiral workflow combining:
- Fibonacci-weighted prioritization (1,1,2,3,5...)
- Fractal noise injection using the golden ratio (φ ≈ 1.618)
- VS Code Shell Integration (OSC 633) for terminal decoration
"""

import sys
import time
import random
import math
import argparse

# Golden ratio for fractal noise
PHI = 1.618033988749895

# Benchmark configuration constants
BASE_TIME = 1.0
TIME_VARIANCE = 0.1
CHAOS_AMPLITUDE = 0.3
CHAOS_LEVEL_SCALE = 100
STABLE_THRESHOLD = 0.15


def emit_osc_633(code, params=""):
    """
    Emit OSC 633 escape sequence for VS Code Shell Integration.
    
    OSC 633 ; A - Mark prompt start
    OSC 633 ; B - Mark prompt end
    OSC 633 ; P ; Property=Value - Set property
    OSC 633 ; D ; ExitCode - Mark command finished
    """
    if params:
        sys.stdout.write(f"\033]633;{code};{params}\007")
    else:
        sys.stdout.write(f"\033]633;{code}\007")
    sys.stdout.flush()


def fractal_noise(iteration, amplitude=1.0):
    """
    Generate fractal noise using golden ratio.
    Forces exploration of adjacent solution spaces.
    """
    # Use golden ratio to create pseudo-random but deterministic noise
    noise = math.sin(iteration * PHI) * amplitude
    # Add secondary harmonic for fractal behavior
    noise += math.sin(iteration * PHI * PHI) * (amplitude / PHI)
    return noise


def calculate_fibonacci_score(run_index):
    """
    Calculate Fibonacci-weighted score for a given run.
    More recent runs get higher weight (1,1,2,3,5,8,13...)
    """
    if run_index <= 0:
        return 1
    elif run_index == 1:
        return 1
    
    # Calculate Fibonacci number for the position
    a, b = 1, 1
    for _ in range(run_index - 1):
        a, b = b, a + b
    return b


def grok_benchmark(iterations=5, chaos_mode=False):
    """
    Run the benchmark with optional chaos injection.
    
    Args:
        iterations: Number of benchmark iterations
        chaos_mode: Enable fractal noise injection
    """
    print(f"Starting benchmark with {iterations} iterations (chaos={chaos_mode})")
    
    if chaos_mode:
        emit_osc_633("P", "ChaosMode=enabled")
    
    results = []
    
    for i in range(iterations):
        # Mark prompt boundaries for automated runs
        emit_osc_633("A")
        
        # Calculate Fibonacci weight for this iteration
        fib_weight = calculate_fibonacci_score(i)
        
        # Base performance metric (simulated)
        base_time = BASE_TIME + random.uniform(-TIME_VARIANCE, TIME_VARIANCE)
        
        noise = 0.0
        if chaos_mode:
            # Inject fractal noise
            noise = fractal_noise(i, amplitude=CHAOS_AMPLITUDE)
            actual_time = base_time + noise
            
            # Signal chaos level to terminal
            chaos_level = int(abs(noise) * CHAOS_LEVEL_SCALE)
            emit_osc_633("P", f"ChaosLevel={chaos_level}")
        else:
            actual_time = base_time
        
        # Simulate work
        time.sleep(0.1)
        
        # Calculate weighted score
        score = fib_weight / actual_time
        results.append({
            "iteration": i,
            "weight": fib_weight,
            "time": actual_time,
            "score": score,
            "noise": noise
        })
        
        # Mark prompt end
        emit_osc_633("B")
        
        # Print result
        status = "🔵" if not chaos_mode or abs(noise) < STABLE_THRESHOLD else "🔴"
        print(f"  [{i+1}/{iterations}] {status} Weight={fib_weight}, Time={actual_time:.3f}s, Score={score:.2f}")
        
        # Mark command finished with success
        emit_osc_633("D", "0")
    
    # Calculate aggregate metrics
    total_score = sum(r["score"] for r in results)
    avg_time = sum(r["time"] for r in results) / len(results)
    
    print(f"\n{'='*60}")
    print(f"Total Fibonacci-weighted score: {total_score:.2f}")
    print(f"Average time: {avg_time:.3f}s")
    
    if chaos_mode:
        entropy = sum(abs(r["noise"]) for r in results) / len(results)
        print(f"Average entropy: {entropy:.3f}")
        
        if entropy < STABLE_THRESHOLD:
            emit_osc_633("P", "EntropyState=stable")
            print("📘 Entropy: STABLE (Blue Dot)")
        else:
            emit_osc_633("P", "EntropyState=warning")
            print("📕 Entropy: WARNING (Red Dot)")
    
    emit_osc_633("P", f"BenchmarkComplete=true")
    print(f"{'='*60}\n")
    
    return total_score


def main():
    parser = argparse.ArgumentParser(
        description="Chaos-enabled benchmark with Fibonacci scoring"
    )
    parser.add_argument(
        "--chaos-mode",
        action="store_true",
        help="Enable fractal noise injection (10 iterations)"
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=5,
        help="Number of iterations (default: 5)"
    )
    
    args = parser.parse_args()
    
    # Override iterations if chaos mode is enabled
    iterations = 10 if args.chaos_mode else args.iterations
    
    try:
        score = grok_benchmark(iterations=iterations, chaos_mode=args.chaos_mode)
        sys.exit(0)
    except KeyboardInterrupt:
        print("\nBenchmark interrupted")
        emit_osc_633("D", "130")  # 128 + SIGINT
        sys.exit(130)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        emit_osc_633("D", "1")
        sys.exit(1)


if __name__ == "__main__":
    main()
