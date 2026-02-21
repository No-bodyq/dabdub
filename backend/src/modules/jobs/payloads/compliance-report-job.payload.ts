export interface ComplianceReportJobPayload {
  reportId: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  requestedByAdminId: string;
  correlationId?: string;
}
