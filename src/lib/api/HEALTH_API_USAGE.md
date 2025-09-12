# Health Check API Usage

This document explains how to use the health check API that was created using `customRequest` from the `BaseCrudApi` class.

## 🏥 Health API Overview

The Health API provides various endpoints to monitor the health and status of your application and its services.

## 📋 Available Endpoints

### 1. **Basic Health Check**
```typescript
import { healthApi } from '@/lib/api/health-api';

// GET /health
const health = await healthApi.healthCheck();
// Returns: { status: 'ok' | 'error', timestamp: string, message?: string }
```

### 2. **Detailed Health Check**
```typescript
// GET /health/detailed
const detailedHealth = await healthApi.detailedHealthCheck();
// Returns full HealthCheckResponse with service statuses
```

### 3. **Liveness Check**
```typescript
// GET /health/live - For Kubernetes liveness probes
const liveness = await healthApi.livenessCheck();
```

### 4. **Readiness Check**
```typescript
// GET /health/ready - For Kubernetes readiness probes
const readiness = await healthApi.readinessCheck();
```

### 5. **System Status**
```typescript
// GET /health/status
const systemStatus = await healthApi.systemStatus();
```

### 6. **Ping Endpoint**
```typescript
// POST /health/ping
const pingResponse = await healthApi.ping('Hello from client!');
// Returns: { message: string, timestamp: string }
```

## 🎣 React Query Hooks

### Basic Usage
```typescript
import { useHealthCheck, useSystemStatus, usePing } from '@/hooks';

function MyComponent() {
  // Basic health check with auto-refresh
  const { data, isLoading, error } = useHealthCheck({
    refetchInterval: 30000, // Check every 30 seconds
  });

  // System status with detailed info
  const { data: systemStatus } = useSystemStatus({
    enabled: true,
    refetchInterval: 60000, // Check every minute
  });

  // Ping mutation for testing connectivity
  const pingMutation = usePing();

  const handlePing = () => {
    pingMutation.mutate('Test message');
  };

  return (
    <div>
      <p>Health: {data?.status}</p>
      <button onClick={handlePing}>Ping Server</button>
    </div>
  );
}
```

### Combined Health Status Hook
```typescript
import { useHealthStatus } from '@/hooks';

function HealthDashboard() {
  const {
    basic,
    detailed,
    isHealthy,
    isLoading,
    error,
    refetch
  } = useHealthStatus({
    includeDetailed: true,
    refetchInterval: 30000,
  });

  if (isLoading) return <div>Checking health...</div>;
  if (error) return <div>Health check failed: {error.message}</div>;

  return (
    <div>
      <h2>System Health: {isHealthy ? '✅ Healthy' : '❌ Unhealthy'}</h2>
      <button onClick={refetch}>Refresh</button>
      {/* Display health data */}
    </div>
  );
}
```

## 🧩 Using the Health Status Component

We've also created a ready-to-use `HealthStatus` component:

```typescript
import { HealthStatus } from '@/components/common';

function App() {
  return (
    <div>
      {/* Basic health status */}
      <HealthStatus />
      
      {/* Detailed health status with system info */}
      <HealthStatus 
        showDetailed={true} 
        className="my-custom-class"
      />
    </div>
  );
}
```

## 🏗️ Backend Implementation

Your backend should implement these endpoints:

```typescript
// Example Express.js routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/detailed', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime() * 1000,
    version: '1.0.0',
    services: {
      database: { status: 'healthy', responseTime: 45 },
      cache: { status: 'healthy', responseTime: 12 },
    },
  });
});

app.post('/health/ping', (req, res) => {
  const { message } = req.body;
  res.json({
    message: message || 'pong',
    timestamp: new Date().toISOString(),
  });
});
```

## 🔧 customRequest Implementation

The health API demonstrates how to use `customRequest` from `BaseCrudApi`:

```typescript
class HealthApi extends BaseCrudApi<any, any, any> {
  constructor() {
    super('health'); // Base path: /health
  }

  // GET /health
  async healthCheck(): Promise<SimpleHealthResponse> {
    return this.customRequest<SimpleHealthResponse>('');
  }

  // GET /health/detailed
  async detailedHealthCheck(): Promise<HealthCheckResponse> {
    return this.customRequest<HealthCheckResponse>('/detailed');
  }

  // POST /health/ping
  async ping(message?: string): Promise<{ message: string; timestamp: string }> {
    return this.customRequest<{ message: string; timestamp: string }>('/ping', {
      method: 'POST',
      body: message ? JSON.stringify({ message }) : undefined,
    });
  }
}
```

## 🎯 Key Benefits

1. **Type Safety**: Full TypeScript support with proper response types
2. **React Query Integration**: Automatic caching, background updates, and error handling
3. **Customizable**: Easy to extend with additional health check endpoints
4. **Production Ready**: Includes liveness and readiness probes for Kubernetes
5. **Reusable**: Built on the same `BaseCrudApi` pattern as other APIs

## 🚀 Next Steps

1. Implement the backend health endpoints
2. Add the `HealthStatus` component to your app
3. Configure appropriate refresh intervals based on your needs
4. Set up monitoring dashboards using the detailed health data
