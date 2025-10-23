/**
 * Unified WALT Client
 *
 * Supports both Python backend (sfr-walt) and TypeScript native (Playwright)
 * Automatically falls back to TypeScript if Python service is unavailable
 */

import { WALTClient } from './client';
import { getNativeWALTDiscovery } from './native-discovery';
import {
  ToolDiscoveryRequest,
  ToolDiscoveryResponse,
  ToolGenerationRequest,
  ToolGenerationResponse,
  DiscoveredWALTTool,
} from './types';

export type WALTBackend = 'python' | 'typescript' | 'auto';

export interface UnifiedWALTOptions {
  backend?: WALTBackend;
  pythonServiceUrl?: string;
  timeout?: number;
}

export class UnifiedWALTClient {
  private pythonClient?: WALTClient;
  private nativeDiscovery = getNativeWALTDiscovery();
  private activeBackend: 'python' | 'typescript' = 'typescript';
  private backendPreference: WALTBackend;
  private pythonAvailable: boolean = false;

  constructor(options?: UnifiedWALTOptions) {
    this.backendPreference = options?.backend || 'auto';

    // Initialize Python client if requested
    if (this.backendPreference === 'python' || this.backendPreference === 'auto') {
      this.pythonClient = new WALTClient({
        serviceUrl: options?.pythonServiceUrl,
        timeout: options?.timeout,
      });
    }

    console.log(`🔗 Unified WALT Client initialized (preference: ${this.backendPreference})`);
  }

  /**
   * Initialize and check which backend is available
   */
  async initialize(): Promise<void> {
    if (this.backendPreference === 'typescript') {
      this.activeBackend = 'typescript';
      console.log('✅ Using TypeScript-native backend (forced)');
      return;
    }

    if (this.backendPreference === 'python') {
      this.activeBackend = 'python';
      console.log('✅ Using Python backend (forced)');
      return;
    }

    // Auto mode: try Python, fall back to TypeScript
    if (this.pythonClient) {
      try {
        const health = await this.pythonClient.healthCheck();
        if (health.status === 'healthy') {
          this.pythonAvailable = true;
          this.activeBackend = 'python';
          console.log('✅ Python backend available and healthy');
          return;
        }
      } catch (error: any) {
        console.log('⚠️ Python backend not available, using TypeScript native');
      }
    }

    this.activeBackend = 'typescript';
    console.log('✅ Using TypeScript-native backend (fallback)');
  }

  /**
   * Discover tools from a website
   */
  async discoverTools(request: ToolDiscoveryRequest): Promise<ToolDiscoveryResponse> {
    // Ensure initialized
    if (this.backendPreference === 'auto' && !this.pythonAvailable && !this.activeBackend) {
      await this.initialize();
    }

    if (this.activeBackend === 'python' && this.pythonClient) {
      try {
        return await this.pythonClient.discoverTools(request);
      } catch (error: any) {
        console.warn(`⚠️ Python backend failed, falling back to TypeScript:`, error.message);
        // Fall back to TypeScript
        this.activeBackend = 'typescript';
      }
    }

    // Use TypeScript native backend
    return await this.discoverToolsNative(request);
  }

  /**
   * Discover tools using TypeScript native implementation
   */
  private async discoverToolsNative(request: ToolDiscoveryRequest): Promise<ToolDiscoveryResponse> {
    const result = await this.nativeDiscovery.discoverTools({
      url: request.url,
      goal: request.goal,
      maxTools: request.max_tools || 10,
      headless: request.headless !== false,
    });

    const domain = new URL(request.url).hostname.replace('www.', '').split('.')[0];

    return {
      success: true,
      url: request.url,
      domain,
      tools_discovered: result.tools.length,
      tools: result.tools as any,
      output_dir: '',
    } as ToolDiscoveryResponse;
  }

  /**
   * Generate a specific tool from a website
   */
  async generateTool(request: ToolGenerationRequest): Promise<ToolGenerationResponse> {
    if (this.activeBackend === 'python' && this.pythonClient) {
      try {
        return await this.pythonClient.generateTool(request);
      } catch (error: any) {
        console.warn(`⚠️ Python backend failed, falling back to TypeScript:`, error.message);
        this.activeBackend = 'typescript';
      }
    }

    // Use TypeScript native backend
    return await this.generateToolNative(request);
  }

  /**
   * Generate a specific tool using TypeScript native
   */
  private async generateToolNative(request: ToolGenerationRequest): Promise<ToolGenerationResponse> {
    // Use discovery to find tools matching the goal
    const result = await this.nativeDiscovery.discoverTools({
      url: request.url,
      goal: request.goal,
      maxTools: 1,
      headless: request.headless !== false,
    });

    if (result.tools.length === 0) {
      return {
        success: false,
        url: request.url,
        goal: request.goal,
        error: 'No tools found matching the goal',
      };
    }

    return {
      success: true,
      url: request.url,
      goal: request.goal,
      tool: result.tools[0] as any,
    } as ToolGenerationResponse;
  }

  /**
   * Get the currently active backend
   */
  getActiveBackend(): 'python' | 'typescript' {
    return this.activeBackend;
  }

  /**
   * Check if Python backend is available
   */
  isPythonAvailable(): boolean {
    return this.pythonAvailable;
  }

  /**
   * Force switch backend (for testing)
   */
  async switchBackend(backend: 'python' | 'typescript'): Promise<void> {
    if (backend === 'python' && !this.pythonClient) {
      throw new Error('Python client not initialized');
    }

    if (backend === 'python') {
      // Verify Python service is available
      try {
        await this.pythonClient!.healthCheck();
        this.activeBackend = 'python';
        this.pythonAvailable = true;
        console.log('✅ Switched to Python backend');
      } catch (error) {
        throw new Error('Python backend not available');
      }
    } else {
      this.activeBackend = 'typescript';
      console.log('✅ Switched to TypeScript backend');
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.nativeDiscovery.cleanup();
  }
}

// Singleton instance
let instance: UnifiedWALTClient | undefined;

export function getUnifiedWALTClient(options?: UnifiedWALTOptions): UnifiedWALTClient {
  if (!instance) {
    instance = new UnifiedWALTClient(options);
  }
  return instance;
}
