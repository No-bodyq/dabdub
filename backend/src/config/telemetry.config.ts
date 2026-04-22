import { registerAs } from '@nestjs/config';

export interface TelemetryConfig {
  enabled: boolean;
  serviceName: string;
  collectorUrl: string | null;
  consoleExporter: boolean;
}

export const telemetryConfig = registerAs(
  'telemetry',
  (): TelemetryConfig => ({
    enabled: process.env['OTEL_ENABLED'] === 'true',
    serviceName: process.env['OTEL_SERVICE_NAME'] ?? 'cheese-backend',
    collectorUrl: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ?? null,
    consoleExporter: process.env['OTEL_TRACE_CONSOLE'] === 'true',
  }),
);
