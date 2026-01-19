/**
 * Tests for Fibonacci Weighting Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FibonacciWeightingEngine,
  GOLDEN_RATIO,
  WeightedComponent,
} from '../src/fibonacci/weighting';

describe('Fibonacci Weighting Engine', () => {
  let engine: FibonacciWeightingEngine;

  beforeEach(() => {
    engine = new FibonacciWeightingEngine();
  });

  describe('Fibonacci Sequence Generation', () => {
    it('should generate correct Fibonacci sequence', () => {
      expect(engine.getFibonacci(1)).toBe(1);
      expect(engine.getFibonacci(2)).toBe(1);
      expect(engine.getFibonacci(3)).toBe(2);
      expect(engine.getFibonacci(4)).toBe(3);
      expect(engine.getFibonacci(5)).toBe(5);
      expect(engine.getFibonacci(6)).toBe(8);
      expect(engine.getFibonacci(7)).toBe(13);
      expect(engine.getFibonacci(8)).toBe(21);
      expect(engine.getFibonacci(9)).toBe(34);
      expect(engine.getFibonacci(10)).toBe(55);
      expect(engine.getFibonacci(11)).toBe(89);
    });

    it('should handle edge cases', () => {
      expect(engine.getFibonacci(0)).toBe(0);
      expect(engine.getFibonacci(-1)).toBe(0);
    });

    it('should calculate large Fibonacci numbers', () => {
      expect(engine.getFibonacci(15)).toBe(610);
      expect(engine.getFibonacci(20)).toBe(6765);
    });
  });

  describe('Golden Ratio', () => {
    it('should have correct golden ratio constant', () => {
      expect(GOLDEN_RATIO).toBeCloseTo(1.618, 3);
    });

    it('should converge to golden ratio', () => {
      const f10 = engine.getFibonacci(10);
      const f11 = engine.getFibonacci(11);
      const ratio = f11 / f10;
      
      expect(ratio).toBeCloseTo(GOLDEN_RATIO, 2);
    });

    it('should refine threshold using golden ratio', () => {
      const baseThreshold = 60;
      const refined = engine.refineThresholdWithGoldenRatio(baseThreshold);
      
      expect(refined).toBeCloseTo(97.08, 1);
    });
  });

  describe('Weight Assignment', () => {
    it('should assign critical priority to high importance', () => {
      const component = engine.assignWeight('Safety Systems', 95);
      
      expect(component.name).toBe('Safety Systems');
      expect(component.priority).toBe('critical');
      expect(component.fibonacciWeight).toBeGreaterThanOrEqual(9);
      expect(component.impactMultiplier).toBeGreaterThan(30);
    });

    it('should assign high priority to medium-high importance', () => {
      const component = engine.assignWeight('Traffic Coherence', 75);
      
      expect(component.priority).toBe('high');
      expect(component.fibonacciWeight).toBeGreaterThanOrEqual(7);
    });

    it('should assign medium priority to moderate importance', () => {
      const component = engine.assignWeight('Cost Optimization', 50);
      
      expect(component.priority).toBe('medium');
      expect(component.fibonacciWeight).toBeGreaterThanOrEqual(5);
    });

    it('should assign low priority to low importance', () => {
      const component = engine.assignWeight('Branding', 30);
      
      expect(component.priority).toBe('low');
      expect(component.fibonacciWeight).toBeLessThanOrEqual(4);
    });

    it('should handle boundary values', () => {
      const min = engine.assignWeight('Min', 0);
      const max = engine.assignWeight('Max', 100);
      
      expect(min.fibonacciWeight).toBeGreaterThan(0);
      expect(max.fibonacciWeight).toBe(10);
      expect(max.priority).toBe('critical');
    });
  });

  describe('Impact Calculation', () => {
    it('should calculate exponential impact for high-weight components', () => {
      const safetySystem: WeightedComponent = {
        name: 'Safety Systems',
        fibonacciWeight: 9,
        impactMultiplier: 34,
        priority: 'critical'
      };
      
      const degradation = 0.1; // 10% degradation
      const impact = engine.calculateImpact(safetySystem, degradation);
      
      expect(impact).toBeCloseTo(3.4, 1);
    });

    it('should calculate minimal impact for low-weight components', () => {
      const branding: WeightedComponent = {
        name: 'Branding',
        fibonacciWeight: 4,
        impactMultiplier: 3,
        priority: 'low'
      };
      
      const degradation = 0.1;
      const impact = engine.calculateImpact(branding, degradation);
      
      expect(impact).toBeCloseTo(0.3, 1);
    });

    it('should scale linearly with degradation', () => {
      const component: WeightedComponent = {
        name: 'Test',
        fibonacciWeight: 5,
        impactMultiplier: 5,
        priority: 'medium'
      };
      
      expect(engine.calculateImpact(component, 0.0)).toBe(0);
      expect(engine.calculateImpact(component, 0.5)).toBe(2.5);
      expect(engine.calculateImpact(component, 1.0)).toBe(5);
    });
  });

  describe('Resource Optimization', () => {
    it('should allocate resources proportionally to Fibonacci weights', () => {
      const components = [
        engine.assignWeight('Safety', 95),
        engine.assignWeight('Traffic', 80),
        engine.assignWeight('Cost', 65),
        engine.assignWeight('Environment', 50),
        engine.assignWeight('Branding', 30)
      ];
      
      const budget = 100;
      const plan = engine.optimizeAllocation(components, budget);
      
      expect(plan.totalAllocated).toBeCloseTo(budget, 1);
      expect(plan.efficiency).toBeGreaterThan(99);
      expect(plan.allocations.length).toBe(5);
      
      // Safety should get the most allocation
      const safetyAllocation = plan.allocations.find(a => a.component === 'Safety');
      expect(safetyAllocation).toBeDefined();
      expect(safetyAllocation!.allocation).toBeGreaterThan(20);
      
      // Branding should get the least
      const brandingAllocation = plan.allocations.find(a => a.component === 'Branding');
      expect(brandingAllocation).toBeDefined();
      expect(brandingAllocation!.allocation).toBeLessThan(10);
    });

    it('should handle empty component list', () => {
      const plan = engine.optimizeAllocation([], 100);
      
      expect(plan.totalAllocated).toBe(0);
      expect(plan.efficiency).toBe(0);
      expect(plan.allocations.length).toBe(0);
    });

    it('should maintain percentage sum close to 100', () => {
      const components = [
        engine.assignWeight('A', 80),
        engine.assignWeight('B', 60),
        engine.assignWeight('C', 40)
      ];
      
      const plan = engine.optimizeAllocation(components, 100);
      const totalPercentage = plan.allocations.reduce((sum, a) => sum + a.percentage, 0);
      
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe('Critical Path Detection', () => {
    it('should identify critical paths by priority', () => {
      const components = [
        { name: 'Safety', fibonacciWeight: 9, impactMultiplier: 34, priority: 'critical' as const },
        { name: 'Auth', fibonacciWeight: 9, impactMultiplier: 34, priority: 'critical' as const },
        { name: 'Traffic', fibonacciWeight: 8, impactMultiplier: 21, priority: 'high' as const },
        { name: 'Logging', fibonacciWeight: 5, impactMultiplier: 5, priority: 'medium' as const },
        { name: 'UI', fibonacciWeight: 3, impactMultiplier: 2, priority: 'low' as const }
      ];
      
      const paths = engine.findCriticalPaths(components);
      
      expect(paths.length).toBeGreaterThan(0);
      
      const criticalPath = paths.find(p => p.riskLevel === 'extreme');
      expect(criticalPath).toBeDefined();
      expect(criticalPath!.components).toContain('Safety');
      expect(criticalPath!.components).toContain('Auth');
      expect(criticalPath!.totalWeight).toBe(68);
    });

    it('should handle single priority level', () => {
      const components = [
        { name: 'A', fibonacciWeight: 5, impactMultiplier: 5, priority: 'medium' as const },
        { name: 'B', fibonacciWeight: 5, impactMultiplier: 5, priority: 'medium' as const }
      ];
      
      const paths = engine.findCriticalPaths(components);
      
      expect(paths.length).toBe(1);
      expect(paths[0].riskLevel).toBe('medium');
      expect(paths[0].totalWeight).toBe(10);
    });

    it('should return empty array for no components', () => {
      const paths = engine.findCriticalPaths([]);
      
      expect(paths).toEqual([]);
    });
  });

  describe('Priority Distribution Visualization', () => {
    it('should generate visualization data', () => {
      const components = [
        { name: 'Safety', fibonacciWeight: 9, impactMultiplier: 34, priority: 'critical' as const },
        { name: 'Traffic', fibonacciWeight: 8, impactMultiplier: 21, priority: 'high' as const },
        { name: 'Cost', fibonacciWeight: 7, impactMultiplier: 13, priority: 'high' as const },
        { name: 'Environment', fibonacciWeight: 6, impactMultiplier: 8, priority: 'medium' as const },
        { name: 'Branding', fibonacciWeight: 4, impactMultiplier: 3, priority: 'low' as const }
      ];
      
      const distribution = engine.generatePriorityDistribution(components);
      
      expect(distribution.length).toBe(5);
      
      // Safety should have longest bar
      const safety = distribution.find(d => d.name === 'Safety');
      expect(safety).toBeDefined();
      expect(safety!.barLength).toBe(40); // Max bar length
      expect(safety!.weight).toBe(34);
      
      // Branding should have shortest bar
      const branding = distribution.find(d => d.name === 'Branding');
      expect(branding).toBeDefined();
      expect(branding!.barLength).toBeLessThan(10);
      
      // Percentages should sum to ~100
      const totalPercentage = distribution.reduce((sum, d) => sum + d.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });

    it('should handle empty components', () => {
      const distribution = engine.generatePriorityDistribution([]);
      
      expect(distribution).toEqual([]);
    });

    it('should normalize bar lengths correctly', () => {
      const components = [
        { name: 'Max', fibonacciWeight: 10, impactMultiplier: 55, priority: 'critical' as const },
        { name: 'Half', fibonacciWeight: 5, impactMultiplier: 27.5, priority: 'high' as const }
      ];
      
      const distribution = engine.generatePriorityDistribution(components);
      const max = distribution.find(d => d.name === 'Max');
      const half = distribution.find(d => d.name === 'Half');
      
      expect(max!.barLength).toBe(40);
      expect(half!.barLength).toBe(20); // Half of max
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle tunnel boring optimization use case', () => {
      const components = [
        engine.assignWeight('Safety Systems', 95),
        engine.assignWeight('Traffic Coherence', 85),
        engine.assignWeight('Cost Optimization', 70),
        engine.assignWeight('Environmental', 55),
        engine.assignWeight('Branding', 35)
      ];
      
      // Verify exponential weighting
      const safetyImpact = engine.calculateImpact(components[0], 0.1);
      const brandingImpact = engine.calculateImpact(components[4], 0.1);
      
      expect(safetyImpact).toBeGreaterThan(brandingImpact * 10);
      
      // Verify resource allocation
      const plan = engine.optimizeAllocation(components, 100);
      const safetyAllocation = plan.allocations.find(a => a.component === 'Safety Systems');
      const brandingAllocation = plan.allocations.find(a => a.component === 'Branding');
      
      expect(safetyAllocation!.allocation).toBeGreaterThan(brandingAllocation!.allocation * 5);
    });

    it('should handle PR prioritization use case', () => {
      const prs = [
        engine.assignWeight('WAVE Validator', 90),
        engine.assignWeight('ATOM Trail', 90),
        engine.assignWeight('SPHINX Gates', 90),
        engine.assignWeight('H&&S Protocol', 75),
        engine.assignWeight('Documentation', 50)
      ];
      
      const paths = engine.findCriticalPaths(prs);
      const criticalPath = paths.find(p => p.riskLevel === 'extreme');
      
      expect(criticalPath).toBeDefined();
      expect(criticalPath!.components.length).toBe(3); // Three critical PRs
    });
  });
});
