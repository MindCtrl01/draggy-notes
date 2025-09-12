import { useHealthCheck, useSystemStatus, usePing } from '@/hooks';

interface HealthStatusProps {
  showDetailed?: boolean;
  className?: string;
}

export function HealthStatus({ showDetailed = false, className = '' }: HealthStatusProps) {
  const { data: health, isLoading, error, refetch } = useHealthCheck();
  const { data: systemStatus, isLoading: systemLoading } = useSystemStatus({
    enabled: showDetailed,
  });
  const pingMutation = usePing();

  const handlePing = () => {
    pingMutation.mutate('Test ping from UI');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'error':
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'error':
      case 'unhealthy':
        return '❌';
      default:
        return '⚪';
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>❌</span>
            <span className="text-red-800 font-medium">Health Check Failed</span>
          </div>
          <button
            onClick={() => refetch()}
            className="text-red-600 hover:text-red-800 text-sm underline"
          >
            Retry
          </button>
        </div>
        <p className="text-red-600 text-sm mt-1">
          {error.message || 'Unable to connect to server'}
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span>{getStatusIcon(health?.status)}</span>
          <span className={`font-medium ${getStatusColor(health?.status)}`}>
            System {health?.status === 'ok' ? 'Healthy' : health?.status || 'Unknown'}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePing}
            disabled={pingMutation.isPending}
            className="text-blue-600 hover:text-blue-800 text-sm underline disabled:opacity-50"
          >
            {pingMutation.isPending ? 'Pinging...' : 'Ping'}
          </button>
          <button
            onClick={() => refetch()}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {health?.timestamp && (
        <p className="text-gray-500 text-xs">
          Last checked: {new Date(health.timestamp).toLocaleString()}
        </p>
      )}

      {pingMutation.data && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
          <strong>Ping Response:</strong> {pingMutation.data.message}
          <br />
          <span className="text-gray-500">
            {new Date(pingMutation.data.timestamp).toLocaleString()}
          </span>
        </div>
      )}

      {showDetailed && systemStatus && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-700">System Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Overall Status:</span>
              <span className={getStatusColor(systemStatus.status)}>
                {getStatusIcon(systemStatus.status)} {systemStatus.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Uptime:</span>
              <span>{Math.round(systemStatus.uptime / 1000 / 60)} minutes</span>
            </div>
            {systemStatus.version && (
              <div className="flex justify-between">
                <span>Version:</span>
                <span>{systemStatus.version}</span>
              </div>
            )}
          </div>

          {systemStatus.services && (
            <div className="mt-3">
              <h5 className="font-medium text-gray-600 text-sm">Services</h5>
              <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                {Object.entries(systemStatus.services).map(([service, status]) => (
                  <div key={service} className="flex justify-between">
                    <span className="capitalize">{service}:</span>
                    <span className={getStatusColor(status?.status)}>
                      {getStatusIcon(status?.status)} {status?.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {systemLoading && showDetailed && (
        <div className="mt-4 animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      )}
    </div>
  );
}
