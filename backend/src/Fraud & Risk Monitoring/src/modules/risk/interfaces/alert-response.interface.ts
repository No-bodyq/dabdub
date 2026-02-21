import { RiskSeverity, AlertStatus } from "../enums";

export interface AlertResponse {
  id: string;
  severity: RiskSeverity;
  type: string;
  message: string;
  affectedTransactionId?: string;
  affectedMerchantId?: string;
  triggeredRuleId: string;
  status: AlertStatus;
  autoActionTaken?: string;
  createdAt: Date;
}
