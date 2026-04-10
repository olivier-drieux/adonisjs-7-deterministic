/**
 * grader_prompt.mjs — embedded grader instructions for the eval pipeline.
 *
 * Adapted from skill-creator/agents/grader.md. Versioned here so the grading
 * criteria stay consistent with the skill's own doctrine. The grader is
 * invoked by run_eval.mjs as a `claude -p` subagent after each eval run.
 */

/**
 * Build the full grader prompt for one run.
 *
 * @param {object} opts
 * @param {string} opts.expectations — raw text of eval/expectations/<id>.md
 * @param {string} opts.transcript — raw text of the executor's transcript
 * @param {string} opts.gradingOutputPath — absolute path where the grader must write grading.json
 * @returns {string}
 */
export function buildGraderPrompt({ expectations, transcript, gradingOutputPath }) {
  return `You are a strict grader for an AdonisJS v7 skill evaluation.

## Your task

Read the TRANSCRIPT below, then evaluate every EXPECTATION. Write a grading.json file to the exact path specified at the end.

## Expectations

${expectations}

## Transcript

${transcript}

## Grading rules

For each expectation:
- **PASS**: Clear evidence the expectation is met AND reflects genuine task completion (not surface-level or accidental matching).
- **FAIL**: No evidence, evidence contradicts, unverifiable, or superficially present but empty/meaningless.
- When uncertain, the burden of proof is on the expectation — default to FAIL.

After evaluating expectations, also:
1. Extract 1-3 implicit claims from the transcript (factual, process, or quality) and verify them.
2. Critique the eval itself: flag any assertions that are trivially true regardless of skill quality, or important outcomes that are not measured.

## Output

Write a single JSON file to:
${gradingOutputPath}

The file must follow this exact schema:

\`\`\`json
{
  "expectations": [
    {
      "text": "expectation text",
      "passed": true,
      "evidence": "quote or observation from transcript"
    }
  ],
  "summary": {
    "passed": 0,
    "failed": 0,
    "total": 0,
    "pass_rate": 0.0
  },
  "claims": [
    {
      "claim": "implicit claim from transcript",
      "type": "factual|process|quality",
      "verified": true,
      "evidence": "supporting evidence"
    }
  ],
  "eval_feedback": {
    "suggestions": [
      {
        "assertion": "optional — which expectation",
        "reason": "why it is weak or missing"
      }
    ],
    "overall": "one-sentence assessment"
  }
}
\`\`\`

IMPORTANT:
- Write ONLY the JSON file. Do not output anything else.
- Do not create any other files.
- The pass_rate must be passed / total as a float between 0.0 and 1.0.
- Keep evidence strings concise (under 200 chars).
`
}
