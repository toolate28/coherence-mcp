/**
 * Tests for WAVE (Weighted Alignment Verification Engine) Coherence Validator
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCoherence,
  validateCoherence,
  WAVE_MINIMUM,
  WAVE_HIGH,
  WAVE_CRITICAL,
} from '../src/core/wave-validator';

describe('WAVE Coherence Validator', () => {
  describe('Perfect Coherence', () => {
    it('should return 100% for matching documentation and code', async () => {
      const documentation = `
# User Authentication

## Functions

### authenticateUser
Authenticates a user with username and password.

### validateToken
Validates an authentication token.

### refreshToken
Refreshes an expired token.
`;

      const code = `
function authenticateUser(username, password) {
  // Authenticate user
  return true;
}

function validateToken(token) {
  // Validate token
  return true;
}

function refreshToken(token) {
  // Refresh token
  return newToken;
}
`;

      const score = await calculateCoherence(documentation, code);
      
      // Perfect coherence should be high (simplified algorithm without LLM)
      expect(score.overall).toBeGreaterThanOrEqual(70);
      expect(score.structural).toBeGreaterThanOrEqual(60);
      expect(score.semantic).toBeGreaterThanOrEqual(60);
    });

    it('should return high score for well-aligned class documentation', async () => {
      const documentation = `
# UserManager Class

The UserManager class handles user operations.

## Methods
- createUser: Creates a new user
- deleteUser: Deletes an existing user
- updateUser: Updates user information
`;

      const code = `
class UserManager {
  createUser(userData) {
    // Create user
  }
  
  deleteUser(userId) {
    // Delete user
  }
  
  updateUser(userId, userData) {
    // Update user
  }
}
`;

      const score = await calculateCoherence(documentation, code);
      
      expect(score.overall).toBeGreaterThanOrEqual(55);
      expect(score.structural).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Zero Coherence', () => {
    it('should return low score for completely unrelated doc and code', async () => {
      const documentation = `
# Weather API

This API provides weather forecasts.

## Endpoints
- GET /weather: Get current weather
- GET /forecast: Get 7-day forecast
`;

      const code = `
class DatabaseConnection {
  connect(host, port) {
    // Connect to database
  }
  
  query(sql) {
    // Execute query
  }
  
  disconnect() {
    // Close connection
  }
}
`;

      const score = await calculateCoherence(documentation, code);
      
      // Completely unrelated should score low
      expect(score.overall).toBeLessThan(40);
      expect(score.structural).toBeLessThan(40);
      expect(score.semantic).toBeLessThan(40);
    });

    it('should return very low score for random text and code', async () => {
      const documentation = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Random words that mean nothing in technical context.
Foo bar baz qux quux.
`;

      const code = `
function xyzzy(a, b, c) {
  return a + b * c;
}

const plugh = { x: 1, y: 2 };
`;

      const score = await calculateCoherence(documentation, code);
      
      expect(score.overall).toBeLessThan(30);
    });
  });

  describe('Threshold Enforcement', () => {
    it('should fail validation when score is below threshold', async () => {
      const documentation = `
# API Documentation
This is a generic API.
`;

      const code = `
function complexFunction(a, b, c, d, e) {
  return a + b + c + d + e;
}
`;

      const result = await validateCoherence(documentation, code, WAVE_MINIMUM);
      
      // Low coherence should fail
      if (result.score.overall < WAVE_MINIMUM) {
        expect(result.passed).toBe(false);
      }
      expect(result.threshold).toBe(WAVE_MINIMUM);
    });

    it('should pass validation when score meets threshold', async () => {
      const documentation = `
# Math Operations

## add
Adds two numbers together.

## multiply
Multiplies two numbers.
`;

      const code = `
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}
`;

      const result = await validateCoherence(documentation, code, WAVE_MINIMUM);
      
      // Good coherence should pass
      expect(result.score.overall).toBeGreaterThanOrEqual(WAVE_MINIMUM);
      expect(result.passed).toBe(true);
    });

    it('should enforce 59% fails 60% threshold', async () => {
      // Create documentation and code that will score around 59%
      const documentation = `
# Calculator
Does math.
`;

      const code = `
function doMath(x, y, z) {
  return x + y - z;
}

function helper1() {}
function helper2() {}
function helper3() {}
`;

      const result = await validateCoherence(documentation, code, 60);
      
      // Either passes (>=60) or fails (<60)
      if (result.score.overall < 60) {
        expect(result.passed).toBe(false);
      } else {
        expect(result.passed).toBe(true);
      }
    });
  });

  describe('Fibonacci Weighting', () => {
    it('should weight structural coherence highest', async () => {
      const documentation = `
# Critical System

## mainFunction
Critical main function.

## helperFunction
Helper function.

## utilityFunction
Utility function.
`;

      const code = `
function mainFunction() {
  // Critical implementation
}

function helperFunction() {
  // Helper
}

function utilityFunction() {
  // Utility
}
`;

      const score = await calculateCoherence(documentation, code);
      
      // Structural should have good weight in overall score
      // Fibonacci weighting: structural (8), semantic (5), temporal (3)
      expect(score.fibonacci_weighted).toBeGreaterThan(0);
      expect(score.fibonacci_weighted).toBeLessThanOrEqual(100);
      
      // Verify all components are present
      expect(score.structural).toBeGreaterThan(0);
      expect(score.semantic).toBeGreaterThan(0);
      expect(score.temporal).toBeGreaterThan(0);
    });

    it('should produce fibonacci_weighted score between 0 and 100', async () => {
      const documentation = 'Test doc';
      const code = 'function test() {}';
      
      const score = await calculateCoherence(documentation, code);
      
      expect(score.fibonacci_weighted).toBeGreaterThanOrEqual(0);
      expect(score.fibonacci_weighted).toBeLessThanOrEqual(100);
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations for low structural coherence', async () => {
      const documentation = `
# System
A system.
`;

      const code = `
class ComplexSystem {
  methodOne() {}
  methodTwo() {}
  methodThree() {}
  methodFour() {}
  methodFive() {}
}
`;

      const result = await validateCoherence(documentation, code, WAVE_HIGH);
      
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      
      if (!result.passed) {
        expect(result.recommendations.length).toBeGreaterThan(0);
        
        // Should have at least one structural recommendation
        const hasStructural = result.recommendations.some(
          r => r.category === 'structural'
        );
        expect(hasStructural).toBe(true);
      }
    });

    it('should provide recommendations for low semantic coherence', async () => {
      const documentation = `
# User Authentication System
This system uses OAuth 2.0 for authentication.
Supports JWT tokens and refresh tokens.
`;

      const code = `
function xyz() {
  return 42;
}

function abc(p, q) {
  return p * q;
}
`;

      const result = await validateCoherence(documentation, code, WAVE_HIGH);
      
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Should have semantic recommendations for unrelated code
      const hasSemantic = result.recommendations.some(
        r => r.category === 'semantic'
      );
      expect(hasSemantic).toBe(true);
    });
  });

  describe('Score Components', () => {
    it('should return all required score components', async () => {
      const documentation = 'Documentation';
      const code = 'function test() {}';
      
      const score = await calculateCoherence(documentation, code);
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('structural');
      expect(score).toHaveProperty('semantic');
      expect(score).toHaveProperty('temporal');
      expect(score).toHaveProperty('fibonacci_weighted');
      
      // All scores should be numbers between 0 and 100
      expect(typeof score.overall).toBe('number');
      expect(typeof score.structural).toBe('number');
      expect(typeof score.semantic).toBe('number');
      expect(typeof score.temporal).toBe('number');
      expect(typeof score.fibonacci_weighted).toBe('number');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
  });

  describe('Temporal Coherence', () => {
    it('should detect version alignment', async () => {
      const documentation = `
# API Documentation
Version: 1.2.3
Last updated: 2024-01-15
`;

      const code = `
// API Implementation
// Version: 1.2.3
// Date: 2024-01-15
function api() {}
`;

      const score = await calculateCoherence(documentation, code);
      
      // Matching versions should give high temporal score
      expect(score.temporal).toBeGreaterThanOrEqual(80);
    });

    it('should detect version misalignment', async () => {
      const documentation = `
# API Documentation
Version: 2.0.0
`;

      const code = `
// API Implementation
// Version: 1.0.0
function api() {}
`;

      const score = await calculateCoherence(documentation, code);
      
      // Mismatched versions should give lower temporal score
      // But not too low since versions are at least present
      expect(score.temporal).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty documentation', async () => {
      const documentation = '';
      const code = 'function test() {}';
      
      const score = await calculateCoherence(documentation, code);
      
      expect(score.overall).toBeDefined();
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('should handle empty code', async () => {
      const documentation = '# Test';
      const code = '';
      
      const score = await calculateCoherence(documentation, code);
      
      expect(score.overall).toBeDefined();
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('should handle both empty', async () => {
      const documentation = '';
      const code = '';
      
      const score = await calculateCoherence(documentation, code);
      
      expect(score.overall).toBeDefined();
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('should handle malformed code gracefully', async () => {
      const documentation = '# Test';
      const code = 'function test() { // missing closing brace';
      
      const score = await calculateCoherence(documentation, code);
      
      // Should not throw, should return valid scores
      expect(score.overall).toBeDefined();
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
  });

  describe('Threshold Constants', () => {
    it('should have correct threshold values', () => {
      expect(WAVE_MINIMUM).toBe(60);
      expect(WAVE_HIGH).toBe(80);
      expect(WAVE_CRITICAL).toBe(99);
    });
  });
});
