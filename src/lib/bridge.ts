/**
 * Coherence Bridge Server
 *
 * Implements the WebSocket server that pushes real-time events to the Rust TUI.
 * Follows the Braid protocol: Pulse initiates, Scale responds, Structure observes.
 */

import { WebSocketServer, WebSocket } from "ws";

export interface TelemetryData {
  cpuTemp: number;
  gpuTemp: number;
  powerDraw: number;
  health?: string;
}

export interface CoherenceData {
  pipelineId: string;
  stepId: string;
  waveScore: number;
  alpha: number;
  omega: number;
}

export interface AtomData {
  tag: string;
  type: string;
  phase: string;
  gate: string;
  description: string;
}

export class BridgeServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private port: number = 8088) {}

  start() {
    if (this.wss) return;

    try {
      this.wss = new WebSocketServer({ port: this.port });
      console.error(`[Bridge] WebSocket server started on ws://127.0.0.1:${this.port}`);

      this.wss.on("connection", (ws) => {
        this.clients.add(ws);
        console.error(`[Bridge] TUI client connected. Total clients: ${this.clients.size}`);

        ws.on("close", () => {
          this.clients.delete(ws);
          console.error(`[Bridge] TUI client disconnected. Remaining: ${this.clients.size}`);
        });

        ws.on("error", (err) => {
          console.error(`[Bridge] WebSocket error: ${err.message}`);
          this.clients.delete(ws);
        });

        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            method: "BRIDGE_CONNECTED",
            params: { status: "ready", version: "0.3.2" },
          })
        );
      });

      this.startHeartbeat();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Bridge] Failed to start server: ${msg}`);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.clients.size > 0) {
        this.notifyTelemetry({
          cpuTemp: 45 + Math.random() * 10,
          gpuTemp: 55 + Math.random() * 15,
          powerDraw: 250 + Math.random() * 100,
          health: "nominal",
        });
      }
    }, 5000);
  }

  stop() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  private broadcast(method: string, params: unknown) {
    if (!this.wss || this.clients.size === 0) return;

    const message = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  notifyTelemetry(data: TelemetryData) {
    this.broadcast("TELEMETRY_UPDATE", {
      timestamp: Date.now(),
      sensors: {
        cpu_temp: data.cpuTemp,
        gpu_temp: data.gpuTemp,
        power_draw: data.powerDraw,
      },
      health: data.health || "nominal",
    });
  }

  notifyCoherence(data: CoherenceData) {
    this.broadcast("COHERENCE_UPDATE", {
      pipeline_id: data.pipelineId,
      step_id: data.stepId,
      wave_score: data.waveScore,
      components: {
        lexical_diversity: 0.85 + Math.random() * 0.1,
        curl: 0.02 + Math.random() * 0.05,
        divergence: 0.65 + Math.random() * 0.1,
        potential: 0.88 + Math.random() * 0.05,
        entropy: 2.8 + Math.random() * 0.5,
      },
      conservation: {
        alpha: data.alpha,
        omega: data.omega,
        sum: data.alpha + data.omega,
        valid: data.alpha + data.omega === 15,
      },
    });
  }

  notifyAtom(data: AtomData) {
    this.broadcast("ATOM_EVENT", {
      tag: data.tag,
      type: data.type,
      phase: data.phase,
      gate: data.gate,
      description: data.description,
      timestamp: Date.now(),
    });
  }

  notifyProgress(
    pipelineId: string,
    name: string,
    total: number,
    completed: number,
    step: string
  ) {
    this.broadcast("PIPELINE_PROGRESS", {
      pipeline_id: pipelineId,
      pipeline_name: name,
      total_steps: total,
      completed_steps: completed,
      current_step: step,
      percent: Math.round((completed / total) * 100),
    });
  }
}

export const bridgeServer = new BridgeServer();