export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  severity: string;
  message: string;
}
