import type {DeterministicRule} from "./types";

export type AuthoredAnswerRule={
  rule:DeterministicRule;
  rationale:string;
  source:string;
};

/**
 * Deliberately empty until an answer rule is authored and verified.
 * Keys must match EvidenceDefinition.key exactly:
 *   unitId::promptId::slot
 *
 * This prevents the platform from silently treating inferred or guessed
 * answers as authoritative marking rules.
 */
export const AUTHORED_ANSWER_RULES:Record<string,AuthoredAnswerRule>={};

export function authoredAnswerRule(key:string){
  return AUTHORED_ANSWER_RULES[key];
}
