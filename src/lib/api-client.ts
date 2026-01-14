/**
 * SpiralSafe API Client
 *
 * Connects to real SpiralSafe API endpoints for ops health, status, and deploy
 * Base URL: https://api.spiralsafe.org
 */

/**
 * Default API base URL for SpiralSafe operations
 * Can be overridden via environment variables or function parameters
 */
export const DEFAULT_API_BASE_URL = 'https://api.spiralsafe.org';

export interface OpsHealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  components: {
    api: 'up' | 'down';
    database?: 'up' | 'down';
    cache?: 'up' | 'down';
    [key: string]: string | undefined;
  };
  timestamp: string;
  responseTime?: number;
}

export interface OpsStatusResponse {
  environment: string;
  version: string;
  uptime: string;
  activeConnections: number;
  timestamp: string;
}

export interface OpsDeployResponse {
  environment: string;
  dryRun: boolean;
  status: 'deployed' | 'dry-run-complete' | 'blocked' | 'failed';
  message?: string;
  timestamp: string;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Check operational health
 */
export async function checkOpsHealth(
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<OpsHealthResponse> {
  const startTime = Date.now();

  try {
    const response = await fetchWithTimeout(`${baseUrl}/health`, {}, 5000);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        status: data.status || 'healthy',
        components: data.components || {
          api: 'up',
        },
        timestamp: new Date().toISOString(),
        responseTime,
      };
    } else {
      // API responded but with error status
      return {
        status: 'degraded',
        components: {
          api: 'down',
        },
        timestamp: new Date().toISOString(),
        responseTime,
      };
    }
  } catch (error) {
    // Network error or timeout
    return {
      status: 'down',
      components: {
        api: 'down',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get operational status
 */
export async function getOpsStatus(
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<OpsStatusResponse> {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/status`, {}, 5000);

    if (response.ok) {
      const data = await response.json();
      return {
        environment: data.environment || 'unknown',
        version: data.version || '0.0.0',
        uptime: data.uptime || '0d 0h 0m',
        activeConnections: data.activeConnections || 0,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Return fallback status
      return {
        environment: 'unknown',
        version: '0.0.0',
        uptime: '0d 0h 0m',
        activeConnections: 0,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    // Return fallback status on error
    return {
      environment: 'offline',
      version: '0.0.0',
      uptime: '0d 0h 0m',
      activeConnections: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Deploy to environment
 */
export async function deployOps(
  env: string,
  dryRun: boolean,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<OpsDeployResponse> {
  const validEnvs = ['development', 'staging', 'production'];

  if (!validEnvs.includes(env)) {
    return {
      environment: env,
      dryRun,
      status: 'failed',
      message: `Invalid environment: ${env}. Must be one of: ${validEnvs.join(', ')}`,
      timestamp: new Date().toISOString(),
    };
  }

  // Production safety guard
  if (env === 'production' && !dryRun) {
    return {
      environment: env,
      dryRun: false,
      status: 'blocked',
      message:
        'Production deployment requires dry-run validation first. Run with dryRun=true to preview changes.',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${baseUrl}/deploy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environment: env,
          dryRun,
        }),
      },
      10000
    );

    if (response.ok) {
      const data = await response.json();
      return {
        environment: env,
        dryRun,
        status: data.status || (dryRun ? 'dry-run-complete' : 'deployed'),
        message: data.message,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        environment: env,
        dryRun,
        status: 'failed',
        message: `Deploy failed with status ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      environment: env,
      dryRun,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Network error',
      timestamp: new Date().toISOString(),
    };
  }
}
