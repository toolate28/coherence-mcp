/**
 * Windows SDK Adapter
 *
 * Provides Windows platform integration for coherence-mcp.
 * Supports:
 *   - PowerShell bridge for local MCP tool invocation
 *   - Named-pipe transport for inter-process communication
 *   - .NET (C#) project scaffolding generation
 *
 * Works on Windows systems with PowerShell 5.1+ or pwsh (cross-platform).
 */

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// ---------- types ----------

export interface WindowsConfig {
  powershellPath?: string;
  pipeName?: string;
  timeout?: number;
}

export interface WindowsBridgeResult {
  success: boolean;
  platform: "windows";
  action: string;
  output: string;
  timestamp: string;
}

export interface WindowsScaffold {
  files: Record<string, string>;
  instructions: string;
}

// ---------- constants ----------

const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_PIPE_NAME = "coherence-mcp";

/**
 * Resolve PowerShell executable — prefer pwsh (PS 7+), fall back to powershell (5.1).
 */
function resolveShell(override?: string): string {
  if (override) return override;
  if (process.env.POWERSHELL_PATH) return process.env.POWERSHELL_PATH;
  // pwsh is cross-platform PowerShell 7+
  return process.platform === "win32" ? "powershell.exe" : "pwsh";
}

function resolveConfig(overrides?: Partial<WindowsConfig>): Required<WindowsConfig> {
  return {
    powershellPath: resolveShell(overrides?.powershellPath),
    pipeName: overrides?.pipeName ?? process.env.MCP_PIPE_NAME ?? DEFAULT_PIPE_NAME,
    timeout: overrides?.timeout ?? DEFAULT_TIMEOUT,
  };
}

// ---------- core functions ----------

/**
 * Execute a PowerShell command and return the output.
 */
export async function runPowerShell(
  command: string,
  config?: Partial<WindowsConfig>,
): Promise<WindowsBridgeResult> {
  const cfg = resolveConfig(config);

  try {
    const { stdout } = await execFileAsync(
      cfg.powershellPath,
      ["-NoProfile", "-NonInteractive", "-Command", command],
      { timeout: cfg.timeout },
    );

    return {
      success: true,
      platform: "windows",
      action: "powershell_exec",
      output: stdout.trim(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      platform: "windows",
      action: "powershell_exec",
      output: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Invoke an MCP tool via PowerShell by sending a JSON-RPC request
 * to the coherence-mcp server's named pipe or HTTP endpoint.
 */
export async function invokeToolViaPowerShell(
  toolName: string,
  toolArgs: Record<string, unknown>,
  serverUrl: string = "http://localhost:3000",
  config?: Partial<WindowsConfig>,
): Promise<WindowsBridgeResult> {
  const payload = JSON.stringify({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: { name: toolName, arguments: toolArgs },
  });

  // Use Invoke-RestMethod for HTTP communication
  const psCommand = [
    `$body = '${payload.replace(/'/g, "''")}'`,
    `$result = Invoke-RestMethod -Uri '${serverUrl}' -Method Post -Body $body -ContentType 'application/json'`,
    `$result | ConvertTo-Json -Depth 10`,
  ].join("; ");

  return runPowerShell(psCommand, config);
}

/**
 * Check if coherence-mcp named pipe is available (Windows IPC).
 */
export async function checkNamedPipe(
  config?: Partial<WindowsConfig>,
): Promise<WindowsBridgeResult> {
  const cfg = resolveConfig(config);
  const pipePath = `\\\\.\\pipe\\${cfg.pipeName}`;

  const psCommand = `Test-Path '${pipePath}'`;

  const result = await runPowerShell(psCommand, config);
  return {
    ...result,
    action: "check_named_pipe",
    output: result.output === "True"
      ? `Named pipe '${cfg.pipeName}' is available`
      : `Named pipe '${cfg.pipeName}' is not available`,
  };
}

/**
 * Generate .NET (C#) project scaffold for a Windows coherence-mcp client.
 */
export function generateWindowsScaffold(
  projectName: string = "CoherenceMcpClient",
): WindowsScaffold {
  const files: Record<string, string> = {};

  // .csproj
  files[`${projectName}/${projectName}.csproj`] = `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Library</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="System.Text.Json" Version="8.0.5" />
  </ItemGroup>

</Project>
`;

  // Main client class
  files[`${projectName}/CoherenceMcpClient.cs`] = `using System.Net.Http.Json;
using System.Text.Json;

namespace ${projectName};

/// <summary>
/// .NET client for the coherence-mcp MCP server.
/// Communicates over HTTP/JSON-RPC.
/// </summary>
public class CoherenceMcpClient : IDisposable
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;

    public CoherenceMcpClient(string baseUrl = "http://localhost:3000")
    {
        _baseUrl = baseUrl;
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    /// <summary>
    /// Invoke an MCP tool by name.
    /// </summary>
    public async Task<JsonElement> CallToolAsync(
        string toolName,
        Dictionary<string, object> args)
    {
        var payload = new
        {
            jsonrpc = "2.0",
            id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            method = "tools/call",
            @params = new { name = toolName, arguments = args }
        };

        var response = await _http.PostAsJsonAsync(_baseUrl, payload);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json;
    }

    /// <summary>
    /// List available MCP tools.
    /// </summary>
    public async Task<JsonElement> ListToolsAsync()
    {
        var payload = new
        {
            jsonrpc = "2.0",
            id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            method = "tools/list",
            @params = new { }
        };

        var response = await _http.PostAsJsonAsync(_baseUrl, payload);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public void Dispose() => _http.Dispose();
}
`;

  // Named pipe client for local IPC
  files[`${projectName}/NamedPipeTransport.cs`] = `using System.IO.Pipes;
using System.Text;

namespace ${projectName};

/// <summary>
/// Named-pipe transport for local coherence-mcp IPC on Windows.
/// </summary>
public class NamedPipeTransport : IDisposable
{
    private readonly string _pipeName;
    private NamedPipeClientStream? _pipe;

    public NamedPipeTransport(string pipeName = "coherence-mcp")
    {
        _pipeName = pipeName;
    }

    public async Task ConnectAsync(int timeoutMs = 5000)
    {
        _pipe = new NamedPipeClientStream(".", _pipeName, PipeDirection.InOut);
        await _pipe.ConnectAsync(timeoutMs);
    }

    public async Task<string> SendAsync(string jsonRpc)
    {
        if (_pipe is null || !_pipe.IsConnected)
            throw new InvalidOperationException("Not connected. Call ConnectAsync first.");

        var bytes = Encoding.UTF8.GetBytes(jsonRpc + "\\n");
        await _pipe.WriteAsync(bytes);
        await _pipe.FlushAsync();

        var buffer = new byte[8192];
        var read = await _pipe.ReadAsync(buffer);
        return Encoding.UTF8.GetString(buffer, 0, read);
    }

    public void Dispose() => _pipe?.Dispose();
}
`;

  // PowerShell helper module
  files[`${projectName}/CoherenceMcp.psm1`] = `# CoherenceMcp PowerShell Module
# Usage: Import-Module ./CoherenceMcp.psm1

function Invoke-McpTool {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$ToolName,
        [Parameter(Mandatory)][hashtable]$Arguments,
        [string]$ServerUrl = "http://localhost:3000"
    )

    $payload = @{
        jsonrpc = "2.0"
        id      = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        method  = "tools/call"
        params  = @{ name = $ToolName; arguments = $Arguments }
    } | ConvertTo-Json -Depth 10

    $result = Invoke-RestMethod -Uri $ServerUrl -Method Post -Body $payload -ContentType "application/json"
    return $result
}

function Get-McpTools {
    [CmdletBinding()]
    param(
        [string]$ServerUrl = "http://localhost:3000"
    )

    $payload = @{
        jsonrpc = "2.0"
        id      = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        method  = "tools/list"
        params  = @{}
    } | ConvertTo-Json -Depth 10

    $result = Invoke-RestMethod -Uri $ServerUrl -Method Post -Body $payload -ContentType "application/json"
    return $result
}

Export-ModuleMember -Function Invoke-McpTool, Get-McpTools
`;

  const instructions = [
    "# Windows coherence-mcp Client Setup",
    "",
    "## .NET Client",
    "1. Copy generated C# files into a new .NET project",
    "2. Run: dotnet restore",
    "3. Use CoherenceMcpClient for HTTP or NamedPipeTransport for local IPC",
    "",
    "## PowerShell Module",
    "1. Import the module: Import-Module ./CoherenceMcp.psm1",
    "2. List tools: Get-McpTools",
    "3. Call a tool: Invoke-McpTool -ToolName 'wave_analyze' -Arguments @{ input = 'test' }",
    "",
    "## Prerequisites",
    "- .NET 8.0 SDK (for C# client)",
    "- PowerShell 5.1+ or pwsh 7+ (for PowerShell module)",
    "- coherence-mcp server running on HTTP or named pipe",
  ].join("\n");

  return { files, instructions };
}
