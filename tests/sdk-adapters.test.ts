/**
 * Tests for Android and Windows SDK Adapters — scaffold generation
 */

import { describe, it, expect } from 'vitest';
import { generateAndroidScaffold } from '../src/adapters/android';
import { generateWindowsScaffold } from '../src/adapters/windows';

describe('Android SDK Adapter', () => {
  describe('generateAndroidScaffold', () => {
    it('should generate scaffold with default package name', () => {
      const scaffold = generateAndroidScaffold();

      expect(scaffold.files).toBeDefined();
      expect(scaffold.instructions).toBeDefined();

      // Should have build.gradle.kts
      expect(scaffold.files['app/build.gradle.kts']).toBeDefined();
      expect(scaffold.files['app/build.gradle.kts']).toContain('org.spiralsafe.coherencemcp');

      // Should have Kotlin client
      const clientKey = Object.keys(scaffold.files).find((k) =>
        k.includes('CoherenceMcpClient.kt'),
      );
      expect(clientKey).toBeDefined();

      // Should have BroadcastReceiver
      const receiverKey = Object.keys(scaffold.files).find((k) =>
        k.includes('McpToolReceiver.kt'),
      );
      expect(receiverKey).toBeDefined();

      // Instructions should mention ADB
      expect(scaffold.instructions).toContain('Android');
      expect(scaffold.instructions).toContain('adb');
    });

    it('should accept custom package name', () => {
      const scaffold = generateAndroidScaffold('com.example.myapp');

      expect(scaffold.files['app/build.gradle.kts']).toContain('com.example.myapp');

      const clientKey = Object.keys(scaffold.files).find((k) =>
        k.includes('CoherenceMcpClient.kt'),
      );
      expect(clientKey).toContain('com/example/myapp');
    });

    it('should generate valid Kotlin code', () => {
      const scaffold = generateAndroidScaffold();
      const clientKey = Object.keys(scaffold.files).find((k) =>
        k.includes('CoherenceMcpClient.kt'),
      )!;
      const client = scaffold.files[clientKey];

      expect(client).toContain('class CoherenceMcpClient');
      expect(client).toContain('suspend fun callTool');
      expect(client).toContain('OkHttpClient');
    });
  });
});

describe('Windows SDK Adapter', () => {
  describe('generateWindowsScaffold', () => {
    it('should generate scaffold with default project name', () => {
      const scaffold = generateWindowsScaffold();

      expect(scaffold.files).toBeDefined();
      expect(scaffold.instructions).toBeDefined();

      // Should have .csproj
      expect(scaffold.files['CoherenceMcpClient/CoherenceMcpClient.csproj']).toBeDefined();
      expect(scaffold.files['CoherenceMcpClient/CoherenceMcpClient.csproj']).toContain(
        'net8.0',
      );

      // Should have C# client
      expect(scaffold.files['CoherenceMcpClient/CoherenceMcpClient.cs']).toBeDefined();
      expect(scaffold.files['CoherenceMcpClient/CoherenceMcpClient.cs']).toContain(
        'CallToolAsync',
      );

      // Should have named pipe transport
      expect(scaffold.files['CoherenceMcpClient/NamedPipeTransport.cs']).toBeDefined();
      expect(scaffold.files['CoherenceMcpClient/NamedPipeTransport.cs']).toContain(
        'NamedPipeClientStream',
      );

      // Should have PowerShell module
      expect(scaffold.files['CoherenceMcpClient/CoherenceMcp.psm1']).toBeDefined();
      expect(scaffold.files['CoherenceMcpClient/CoherenceMcp.psm1']).toContain(
        'Invoke-McpTool',
      );
    });

    it('should accept custom project name', () => {
      const scaffold = generateWindowsScaffold('MyProject');

      expect(scaffold.files['MyProject/MyProject.csproj']).toBeDefined();
      expect(scaffold.files['MyProject/CoherenceMcpClient.cs']).toBeDefined();
    });

    it('should generate valid C# code', () => {
      const scaffold = generateWindowsScaffold();
      const cs = scaffold.files['CoherenceMcpClient/CoherenceMcpClient.cs'];

      expect(cs).toContain('public class CoherenceMcpClient');
      expect(cs).toContain('HttpClient');
      expect(cs).toContain('async Task');
      expect(cs).toContain('IDisposable');
    });

    it('should generate valid PowerShell module', () => {
      const scaffold = generateWindowsScaffold();
      const psm = scaffold.files['CoherenceMcpClient/CoherenceMcp.psm1'];

      expect(psm).toContain('function Invoke-McpTool');
      expect(psm).toContain('function Get-McpTools');
      expect(psm).toContain('Export-ModuleMember');
      expect(psm).toContain('Invoke-RestMethod');
    });

    it('should include setup instructions', () => {
      const scaffold = generateWindowsScaffold();

      expect(scaffold.instructions).toContain('.NET');
      expect(scaffold.instructions).toContain('PowerShell');
      expect(scaffold.instructions).toContain('Import-Module');
    });
  });
});
