import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthApi, HealthCheckResponse, SimpleHealthResponse } from '@/lib/api/health-api';

// Query keys for health API
export const healthQueryKeys = {
  all: ['health'] as const,
  healthCheck: () => ['health', 'check'] as const,
  detailed: () => ['health', 'detailed'] as const,
  liveness: () => ['health', 'liveness'] as const,
  readiness: () => ['health', 'readiness'] as const,
  status: () => ['health', 'status'] as const,
};

// Basic health check hook
export function useHealthCheck(options?: {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}) {
  return useQuery({
    queryKey: healthQueryKeys.healthCheck(),
    queryFn: () => healthApi.healthCheck(),
    staleTime: options?.staleTime ?? 30000, // 30 seconds
    refetchInterval: options?.refetchInterval ?? 60000, // 1 minute
    enabled: options?.enabled ?? true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Detailed health check hook
export function useDetailedHealthCheck(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: healthQueryKeys.detailed(),
    queryFn: () => healthApi.detailedHealthCheck(),
    staleTime: 15000, // 15 seconds
    refetchInterval: options?.refetchInterval ?? 30000, // 30 seconds
    enabled: options?.enabled ?? true,
    retry: 2,
  });
}

// Liveness check hook (typically used for monitoring)
export function useLivenessCheck(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: healthQueryKeys.liveness(),
    queryFn: () => healthApi.livenessCheck(),
    staleTime: 10000, // 10 seconds
    refetchInterval: options?.refetchInterval ?? 15000, // 15 seconds
    enabled: options?.enabled ?? true,
    retry: 1,
  });
}

// Readiness check hook (typically used for load balancers)
export function useReadinessCheck(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: healthQueryKeys.readiness(),
    queryFn: () => healthApi.readinessCheck(),
    staleTime: 10000, // 10 seconds
    refetchInterval: options?.refetchInterval ?? 20000, // 20 seconds
    enabled: options?.enabled ?? true,
    retry: 2,
  });
}

// System status hook
export function useSystemStatus(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: healthQueryKeys.status(),
    queryFn: () => healthApi.systemStatus(),
    staleTime: 20000, // 20 seconds
    refetchInterval: options?.refetchInterval ?? 45000, // 45 seconds
    enabled: options?.enabled ?? true,
    retry: 2,
  });
}

// Ping mutation hook (for testing connectivity)
export function usePing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message?: string) => healthApi.ping(message),
    onSuccess: () => {
      // Invalidate health queries on successful ping
      queryClient.invalidateQueries({ queryKey: healthQueryKeys.all });
    },
  });
}

// Combined health status hook (combines basic + detailed)
export function useHealthStatus(options?: {
  enabled?: boolean;
  includeDetailed?: boolean;
  refetchInterval?: number;
}) {
  const basicHealth = useHealthCheck({
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });

  const detailedHealth = useDetailedHealthCheck({
    enabled: options?.enabled && options?.includeDetailed,
    refetchInterval: options?.refetchInterval,
  });

  return {
    basic: basicHealth,
    detailed: detailedHealth,
    isHealthy: basicHealth.data?.status === 'ok' && 
               (!detailedHealth.data || detailedHealth.data?.status === 'healthy'),
    isLoading: basicHealth.isLoading || (options?.includeDetailed && detailedHealth.isLoading),
    error: basicHealth.error || detailedHealth.error,
    refetch: () => {
      basicHealth.refetch();
      if (options?.includeDetailed) {
        detailedHealth.refetch();
      }
    },
  };
}
