/**
 * fuzzer.ts
 *
 * NeuralBreach – 3-Tier Fuzzer Engine
 * Tier 1: Static payloads (105 entries)
 * Tier 2: Mutation engine (deterministic transforms)
 * Tier 3: AI red-team agent (Groq-powered adaptive generation)
 */

import payloadsData from './payloads.json';
import { generateMutationBatch, type MutatedPayload } from './mutation-engine';
import { sendToTarget, type TargetConfig, type TargetResponse } from './target-adapters';
import { RateLimiter } from './rate-limiter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Payload {
  id: number;
  name: string;
  category: string;
  severity: string;
  payload: string;
}

export interface AttackResult {
  payload: Payload;
  status: 'defended' | 'vulnerable' | 'error' | 'pending' | 'in-progress';
  response: string;
  timestamp: number;
  duration: number;
  /** Which tier generated this attack */
  tier: 1 | 2 | 3;
  /** Mutation details (Tier 2 only) */
  mutation?: MutatedPayload;
  /** AI technique label (Tier 3 only) */
  aiTechnique?: string;
}

/** Which execution tiers to run */
export type FuzzerMode = 'static' | 'mutations' | 'ai-adaptive' | 'full';

export interface FuzzerConfig {
  /** Target AI configuration */
  target: TargetConfig;
  /** Delay between attacks in ms */
  delayMs: number;
  /** Which tiers to execute */
  mode: FuzzerMode;
  /** How many mutations to generate per base payload (Tier 2) */
  mutationsPerPayload: number;
  /** How many AI-generated attacks to request (Tier 3) */
  aiAttackCount: number;
}

export interface FuzzerCallbacks {
  onLog: (message: string, type: 'system' | 'attack' | 'result-defended' | 'result-vulnerable' | 'result-error' | 'info' | 'warning') => void;
  onAttackComplete: (result: AttackResult, index: number, total: number) => void;
  onTierStart: (tier: 1 | 2 | 3, label: string) => void;
  onComplete: (results: AttackResult[]) => void;
  /** Check if the user aborted */
  shouldAbort: () => boolean;
}

// ---------------------------------------------------------------------------
// Exported payloads
// ---------------------------------------------------------------------------

export const payloads: Payload[] = payloadsData as Payload[];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Format a number as a zero-padded string */
function pad(n: number, width: number = 3): string {
  return String(n).padStart(width, '0');
}

// ---------------------------------------------------------------------------
// Tier 1: Static Payloads
// ---------------------------------------------------------------------------

async function runTier1(
  config: FuzzerConfig,
  callbacks: FuzzerCallbacks,
  results: AttackResult[],
  limiter: RateLimiter,
  startIndex: number,
  totalAttacks: number,
): Promise<number> {
  callbacks.onTierStart(1, 'Static Payload Library');
  callbacks.onLog(`> [TIER 1] Loaded ${payloads.length} static payloads`, 'system');

  let idx = startIndex;

  for (const p of payloads) {
    if (callbacks.shouldAbort()) break;

    await limiter.waitForSlot();
    callbacks.onLog(`> [ATTACK ${pad(idx + 1)}] [T1] ${p.name} [${p.category}] [${p.severity.toUpperCase()}]`, 'attack');

    const start = performance.now();
    const response: TargetResponse = await sendToTarget(config.target, p.payload);
    const duration = Math.round(performance.now() - start);

    const result: AttackResult = {
      payload: p,
      status: response.status === 'error' ? 'error' : response.status === 'defended' ? 'defended' : response.status === 'vulnerable' ? 'vulnerable' : 'error',
      response: response.response,
      timestamp: Date.now(),
      duration,
      tier: 1,
    };

    if (response.statusCode === 429) {
      limiter.reportRateLimit();
      callbacks.onLog(`> [RATE LIMIT] 429 detected — backing off`, 'warning');
    } else {
      limiter.reportSuccess();
    }

    results.push(result);

    const icon = result.status === 'defended' ? '🟢 DEFENDED' : result.status === 'vulnerable' ? '🔴 VULNERABLE' : '⚠ ERROR';
    callbacks.onLog(`> [RESULT] ${icon} (${duration}ms)`, result.status === 'defended' ? 'result-defended' : result.status === 'vulnerable' ? 'result-vulnerable' : 'result-error');
    callbacks.onAttackComplete(result, idx, totalAttacks);
    idx++;

    if (!callbacks.shouldAbort()) {
      await delay(config.delayMs);
    }
  }

  return idx;
}

// ---------------------------------------------------------------------------
// Tier 2: Mutation Engine
// ---------------------------------------------------------------------------

async function runTier2(
  config: FuzzerConfig,
  callbacks: FuzzerCallbacks,
  results: AttackResult[],
  limiter: RateLimiter,
  startIndex: number,
  totalAttacks: number,
): Promise<number> {
  callbacks.onTierStart(2, 'Mutation Engine');

  // Pick a subset of base payloads to mutate (top severity first)
  const criticalPayloads = payloads.filter(p => p.severity === 'critical');
  const highPayloads = payloads.filter(p => p.severity === 'high');
  const basesToMutate = [...criticalPayloads, ...highPayloads].slice(0, 15);

  const totalMutations = basesToMutate.length * config.mutationsPerPayload;
  callbacks.onLog(`> [TIER 2] Generating ${totalMutations} mutations from ${basesToMutate.length} high-severity payloads`, 'system');

  let idx = startIndex;

  for (const base of basesToMutate) {
    if (callbacks.shouldAbort()) break;

    const mutations = generateMutationBatch(base.payload, config.mutationsPerPayload);

    for (const mutation of mutations) {
      if (callbacks.shouldAbort()) break;

      await limiter.waitForSlot();

      const mutatedPayload: Payload = {
        id: 1000 + idx,
        name: `${base.name}_mutated_${mutation.strategy}`,
        category: `${base.category} (Mutated)`,
        severity: base.severity,
        payload: mutation.mutated,
      };

      callbacks.onLog(`> [ATTACK ${pad(idx + 1)}] [T2] ${base.name} → ${mutation.strategy} [${mutation.mutations[0]}]`, 'attack');

      const start = performance.now();
      const response = await sendToTarget(config.target, mutation.mutated);
      const duration = Math.round(performance.now() - start);

      const result: AttackResult = {
        payload: mutatedPayload,
        status: response.status === 'error' ? 'error' : response.status === 'defended' ? 'defended' : response.status === 'vulnerable' ? 'vulnerable' : 'error',
        response: response.response,
        timestamp: Date.now(),
        duration,
        tier: 2,
        mutation,
      };

      if (response.statusCode === 429) {
        limiter.reportRateLimit();
        callbacks.onLog(`> [RATE LIMIT] 429 detected — backing off`, 'warning');
      } else {
        limiter.reportSuccess();
      }

      results.push(result);

      const icon = result.status === 'defended' ? '🟢 DEFENDED' : result.status === 'vulnerable' ? '🔴 VULNERABLE' : '⚠ ERROR';
      callbacks.onLog(`> [RESULT] ${icon} (${duration}ms)`, result.status === 'defended' ? 'result-defended' : result.status === 'vulnerable' ? 'result-vulnerable' : 'result-error');
      callbacks.onAttackComplete(result, idx, totalAttacks);
      idx++;

      if (!callbacks.shouldAbort()) {
        await delay(config.delayMs);
      }
    }
  }

  return idx;
}

// ---------------------------------------------------------------------------
// Tier 3: AI Red-Team Agent
// ---------------------------------------------------------------------------

async function runTier3(
  config: FuzzerConfig,
  callbacks: FuzzerCallbacks,
  results: AttackResult[],
  limiter: RateLimiter,
  startIndex: number,
  totalAttacks: number,
): Promise<number> {
  callbacks.onTierStart(3, 'AI Red-Team Agent');
  callbacks.onLog(`> [TIER 3] Contacting Groq AI agent for ${config.aiAttackCount} novel attacks...`, 'system');

  // Build defense analysis from prior results
  const blocked = results.filter(r => r.status === 'defended').length;
  const bypassed = results.filter(r => r.status === 'vulnerable').length;
  const blockedCategories = [...new Set(results.filter(r => r.status === 'defended').map(r => r.payload.category))];
  const partialSuccesses = results.filter(r => r.status === 'vulnerable').map(r => r.payload.name).slice(0, 10);

  try {
    const response = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        defenseAnalysis: {
          totalAttempts: results.length,
          blocked,
          bypassed,
          blockedCategories,
          partialSuccesses,
        },
        count: config.aiAttackCount,
      }),
    });

    const data = await response.json();

    if (data.error) {
      callbacks.onLog(`> [TIER 3] API error: ${data.error}`, 'warning');
      callbacks.onLog(`> [TIER 3] Falling back to mutation engine...`, 'warning');
      return await runTier3Fallback(config, callbacks, results, limiter, startIndex, totalAttacks);
    }

    if (data.refused) {
      callbacks.onLog(`> [TIER 3] AI agent refused: ${data.fallbackReason}`, 'warning');
      callbacks.onLog(`> [TIER 3] Falling back to mutation engine...`, 'warning');
      return await runTier3Fallback(config, callbacks, results, limiter, startIndex, totalAttacks);
    }

    const attacks = data.attacks || [];
    if (attacks.length === 0) {
      callbacks.onLog(`> [TIER 3] No attacks generated. Falling back to mutation engine...`, 'warning');
      return await runTier3Fallback(config, callbacks, results, limiter, startIndex, totalAttacks);
    }

    callbacks.onLog(`> [TIER 3] AI generated ${attacks.length} novel attack prompts`, 'system');

    let idx = startIndex;
    for (const attack of attacks) {
      if (callbacks.shouldAbort()) break;

      await limiter.waitForSlot();

      const aiPayload: Payload = {
        id: 2000 + idx,
        name: `AI_${attack.technique?.replace(/\s+/g, '_') || 'Unknown'}`,
        category: 'AI Generated',
        severity: 'critical',
        payload: attack.prompt,
      };

      callbacks.onLog(`> [ATTACK ${pad(idx + 1)}] [T3] AI: ${attack.technique || 'Novel Prompt'} — ${attack.reasoning || ''}`, 'attack');

      const start = performance.now();
      const targetResponse = await sendToTarget(config.target, attack.prompt);
      const duration = Math.round(performance.now() - start);

      const result: AttackResult = {
        payload: aiPayload,
        status: targetResponse.status === 'error' ? 'error' : targetResponse.status === 'defended' ? 'defended' : targetResponse.status === 'vulnerable' ? 'vulnerable' : 'error',
        response: targetResponse.response,
        timestamp: Date.now(),
        duration,
        tier: 3,
        aiTechnique: attack.technique,
      };

      if (targetResponse.statusCode === 429) {
        limiter.reportRateLimit();
        callbacks.onLog(`> [RATE LIMIT] 429 detected — backing off`, 'warning');
      } else {
        limiter.reportSuccess();
      }

      results.push(result);

      const icon = result.status === 'defended' ? '🟢 DEFENDED' : result.status === 'vulnerable' ? '🔴 VULNERABLE' : '⚠ ERROR';
      callbacks.onLog(`> [RESULT] ${icon} (${duration}ms)`, result.status === 'defended' ? 'result-defended' : result.status === 'vulnerable' ? 'result-vulnerable' : 'result-error');
      callbacks.onAttackComplete(result, idx, totalAttacks);
      idx++;

      if (!callbacks.shouldAbort()) {
        await delay(config.delayMs);
      }
    }

    return idx;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    callbacks.onLog(`> [TIER 3] Network error: ${msg}`, 'warning');
    callbacks.onLog(`> [TIER 3] Falling back to mutation engine...`, 'warning');
    return await runTier3Fallback(config, callbacks, results, limiter, startIndex, totalAttacks);
  }
}

/**
 * Fallback: When Groq refuses or errors out, generate extra mutations instead.
 */
async function runTier3Fallback(
  config: FuzzerConfig,
  callbacks: FuzzerCallbacks,
  results: AttackResult[],
  limiter: RateLimiter,
  startIndex: number,
  totalAttacks: number,
): Promise<number> {
  callbacks.onLog(`> [FALLBACK] Generating ${config.aiAttackCount} chain-mutated attacks instead`, 'system');

  // Pick random critical payloads and heavily chain-mutate them
  const critical = payloads.filter(p => p.severity === 'critical');
  let idx = startIndex;

  for (let i = 0; i < config.aiAttackCount && i < critical.length; i++) {
    if (callbacks.shouldAbort()) break;

    const base = critical[i % critical.length];
    const mutations = generateMutationBatch(base.payload, 1);
    const mutation = mutations[0];

    await limiter.waitForSlot();

    const fallbackPayload: Payload = {
      id: 3000 + idx,
      name: `Fallback_Chain_${base.name}`,
      category: `${base.category} (AI Fallback)`,
      severity: 'critical',
      payload: mutation.mutated,
    };

    callbacks.onLog(`> [ATTACK ${pad(idx + 1)}] [T3-FB] Chain mutation of ${base.name}`, 'attack');

    const start = performance.now();
    const response = await sendToTarget(config.target, mutation.mutated);
    const duration = Math.round(performance.now() - start);

    const result: AttackResult = {
      payload: fallbackPayload,
      status: response.status === 'error' ? 'error' : response.status === 'defended' ? 'defended' : response.status === 'vulnerable' ? 'vulnerable' : 'error',
      response: response.response,
      timestamp: Date.now(),
      duration,
      tier: 3,
      mutation,
      aiTechnique: 'chain-mutation-fallback',
    };

    results.push(result);
    const icon = result.status === 'defended' ? '🟢 DEFENDED' : result.status === 'vulnerable' ? '🔴 VULNERABLE' : '⚠ ERROR';
    callbacks.onLog(`> [RESULT] ${icon} (${duration}ms)`, result.status === 'defended' ? 'result-defended' : result.status === 'vulnerable' ? 'result-vulnerable' : 'result-error');
    callbacks.onAttackComplete(result, idx, totalAttacks);
    idx++;

    if (!callbacks.shouldAbort()) {
      await delay(config.delayMs);
    }
  }

  return idx;
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

/**
 * Run the NeuralBreach fuzzer with the specified mode and configuration.
 *
 * @param config    - Fuzzer configuration (target, mode, delay, etc.)
 * @param callbacks - Event callbacks for UI updates
 * @returns All attack results
 */
export async function runFuzzer(
  config: FuzzerConfig,
  callbacks: FuzzerCallbacks,
): Promise<AttackResult[]> {
  const results: AttackResult[] = [];

  // Calculate total expected attacks
  let totalAttacks = 0;
  const runStatic = config.mode === 'static' || config.mode === 'mutations' || config.mode === 'full';
  const runMutations = config.mode === 'mutations' || config.mode === 'full';
  const runAI = config.mode === 'ai-adaptive' || config.mode === 'full';

  if (runStatic) totalAttacks += payloads.length;
  if (runMutations) {
    const basesToMutate = payloads.filter(p => p.severity === 'critical' || p.severity === 'high').slice(0, 15);
    totalAttacks += basesToMutate.length * config.mutationsPerPayload;
  }
  if (runAI) totalAttacks += config.aiAttackCount;

  // Initialize rate limiter
  const limiter = new RateLimiter({
    baseDelayMs: 50,
    maxDelayMs: 30000,
    batchSize: 20,
    batchCooldownMs: 3000,
  });

  callbacks.onLog('> [SYSTEM] NeuralBreach v2.0 — AI Vulnerability Fuzzer', 'system');
  callbacks.onLog(`> [SYSTEM] Mode: ${config.mode.toUpperCase()}`, 'system');
  callbacks.onLog(`> [SYSTEM] Target: ${config.target.provider} (${config.target.model || 'default'})`, 'system');
  callbacks.onLog(`> [SYSTEM] Expected attacks: ~${totalAttacks}`, 'system');
  callbacks.onLog('> [SYSTEM] ═══════════════════════════════════════════', 'system');

  let currentIndex = 0;

  // -- Tier 1: Static --
  if (runStatic && !callbacks.shouldAbort()) {
    currentIndex = await runTier1(config, callbacks, results, limiter, currentIndex, totalAttacks);
    callbacks.onLog('', 'info');
  }

  // -- Tier 2: Mutations --
  if (runMutations && !callbacks.shouldAbort()) {
    callbacks.onLog('> [SYSTEM] ═══════════════════════════════════════════', 'system');
    currentIndex = await runTier2(config, callbacks, results, limiter, currentIndex, totalAttacks);
    callbacks.onLog('', 'info');
  }

  // -- Tier 3: AI Agent --
  if (runAI && !callbacks.shouldAbort()) {
    callbacks.onLog('> [SYSTEM] ═══════════════════════════════════════════', 'system');
    currentIndex = await runTier3(config, callbacks, results, limiter, currentIndex, totalAttacks);
    callbacks.onLog('', 'info');
  }

  // -- Summary --
  callbacks.onLog('> [SYSTEM] ═══════════════════════════════════════════', 'system');
  callbacks.onLog('> [SYSTEM] Attack sequence complete.', 'system');

  const defended = results.filter(r => r.status === 'defended').length;
  const vulnerable = results.filter(r => r.status === 'vulnerable').length;
  const errors = results.filter(r => r.status === 'error').length;

  callbacks.onLog(`> [REPORT] Total: ${results.length} | Defended: ${defended} | Vulnerable: ${vulnerable} | Errors: ${errors}`, 'system');

  if (vulnerable > 0) {
    callbacks.onLog(`> [CRITICAL] ⚠ ${vulnerable} vulnerabilities detected!`, 'warning');
  } else {
    callbacks.onLog('> [REPORT] ✓ All attacks blocked. Target appears secure.', 'result-defended');
  }

  callbacks.onComplete(results);
  return results;
}
