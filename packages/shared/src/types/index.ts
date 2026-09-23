export type AppEnvironment = 'development' | 'production';
export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  time: string;
}
