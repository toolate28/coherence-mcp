import { gateIntentionToExecution } from './lib/gate-transitions.js';
import { validateWAVE } from './wave/validator.js';
import fs from 'fs/promises';

async function runPreFlight() {
  console.log('--- Pre-Flight Alignment (Gate-Sync) ---');

  console.log('\n[1] Environment Check');
  const envExists = await fs.access('.env').then(() => true).catch(() => false);
  console.log('  .env exists: ' + (envExists ? '✅' : '❌'));

  console.log('\n[2] WAVE Coherence: Orchestrator Core');
  try {
    const corePath = 'orchestrator/crates/core/src/orchestrator.rs';
    const content = await fs.readFile(corePath, 'utf-8');
    const result = await validateWAVE(content, 80);
    console.log('  Score: ' + result.overall + '% ' + (result.overall >= 80 ? '✅' : '⚠️'));
  } catch (e) {
    console.log('  Skip: Orchestrator core not found or unreadable (' + e.message + ')');
  }

  console.log('\n[3] Gate Alignment: Intention to Execution (AWI -> ATOM)');
  try {
    const result = await gateIntentionToExecution({
      scope: 'TUI ignition',
      justification: 'Unitary branch synchronization complete, v3.0.0 manifest.',
      preconditionsMet: true
    });
    console.log('  Status: ' + result.status.toUpperCase() + ' ' + (result.status === 'passed' ? '✅' : '❌'));
    if (result.failedChecks.length > 0) {
      console.log('  Failed Checks:');
      result.failedChecks.forEach(c => console.log('    - ' + c));
    }
  } catch (e) {
    console.log('  Error: ' + e.message);
  }

  // 4. Cleanroom Scour: Contrarian Audit
  console.log('\n[4] Cleanroom Scour: Contrarian Audit (Grok Patch)');
  try {
    const { auditNode } = await import('./lib/cleanroom.js');
    
    // Test 1: Signature Match
    const res1 = auditNode('Implementing SpiralSafe logic for the core.');
    console.log('  Signature Match: ' + (res1.action === 'INTEGRATE' ? '✅' : '❌'));
    
    // Test 2: Structural DNA
    const res2 = auditNode('class StateVector: pass # qubit logic');
    console.log('  Structural DNA:  ' + (res2.action === 'INTEGRATE' ? '✅' : '❌'));
    
    // Test 3: Legacy Archive
    const res3 = auditNode('Random legacy text with no core value.');
    console.log('  Legacy Archive:  ' + (res3.action === 'SCRUB_AND_ARCHIVE' ? '✅' : '❌'));
  } catch (e) {
    console.log('  Error: ' + e.message);
  }

  console.log('\n--- Pre-Flight Complete ---');
}

runPreFlight().catch(console.error);
