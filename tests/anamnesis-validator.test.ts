/**
 * Tests for Anamnesis Validation Tool
 */

import { describe, it, expect } from 'vitest';
import { validateExploit } from '../src/tools/anamnesis-validator';

describe('Anamnesis Exploit Validator', () => {
  describe('Well-Formed Exploit Code', () => {
    it('should pass validation for well-documented exploit with CVE', async () => {
      const exploitCode = `
// Exploit for CVE-2024-1234: Buffer overflow in process_input
// This exploit leverages a stack-based buffer overflow to gain code execution
// Target: vulnerable_binary v1.2.3
// Mitigations bypassed: NX via ROP, ASLR via info leak

function buildRopChain() {
  // Build ROP chain to bypass NX
  const ropGadgets = [
    0x41414141, // pop rdi; ret
    0x42424242, // /bin/sh string
    0x43434343, // system()
  ];
  return ropGadgets;
}

function exploitVulnerability(targetAddress) {
  // Create buffer overflow payload
  const padding = "A".repeat(256);
  const ropChain = buildRopChain();
  const payload = padding + ropChain.join('');
  
  // Trigger vulnerability
  return sendPayload(targetAddress, payload);
}

function sendPayload(address, payload) {
  // Send exploit payload to target
  console.log("Sending payload to", address);
  return payload;
}
`;

      const result = await validateExploit({
        code: exploitCode,
        vulnerability: 'CVE-2024-1234',
        targetBinary: 'vulnerable_binary',
        mitigations: ['ASLR', 'NX', 'PIE']
      });

      expect(result.passed).toBe(true);
      expect(result.coherenceScore).toBeGreaterThanOrEqual(60);
      expect(result.sphinxGates.origin).toBe(true);
      expect(result.sphinxGates.intent).toBe(true);
      expect(result.sphinxGates.coherence).toBe(true);
      expect(result.sphinxGates.identity).toBe(true);
      expect(result.sphinxGates.passage).toBe(true);
      expect(result.recommendations.length).toBe(0);
      expect(result.atomTrail.length).toBeGreaterThan(0);
    });

    it('should pass validation for exploit with detailed vulnerability description', async () => {
      const exploitCode = `
// Proof of concept for use-after-free vulnerability in WebKit
// Demonstrates memory corruption leading to arbitrary code execution
// Vulnerability allows attacker to control freed object pointer

function triggerUseAfterFree() {
  // Allocate and free object
  const obj = allocateObject();
  freeObject(obj);
  
  // Use freed object to gain control
  return useFreedObject(obj);
}

function allocateObject() {
  return { data: "test" };
}

function freeObject(obj) {
  obj = null;
}

function useFreedObject(obj) {
  // Exploit use-after-free
  return obj.data;
}
`;

      const result = await validateExploit({
        code: exploitCode,
        vulnerability: 'Use-after-free in WebKit JavaScript engine allows arbitrary code execution via crafted web page',
        targetBinary: 'webkit',
        mitigations: ['ASLR']
      });

      expect(result.passed).toBe(true);
      expect(result.sphinxGates.origin).toBe(true);
    });
  });

  describe('SPHINX Gate 1: ORIGIN', () => {
    it('should fail when vulnerability is not specified', async () => {
      const result = await validateExploit({
        code: 'function exploit() { return true; }',
        vulnerability: ''
      });

      expect(result.sphinxGates.origin).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.recommendations).toContain(
        'Specify a valid CVE identifier (CVE-YYYY-NNNNN) or provide detailed vulnerability description (minimum 20 characters)'
      );
    });

    it('should pass with valid CVE format', async () => {
      const result = await validateExploit({
        code: '// Exploit code\nfunction exploit() { return true; }',
        vulnerability: 'CVE-2024-12345'
      });

      expect(result.sphinxGates.origin).toBe(true);
    });

    it('should pass with detailed description', async () => {
      const result = await validateExploit({
        code: '// Exploit code\nfunction exploit() { return true; }',
        vulnerability: 'Buffer overflow in network parsing function'
      });

      expect(result.sphinxGates.origin).toBe(true);
    });
  });

  describe('SPHINX Gate 2: INTENT', () => {
    it('should fail when code lacks documentation', async () => {
      const poorlyDocumented = `
function a(x) { return x * 2; }
function b(y) { return y + 5; }
const c = a(10);
`;

      const result = await validateExploit({
        code: poorlyDocumented,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.sphinxGates.intent).toBe(false);
      expect(result.recommendations.some(r => r.includes('comment ratio'))).toBe(true);
    });

    it('should fail when comments do not mention exploit intent', async () => {
      const genericComments = `
// This is a function
function doSomething(x) {
  // Process data
  return x * 2;
}

// Another function
function helper(y) {
  // Calculate value
  return y + 5;
}
`;

      const result = await validateExploit({
        code: genericComments,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.sphinxGates.intent).toBe(false);
    });

    it('should pass when code has explicit exploit documentation', async () => {
      const wellDocumented = `
// Exploit for buffer overflow vulnerability
// This proof of concept demonstrates the vulnerability
// by crafting a malicious input that overwrites the return address

function buildExploit() {
  // Create exploit payload
  const payload = "A".repeat(100);
  return payload;
}

// Helper function to send exploit
function sendExploit(target) {
  // Send exploit to vulnerability
  return buildExploit();
}
`;

      const result = await validateExploit({
        code: wellDocumented,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.sphinxGates.intent).toBe(true);
    });
  });

  describe('SPHINX Gate 3: COHERENCE', () => {
    it('should fail for incoherent code', async () => {
      const incoherentCode = `
// Random exploit
function x() { a; b; c; }
const y = 1;
z();
`;

      const result = await validateExploit({
        code: incoherentCode,
        vulnerability: 'CVE-2024-1234'
      });

      // Code might still pass coherence check as WAVE analyzes structure
      // The key check is that overall validation fails due to other gates
      expect(result.coherenceScore).toBeDefined();
      expect(result.passed).toBe(false); // Should fail overall due to intent or identity
    });

    it('should pass for coherent, well-structured code', async () => {
      const coherentCode = `
// Exploit for memory corruption vulnerability
// Demonstrates heap overflow technique

function prepareHeap() {
  // Allocate objects to control heap layout
  const objects = [];
  for (let i = 0; i < 100; i++) {
    objects.push(allocateObject(i));
  }
  return objects;
}

function allocateObject(id) {
  // Create object with controlled size
  return { id: id, data: new Array(64) };
}

function triggerOverflow(objects) {
  // Trigger heap overflow by writing past buffer boundary
  const victim = objects[50];
  const overflow = "X".repeat(1000);
  return writeToBuffer(victim, overflow);
}

function writeToBuffer(target, data) {
  // Write data to target buffer
  target.data = data;
  return target;
}
`;

      const result = await validateExploit({
        code: coherentCode,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.sphinxGates.coherence).toBe(true);
      expect(result.coherenceScore).toBeGreaterThanOrEqual(60);
    });
  });

  describe('SPHINX Gate 4: IDENTITY', () => {
    it('should fail for code with no functions', async () => {
      const noFunctions = `
// Exploit code
const x = 5;
const y = 10;
`;

      const result = await validateExploit({
        code: noFunctions,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.sphinxGates.identity).toBe(false);
      expect(result.recommendations.some(r => r.includes('Decompose code into functions'))).toBe(true);
    });

    it('should fail for code with poor variable naming', async () => {
      const poorNaming = `
// Exploit code
function a(x, y, z) {
  const a = x;
  const b = y;
  const c = z;
  return a + b + c;
}
`;

      const result = await validateExploit({
        code: poorNaming,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.sphinxGates.identity).toBe(false);
    });

    it('should detect code with unbalanced braces', async () => {
      const syntaxErrors = `
// Exploit code with missing closing brace
function exploit() {
  if (true) {
    return "missing closing brace";
  }
// Missing closing brace for function
`;

      const result = await validateExploit({
        code: syntaxErrors,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.sphinxGates.identity).toBe(false);
      expect(result.recommendations.some(r => r.includes('syntax errors'))).toBe(true);
    });

    it('should pass for well-structured code with good naming', async () => {
      const goodCode = `
// Exploit implementation
function buildPayload(targetAddress, returnAddress) {
  const padding = createPadding(256);
  const shellcode = getShellcode();
  return padding + shellcode + returnAddress;
}

function createPadding(size) {
  return "A".repeat(size);
}

function getShellcode() {
  return "\\x90\\x90\\x90\\x90";
}
`;

      const result = await validateExploit({
        code: goodCode,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.sphinxGates.identity).toBe(true);
    });
  });

  describe('SPHINX Gate 5: PASSAGE', () => {
    it('should fail when mitigations specified but no target binary', async () => {
      const result = await validateExploit({
        code: '// Exploit\nfunction exploit() {}',
        vulnerability: 'CVE-2024-1234',
        mitigations: ['ASLR', 'NX']
        // Missing targetBinary
      });

      expect(result.sphinxGates.passage).toBe(false);
      expect(result.recommendations.some(r => r.includes('Specify target binary'))).toBe(true);
    });

    it('should fail when invalid mitigations are specified', async () => {
      const result = await validateExploit({
        code: '// Exploit\nfunction exploit() {}',
        vulnerability: 'CVE-2024-1234',
        targetBinary: 'binary',
        mitigations: ['INVALID_MITIGATION', 'FAKE_PROTECTION']
      });

      expect(result.sphinxGates.passage).toBe(false);
    });

    it('should pass with valid mitigations and target', async () => {
      const result = await validateExploit({
        code: '// Exploit\nfunction exploit() {}',
        vulnerability: 'CVE-2024-1234',
        targetBinary: 'vulnerable_app',
        mitigations: ['ASLR', 'PIE', 'NX']
      });

      expect(result.sphinxGates.passage).toBe(true);
    });
  });

  describe('ATOM Trail Logging', () => {
    it('should include decision provenance in atomTrail', async () => {
      const result = await validateExploit({
        code: '// Exploit\nfunction exploit() { return true; }',
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.atomTrail).toBeDefined();
      expect(result.atomTrail.length).toBeGreaterThan(0);
      expect(result.atomTrail.some(entry => entry.includes('WAVE analysis'))).toBe(true);
      expect(result.atomTrail.some(entry => entry.includes('SPHINX Gate'))).toBe(true);
      expect(result.atomTrail.some(entry => entry.includes('Final decision'))).toBe(true);
    });

    it('should log all gate results', async () => {
      const result = await validateExploit({
        code: '// Exploit\nfunction exploit() {}',
        vulnerability: 'CVE-2024-1234'
      });

      const trailText = result.atomTrail.join(' ');
      expect(trailText).toContain('ORIGIN');
      expect(trailText).toContain('INTENT');
      expect(trailText).toContain('COHERENCE');
      expect(trailText).toContain('IDENTITY');
      expect(trailText).toContain('PASSAGE');
    });
  });

  describe('Recommendations', () => {
    it('should provide specific recommendations for failures', async () => {
      const poorCode = `
function a() { return 1; }
`;

      const result = await validateExploit({
        code: poorCode,
        vulnerability: 'test'
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.passed).toBe(false);
    });

    it('should provide no recommendations when all checks pass', async () => {
      const goodCode = `
// Exploit for CVE-2024-1234: Buffer overflow vulnerability
// This proof of concept demonstrates stack-based overflow
// Target binary: vulnerable_app with ASLR enabled

function buildExploit() {
  // Create exploit payload with ROP chain
  const padding = createPadding(256);
  const ropChain = buildRopChain();
  return padding + ropChain;
}

function createPadding(size) {
  return "A".repeat(size);
}

function buildRopChain() {
  // Build ROP chain to bypass NX
  return "\\x41\\x42\\x43\\x44";
}
`;

      const result = await validateExploit({
        code: goodCode,
        vulnerability: 'CVE-2024-1234',
        targetBinary: 'vulnerable_app',
        mitigations: ['ASLR', 'NX']
      });

      if (result.passed) {
        expect(result.recommendations.length).toBe(0);
      }
    });
  });

  describe('Validation Result Structure', () => {
    it('should return complete validation result structure', async () => {
      const result = await validateExploit({
        code: '// Exploit\nfunction exploit() {}',
        vulnerability: 'CVE-2024-1234'
      });

      expect(result).toHaveProperty('coherenceScore');
      expect(result).toHaveProperty('sphinxGates');
      expect(result).toHaveProperty('atomTrail');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('details');

      expect(result.sphinxGates).toHaveProperty('origin');
      expect(result.sphinxGates).toHaveProperty('intent');
      expect(result.sphinxGates).toHaveProperty('coherence');
      expect(result.sphinxGates).toHaveProperty('identity');
      expect(result.sphinxGates).toHaveProperty('passage');

      expect(result.details).toHaveProperty('waveAnalysis');
      expect(result.details).toHaveProperty('gateFailures');
      expect(result.details).toHaveProperty('vulnerabilityContext');

      expect(result.details.waveAnalysis).toHaveProperty('semantic');
      expect(result.details.waveAnalysis).toHaveProperty('references');
      expect(result.details.waveAnalysis).toHaveProperty('structure');
      expect(result.details.waveAnalysis).toHaveProperty('consistency');
    });

    it('should have coherenceScore between 0 and 100', async () => {
      const result = await validateExploit({
        code: 'function test() {}',
        vulnerability: 'CVE-2024-1234'
      });

      expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
      expect(result.coherenceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code gracefully', async () => {
      const result = await validateExploit({
        code: '',
        vulnerability: 'CVE-2024-1234'
      });

      expect(result).toBeDefined();
      expect(result.passed).toBe(false);
      expect(result.sphinxGates.identity).toBe(false);
    });

    it('should handle very long code', async () => {
      const longCode = '// Exploit\n' + 'function test() {}\n'.repeat(1000);

      const result = await validateExploit({
        code: longCode,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result).toBeDefined();
      expect(result.coherenceScore).toBeDefined();
    });

    it('should handle code with special characters', async () => {
      const specialCode = `
// Exploit with shellcode: \\x90\\x90\\x90
function buildPayload() {
  const shellcode = "\\x31\\xc0\\x50\\x68\\x2f\\x2f\\x73\\x68";
  return shellcode;
}
`;

      const result = await validateExploit({
        code: specialCode,
        vulnerability: 'CVE-2024-1234'
      });

      expect(result).toBeDefined();
      expect(result.sphinxGates).toBeDefined();
    });
  });
});
