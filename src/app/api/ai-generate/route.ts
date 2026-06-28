/**
 * /api/ai-generate – Next.js Route Handler
 *
 * Server-side proxy for the red-team AI agent. Accepts a defence analysis
 * from the client, calls the Groq-powered agent, and returns generated
 * adversarial prompts. The Groq API key is read from the server environment
 * so it is never exposed to the browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateAdversarialPrompts,
  type DefenseAnalysis,
} from '@/lib/ai-agent';

// ---------------------------------------------------------------------------
// Request body validation
// ---------------------------------------------------------------------------

/** Shape of the expected POST body. */
interface AIGenerateRequestBody {
  defenseAnalysis: DefenseAnalysis;
  count: number;
}

/**
 * Validate and extract the request body fields.
 *
 * @param body - The parsed JSON body from the incoming request.
 * @returns A typed request body or `null` if validation fails.
 */
function validateBody(body: unknown): AIGenerateRequestBody | null {
  if (typeof body !== 'object' || body === null) return null;

  const b = body as Record<string, unknown>;

  // `defenseAnalysis` must be present and have the right shape
  if (typeof b.defenseAnalysis !== 'object' || b.defenseAnalysis === null) {
    return null;
  }

  const da = b.defenseAnalysis as Record<string, unknown>;
  if (
    typeof da.totalAttempts !== 'number' ||
    typeof da.blocked !== 'number' ||
    typeof da.bypassed !== 'number' ||
    !Array.isArray(da.blockedCategories) ||
    !Array.isArray(da.partialSuccesses)
  ) {
    return null;
  }

  // `count` must be a positive integer
  const count = typeof b.count === 'number' ? b.count : 5;
  if (count < 1 || !Number.isInteger(count)) {
    return null;
  }

  return {
    defenseAnalysis: da as unknown as DefenseAnalysis,
    count,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * POST /api/ai-generate
 *
 * Accepts `{ defenseAnalysis, count }`, proxies to the Groq-powered AI agent,
 * and returns the generated attacks (or a refusal with fallback reason).
 */
export async function POST(request: NextRequest) {
  // 1. Check for the server-side API key
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return NextResponse.json(
      {
        error:
          'GROQ_API_KEY is not configured on the server. ' +
          'Please set the GROQ_API_KEY environment variable to enable AI-powered prompt generation.',
      },
      { status: 500 },
    );
  }

  // 2. Parse and validate the request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400 },
    );
  }

  const validated = validateBody(body);
  if (!validated) {
    return NextResponse.json(
      {
        error:
          'Invalid request body. Expected: { defenseAnalysis: { totalAttempts: number, blocked: number, bypassed: number, blockedCategories: string[], partialSuccesses: string[] }, count: number }',
      },
      { status: 400 },
    );
  }

  // 3. Call the AI agent
  try {
    const result = await generateAdversarialPrompts(
      groqApiKey,
      validated.defenseAnalysis,
      validated.count,
    );

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: `AI generation failed: ${message}` },
      { status: 500 },
    );
  }
}
