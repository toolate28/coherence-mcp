/**
 * Android SDK Adapter
 *
 * Provides Android platform integration for coherence-mcp.
 * Supports:
 *   - ADB bridge for communicating with connected Android devices
 *   - Intent-based MCP tool invocation from Android apps
 *   - Kotlin/Java project scaffolding generation
 *
 * This adapter generates Android-compatible payloads and can execute
 * MCP tool calls over ADB when a device is connected.
 *
 * Requires `adb` on PATH for device communication.
 */

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// ---------- types ----------

export interface AndroidConfig {
  adbPath?: string;
  deviceId?: string;
  packageName?: string;
  timeout?: number;
}

export interface AndroidBridgeResult {
  success: boolean;
  platform: "android";
  action: string;
  output: string;
  deviceId?: string;
  timestamp: string;
}

export interface AndroidScaffold {
  files: Record<string, string>;
  instructions: string;
}

// ---------- constants ----------

const DEFAULT_ADB = "adb";
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_PACKAGE = "org.spiralsafe.coherencemcp";

// ---------- helpers ----------

function resolveConfig(overrides?: Partial<AndroidConfig>): Required<AndroidConfig> {
  return {
    adbPath: overrides?.adbPath ?? process.env.ADB_PATH ?? DEFAULT_ADB,
    deviceId: overrides?.deviceId ?? process.env.ANDROID_DEVICE_ID ?? "",
    packageName: overrides?.packageName ?? DEFAULT_PACKAGE,
    timeout: overrides?.timeout ?? DEFAULT_TIMEOUT,
  };
}

async function runAdb(
  args: string[],
  config: Required<AndroidConfig>,
): Promise<string> {
  const cmdArgs = config.deviceId ? ["-s", config.deviceId, ...args] : args;

  try {
    const { stdout } = await execFileAsync(config.adbPath, cmdArgs, {
      timeout: config.timeout,
    });
    return stdout.trim();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`ADB command failed: ${msg}`);
  }
}

// ---------- core functions ----------

/**
 * List connected Android devices via ADB.
 */
export async function listDevices(
  config?: Partial<AndroidConfig>,
): Promise<AndroidBridgeResult> {
  const cfg = resolveConfig(config);

  try {
    const output = await runAdb(["devices", "-l"], cfg);
    return {
      success: true,
      platform: "android",
      action: "list_devices",
      output,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      platform: "android",
      action: "list_devices",
      output: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Send an MCP tool invocation to an Android app via ADB broadcast intent.
 *
 * The receiving Android app should register a BroadcastReceiver for:
 *   action: org.spiralsafe.coherencemcp.TOOL_INVOKE
 *   extras: tool (string), args (JSON string)
 */
export async function sendToolIntent(
  toolName: string,
  toolArgs: Record<string, unknown>,
  config?: Partial<AndroidConfig>,
): Promise<AndroidBridgeResult> {
  const cfg = resolveConfig(config);
  const action = `${cfg.packageName}.TOOL_INVOKE`;
  const argsJson = JSON.stringify(toolArgs);

  try {
    const output = await runAdb(
      [
        "shell",
        "am",
        "broadcast",
        "-a",
        action,
        "--es",
        "tool",
        toolName,
        "--es",
        "args",
        `'${argsJson}'`,
      ],
      cfg,
    );
    return {
      success: true,
      platform: "android",
      action: "send_intent",
      output,
      deviceId: cfg.deviceId || undefined,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      platform: "android",
      action: "send_intent",
      output: error instanceof Error ? error.message : String(error),
      deviceId: cfg.deviceId || undefined,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generate Kotlin project scaffold for an Android coherence-mcp client.
 */
export function generateAndroidScaffold(
  packageName?: string,
): AndroidScaffold {
  const pkg = packageName ?? DEFAULT_PACKAGE;
  const pkgPath = pkg.replace(/\./g, "/");

  const files: Record<string, string> = {};

  // build.gradle.kts
  files["app/build.gradle.kts"] = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${pkg}"
    compileSdk = 35

    defaultConfig {
        applicationId = "${pkg}"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    buildFeatures { viewBinding = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.google.code.gson:gson:2.11.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
}
`;

  // Main Activity
  files[`app/src/main/java/${pkgPath}/MainActivity.kt`] = `package ${pkg}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var mcpClient: CoherenceMcpClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        mcpClient = CoherenceMcpClient(
            baseUrl = "http://10.0.2.2:3000" // host loopback from emulator
        )
    }
}
`;

  // MCP Client
  files[`app/src/main/java/${pkgPath}/CoherenceMcpClient.kt`] = `package ${pkg}

import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Android client for coherence-mcp MCP server.
 * Communicates over HTTP/JSON-RPC.
 */
class CoherenceMcpClient(
    private val baseUrl: String,
    timeoutSeconds: Long = 30
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(timeoutSeconds, TimeUnit.SECONDS)
        .readTimeout(timeoutSeconds, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val jsonType = "application/json".toMediaType()

    /**
     * Invoke an MCP tool by name with the given arguments.
     */
    suspend fun callTool(
        toolName: String,
        args: Map<String, Any>
    ): ToolResult = withContext(Dispatchers.IO) {
        val payload = mapOf(
            "jsonrpc" to "2.0",
            "id" to System.currentTimeMillis(),
            "method" to "tools/call",
            "params" to mapOf("name" to toolName, "arguments" to args)
        )

        val body = gson.toJson(payload).toRequestBody(jsonType)
        val request = Request.Builder()
            .url(baseUrl)
            .post(body)
            .build()

        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: "{}"
        gson.fromJson(responseBody, ToolResult::class.java)
    }

    data class ToolResult(
        val id: Long = 0,
        val result: Map<String, Any>? = null,
        val error: Map<String, Any>? = null
    )
}
`;

  // BroadcastReceiver for intent-based invocation
  files[`app/src/main/java/${pkgPath}/McpToolReceiver.kt`] = `package ${pkg}

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Receives MCP tool invocations via Android broadcast intents.
 * Register in AndroidManifest.xml with action: ${pkg}.TOOL_INVOKE
 */
class McpToolReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val toolName = intent.getStringExtra("tool") ?: return
        val argsJson = intent.getStringExtra("args") ?: "{}"
        Log.d("CoherenceMCP", "Tool invocation: \$toolName args=\$argsJson")
        // Delegate to CoherenceMcpClient in a coroutine scope
    }
}
`;

  const instructions = [
    "# Android coherence-mcp Client Setup",
    "",
    "1. Copy generated files into a new Android Studio project",
    "2. Add internet permission to AndroidManifest.xml:",
    '   <uses-permission android:name="android.permission.INTERNET" />',
    "3. Register the BroadcastReceiver in AndroidManifest.xml:",
    `   <receiver android:name=".McpToolReceiver" android:exported="true">`,
    "     <intent-filter>",
    `       <action android:name="${pkg}.TOOL_INVOKE" />`,
    "     </intent-filter>",
    "   </receiver>",
    "4. Start the coherence-mcp server with HTTP transport",
    "5. For emulator: server at http://10.0.2.2:3000",
    "6. For device: use adb reverse tcp:3000 tcp:3000",
  ].join("\n");

  return { files, instructions };
}
