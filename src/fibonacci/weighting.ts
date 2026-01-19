/**
 * Fibonacci-based Chaos Weighting Engine
 * 
 * Implements exponential priority weighting using Fibonacci sequence
 * to prioritize critical system components with mathematical precision.
 */

/**
 * Priority levels for components
 */
export type Priority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Component with Fibonacci weight
 */
export interface WeightedComponent {
  name: string;
  fibonacciWeight: number;  // Position in Fibonacci sequence
  impactMultiplier: number; // Actual weight value
  priority: Priority;
}

/**
 * Resource allocation plan
 */
export interface AllocationPlan {
  allocations: Array<{
    component: string;
    allocation: number;
    percentage: number;
  }>;
  totalAllocated: number;
  efficiency: number;
}

/**
 * Critical path in system
 */
export interface CriticalPath {
  components: string[];
  totalWeight: number;
  riskLevel: 'extreme' | 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Golden ratio constant
 */
export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2; // φ ≈ 1.618

/**
 * Round number to two decimal places
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Fibonacci Weighting Engine
 * 
 * Core class for managing Fibonacci-based component prioritization
 */
export class FibonacciWeightingEngine {
  private fibSequence: number[];
  private static readonly MAX_FIBONACCI_POSITION = 10;
  
  constructor() {
    // Pre-calculate Fibonacci sequence up to F(20)
    this.fibSequence = this.generateFibonacci(20);
  }
  
  /**
   * Generate Fibonacci sequence up to n terms
   */
  private generateFibonacci(n: number): number[] {
    if (n <= 0) return [];
    if (n === 1) return [1];
    
    const fib = [1, 1];
    for (let i = 2; i < n; i++) {
      fib.push(fib[i - 1] + fib[i - 2]);
    }
    return fib;
  }
  
  /**
   * Get Fibonacci number at position n (1-indexed)
   */
  getFibonacci(n: number): number {
    if (n < 1) return 0;
    if (n <= this.fibSequence.length) {
      return this.fibSequence[n - 1];
    }
    // Calculate on-demand for larger n
    let a = this.fibSequence[this.fibSequence.length - 2];
    let b = this.fibSequence[this.fibSequence.length - 1];
    for (let i = this.fibSequence.length; i < n; i++) {
      const next = a + b;
      a = b;
      b = next;
    }
    return b;
  }
  
  /**
   * Assign Fibonacci weight to component based on importance
   * 
   * @param componentName - Name of the component
   * @param importance - Importance score (0-100)
   * @returns Weighted component with priority assignment
   */
  assignWeight(componentName: string, importance: number): WeightedComponent {
    // Normalize importance to 0-100 range
    const normalizedImportance = Math.max(0, Math.min(100, importance));
    
    // Map importance to Fibonacci position (1-10)
    // Higher importance = higher Fibonacci position = exponentially greater weight
    // Ensure minimum position of 1 (even for 0 importance)
    const position = Math.max(1, Math.ceil((normalizedImportance / 100) * FibonacciWeightingEngine.MAX_FIBONACCI_POSITION));
    const fibonacciWeight = this.getFibonacci(position);
    
    // Determine priority level
    let priority: Priority;
    if (normalizedImportance >= 85) {
      priority = 'critical';
    } else if (normalizedImportance >= 65) {
      priority = 'high';
    } else if (normalizedImportance >= 40) {
      priority = 'medium';
    } else {
      priority = 'low';
    }
    
    return {
      name: componentName,
      fibonacciWeight: position,
      impactMultiplier: fibonacciWeight,
      priority
    };
  }
  
  /**
   * Calculate impact of component failure
   * 
   * @param component - Weighted component
   * @param degradation - Degradation percentage (0-1)
   * @returns Impact score
   */
  calculateImpact(component: WeightedComponent, degradation: number): number {
    // Impact scales exponentially with Fibonacci weight
    return component.impactMultiplier * degradation;
  }
  
  /**
   * Optimize resource allocation using Fibonacci weights
   * 
   * @param components - List of weighted components
   * @param budget - Total resource budget
   * @returns Optimal allocation plan
   */
  optimizeAllocation(components: WeightedComponent[], budget: number): AllocationPlan {
    if (components.length === 0) {
      return {
        allocations: [],
        totalAllocated: 0,
        efficiency: 0
      };
    }
    
    // Calculate total weight
    const totalWeight = components.reduce((sum, c) => sum + c.impactMultiplier, 0);
    
    // Allocate proportionally to Fibonacci weights
    const allocations = components.map(component => {
      const allocation = (component.impactMultiplier / totalWeight) * budget;
      const percentage = (component.impactMultiplier / totalWeight) * 100;
      
      return {
        component: component.name,
        allocation: roundToTwoDecimals(allocation),
        percentage: roundToTwoDecimals(percentage)
      };
    });
    
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocation, 0);
    
    // Efficiency: how well we used the budget
    const efficiency = (totalAllocated / budget) * 100;
    
    return {
      allocations,
      totalAllocated: roundToTwoDecimals(totalAllocated),
      efficiency: roundToTwoDecimals(efficiency)
    };
  }
  
  /**
   * Find critical paths in system based on weights
   * 
   * @param components - List of weighted components
   * @returns Critical paths sorted by risk level
   */
  findCriticalPaths(components: WeightedComponent[]): CriticalPath[] {
    if (components.length === 0) return [];
    
    // Group by priority
    const critical = components.filter(c => c.priority === 'critical');
    const high = components.filter(c => c.priority === 'high');
    const medium = components.filter(c => c.priority === 'medium');
    const low = components.filter(c => c.priority === 'low');
    
    const paths: CriticalPath[] = [];
    
    // Critical path (all critical components)
    if (critical.length > 0) {
      const totalWeight = critical.reduce((sum, c) => sum + c.impactMultiplier, 0);
      paths.push({
        components: critical.map(c => c.name),
        totalWeight,
        riskLevel: 'extreme',
        description: `Critical path with ${critical.length} components (total weight: ${totalWeight})`
      });
    }
    
    // High priority path
    if (high.length > 0) {
      const totalWeight = high.reduce((sum, c) => sum + c.impactMultiplier, 0);
      paths.push({
        components: high.map(c => c.name),
        totalWeight,
        riskLevel: 'high',
        description: `High priority path with ${high.length} components (total weight: ${totalWeight})`
      });
    }
    
    // Medium priority path
    if (medium.length > 0) {
      const totalWeight = medium.reduce((sum, c) => sum + c.impactMultiplier, 0);
      paths.push({
        components: medium.map(c => c.name),
        totalWeight,
        riskLevel: 'medium',
        description: `Medium priority path with ${medium.length} components (total weight: ${totalWeight})`
      });
    }
    
    // Low priority path
    if (low.length > 0) {
      const totalWeight = low.reduce((sum, c) => sum + c.impactMultiplier, 0);
      paths.push({
        components: low.map(c => c.name),
        totalWeight,
        riskLevel: 'low',
        description: `Low priority path with ${low.length} components (total weight: ${totalWeight})`
      });
    }
    
    return paths;
  }
  
  /**
   * Calculate golden ratio convergence for optimal thresholds
   * 
   * @param baseThreshold - Base threshold value
   * @returns Refined threshold using golden ratio
   */
  refineThresholdWithGoldenRatio(baseThreshold: number): number {
    return roundToTwoDecimals(baseThreshold * GOLDEN_RATIO);
  }
  
  /**
   * Generate priority distribution visualization data
   * 
   * @param components - List of weighted components
   * @returns Visualization data for heatmap
   */
  generatePriorityDistribution(components: WeightedComponent[]): Array<{
    name: string;
    weight: number;
    barLength: number;
    percentage: number;
  }> {
    if (components.length === 0) return [];
    
    // Find max weight for normalization
    const maxWeight = Math.max(...components.map(c => c.impactMultiplier));
    const totalWeight = components.reduce((sum, c) => sum + c.impactMultiplier, 0);
    
    return components.map(component => ({
      name: component.name,
      weight: component.impactMultiplier,
      barLength: Math.round((component.impactMultiplier / maxWeight) * 40), // 40 chars max
      percentage: roundToTwoDecimals((component.impactMultiplier / totalWeight) * 100)
    }));
  }
}

/**
 * Default singleton instance
 */
export const fibonacciEngine = new FibonacciWeightingEngine();
