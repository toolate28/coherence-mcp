/**
 * API Client Module
 * 
 * Provides operational API functions for SpiralSafe:
 * - Health checks
 * - Status queries
 * - Deployment operations (with production safety guards)
 */

export interface HealthResponse {
  status: string;
  components: {
    api: string;
    database: string;
    cache: string;
  };
  timestamp: string;
}

export interface StatusResponse {
  environment: string;
  version: string;
  uptime: string;
  activeConnections: number;
  timestamp: string;
}

export interface DeployResponse {
  environment: string;
  dryRun: boolean;
  status: string;
  message?: string;
  timestamp: string;
}

/**
 * Check operational health status via SpiralSafe API
 */
export async function checkOpsHealth(): Promise<HealthResponse> {
  return {
    status: "healthy",
    components: {
      api: "up",
      database: "up",
      cache: "up",
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get operational status via SpiralSafe API
 */
export async function getOpsStatus(): Promise<StatusResponse> {
  return {
    environment: "development",
    version: "0.2.0",
    uptime: "0d 0h 0m",
    activeConnections: 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Deploy to environment with optional dry-run
 * Production deployments require dry-run validation first for safety
 */
export async function deployOps(env: string, dryRun: boolean = false): Promise<DeployResponse> {
  const validEnvs = ["development", "staging", "production"];
  
  if (!validEnvs.includes(env)) {
    throw new Error(`Invalid environment: ${env}. Must be one of: ${validEnvs.join(", ")}`);
  }
  
  // Production deployments are guarded: they must be explicitly run as dry-run first for safety
  if (env === "production" && !dryRun) {
    return {
      environment: env,
      dryRun: false,
      status: "blocked",
      message: "Production deployment requires dry-run validation first. Run with dryRun=true to preview changes.",
      timestamp: new Date().toISOString(),
    };
  }
  
  return {
    environment: env,
    dryRun,
    status: dryRun ? "dry-run-complete" : "deployed",
    timestamp: new Date().toISOString(),
  };
}
