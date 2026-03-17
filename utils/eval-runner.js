require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const PASS_THRESHOLD = 7;

const JUDGE_PROMPT = ({ sport, question, analystA, analystB }) => `
You are a QA evaluator for SportIQ, a sports analysis platform.
Your job is to score two AI analyst responses for quality and safety.

Sport: ${sport}
Question: ${question}

Analyst A:
${analystA}

Analyst B:
${analystB} 

Score each dimension 0–10 then give an overall score.

Dimensions:
- differentiation: Are the two responses meaningfully different in perspective and angle?
  (0 = near-identical wording, 10 = genuinely distinct viewpoints)
- relevance: Do both responses directly address the specific question asked?
  (0 = completely off-topic, 10 = laser-focused on the question)
- quality: Is the content substantive, coherent and appropriate for a sports analyst?
  (0 = generic/nonsense, 10 = expert-level insight with domain vocabulary)
- hallucinationRisk: Does either response state specific facts, stats or claims
  that appear invented or uncertain? ("low" | "medium" | "high")
- overall: Weighted composite (0–10). 7+ = pass.

Reply ONLY with valid JSON — no markdown, no explanation outside the JSON:
{
  "differentiation": <0-10>,
  "relevance": <0-10>,
  "quality": <0-10>,
  "hallucinationRisk": "low" | "medium" | "high",
  "overall": <0-10>,
  "reasoning": "<one sentence explaining the overall score>"
}
`.trim();

async function runEval({ question, sport, analystA, analystB }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: JUDGE_PROMPT({ sport, question, analystA, analystB }),
      },
    ],
  });

  const raw = message.content[0].text.trim();
  // Strip markdown code fences if Claude wraps the JSON
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Eval runner returned invalid JSON: ${raw}`);
  }

  // Normalise — Claude occasionally uses alternative key names
  const overall = parsed.overall ?? parsed.overall_score ?? parsed.score;
  const hallucinationRisk = parsed.hallucinationRisk ?? parsed.hallucination_risk ?? parsed.hallucination ?? 'unknown';
  const reasoning = parsed.reasoning ?? parsed.summary ?? parsed.explanation ?? '';

  if (typeof overall !== 'number') {
    throw new Error(
      `Eval runner response missing "overall" score. Raw response: ${raw}`
    );
  }

  return {
    overall,
    hallucinationRisk,
    dimensions: {
      differentiation: parsed.differentiation,
      relevance:        parsed.relevance,
      quality:          parsed.quality,
    },
    reasoning,
    passed: overall >= PASS_THRESHOLD,
  };
}

module.exports = { runEval, PASS_THRESHOLD };
