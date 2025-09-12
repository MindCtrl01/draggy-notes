import { BaseCrudApi } from './base-crud-api';

// Health check response types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version?: string;
  services?: {
    database?: ServiceStatus;
    cache?: ServiceStatus;
    storage?: ServiceStatus;
  };
  checks?: HealthCheck[];
}

export interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
  timestamp: string;
}

// Simplified health status for basic checks
export interface SimpleHealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  message?: string;
}

// Health API class - extends BaseCrudApi but primarily uses customRequest for health endpoints
class HealthApi extends BaseCrudApi<any, any, any> {
  constructor() {
    super('health'); // Base path will be /health
  }

  // GET /health - Basic health check
  async healthCheck(): Promise<SimpleHealthResponse> {
    return this.customRequest<SimpleHealthResponse>('');
  }

  // GET /health/detailed - Detailed health check with service status
  async detailedHealthCheck(): Promise<HealthCheckResponse> {
    return this.customRequest<HealthCheckResponse>('/detailed');
  }

  // GET /health/live - Liveness probe (typically for Kubernetes)
  async livenessCheck(): Promise<SimpleHealthResponse> {
    return this.customRequest<SimpleHealthResponse>('/live');
  }

  // GET /health/ready - Readiness probe (typically for Kubernetes)
  async readinessCheck(): Promise<SimpleHealthResponse> {
    return this.customRequest<SimpleHealthResponse>('/ready');
  }

  // GET /health/status - System status check
  async systemStatus(): Promise<HealthCheckResponse> {
    return this.customRequest<HealthCheckResponse>('/status');
  }

  // POST /health/ping - Ping endpoint to test connectivity
  async ping(message?: string): Promise<{ message: string; timestamp: string }> {
    return this.customRequest<{ message: string; timestamp: string }>('/ping', {
      method: 'POST',
      body: message ? JSON.stringify({ message }) : undefined,
    });
  }
}

// Export singleton instance
export const healthApi = new HealthApi();
