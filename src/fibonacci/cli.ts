/**
 * CLI utilities for Fibonacci weighting commands
 */

import { FibonacciWeightingEngine, WeightedComponent, GOLDEN_RATIO } from './weighting.js';
import fs from 'fs/promises';

const engine = new FibonacciWeightingEngine();

/**
 * Assign Fibonacci weight to a component
 */
export async function assignCommand(componentName: string, importance: number): Promise<void> {
  const component = engine.assignWeight(componentName, importance);
  
  console.log('\n=== Fibonacci Weight Assignment ===');
  console.log(`Component: ${component.name}`);
  console.log(`Importance: ${importance}/100`);
  console.log(`Fibonacci Position: F(${component.fibonacciWeight})`);
  console.log(`Impact Multiplier: ${component.impactMultiplier}`);
  console.log(`Priority: ${component.priority.toUpperCase()}`);
  console.log('===================================\n');
}

/**
 * Optimize resource allocation
 */
export async function optimizeCommand(componentsFile: string, budget: number): Promise<void> {
  // Load components from JSON file
  const data = await fs.readFile(componentsFile, 'utf-8');
  const componentsData = JSON.parse(data);
  
  // Convert to WeightedComponent objects
  const components: WeightedComponent[] = componentsData.components.map((c: any) => 
    engine.assignWeight(c.name, c.importance)
  );
  
  const plan = engine.optimizeAllocation(components, budget);
  
  console.log('\n=== Resource Optimization Plan ===');
  console.log(`Total Budget: ${budget}`);
  console.log(`Total Allocated: ${plan.totalAllocated}`);
  console.log(`Efficiency: ${plan.efficiency}%`);
  console.log('\nAllocations:');
  
  plan.allocations.forEach(alloc => {
    console.log(`  ${alloc.component.padEnd(25)} ${alloc.allocation.toFixed(2).padStart(8)} (${alloc.percentage.toFixed(1)}%)`);
  });
  
  console.log('===================================\n');
}

/**
 * Generate text-based visualization of priority distribution
 */
export async function visualizeCommand(inputFile: string, outputFile?: string): Promise<void> {
  // Load weights from JSON file
  const data = await fs.readFile(inputFile, 'utf-8');
  const weightsData = JSON.parse(data);
  
  // Convert to WeightedComponent objects
  const components: WeightedComponent[] = weightsData.components.map((c: any) => 
    engine.assignWeight(c.name, c.importance)
  );
  
  const distribution = engine.generatePriorityDistribution(components);
  
  let output = '\n=== Priority Distribution (Fibonacci Weighted) ===\n\n';
  
  distribution.forEach(item => {
    const bar = '█'.repeat(item.barLength);
    output += `${item.name.padEnd(25)} [${bar.padEnd(40)}] (${item.weight}) ${item.percentage.toFixed(1)}%\n`;
  });
  
  output += '\n===================================================\n';
  
  console.log(output);
  
  if (outputFile) {
    await fs.writeFile(outputFile, output, 'utf-8');
    console.log(`\nVisualization saved to: ${outputFile}\n`);
  }
}

/**
 * Refine threshold using golden ratio
 */
export async function refineCommand(threshold: number, method: string = 'golden-ratio'): Promise<void> {
  if (method !== 'golden-ratio') {
    console.error('Error: Only golden-ratio method is currently supported');
    process.exit(1);
  }
  
  const refined = engine.refineThresholdWithGoldenRatio(threshold);
  
  console.log('\n=== Threshold Refinement ===');
  console.log(`Method: Golden Ratio (φ = ${GOLDEN_RATIO.toFixed(3)})`);
  console.log(`Base Threshold: ${threshold}`);
  console.log(`Refined Threshold: ${refined}`);
  console.log(`Multiplier: ${(refined / threshold).toFixed(3)}x`);
  console.log('============================\n');
}

/**
 * Display critical paths
 */
export async function criticalPathsCommand(componentsFile: string): Promise<void> {
  const data = await fs.readFile(componentsFile, 'utf-8');
  const componentsData = JSON.parse(data);
  
  const components: WeightedComponent[] = componentsData.components.map((c: any) => 
    engine.assignWeight(c.name, c.importance)
  );
  
  const paths = engine.findCriticalPaths(components);
  
  console.log('\n=== Critical Paths Analysis ===\n');
  
  paths.forEach((path, index) => {
    console.log(`Path ${index + 1}: ${path.riskLevel.toUpperCase()}`);
    console.log(`Total Weight: ${path.totalWeight}`);
    console.log(`Description: ${path.description}`);
    console.log(`Components: ${path.components.join(', ')}`);
    console.log('');
  });
  
  console.log('================================\n');
}
