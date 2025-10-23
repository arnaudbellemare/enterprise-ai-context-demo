/**
 * WALT Client
 *
 * Node.js client for communicating with the WALT Python bridge service
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  WALTServiceHealth,
  ToolDiscoveryRequest,
  ToolDiscoveryResponse,
  ToolGenerationRequest,
  ToolGenerationResponse,
  ToolListResponse,
  DiscoveredWALTTool,
} from './types';

export class WALTClient {
  private client: AxiosInstance;
  private serviceUrl: string;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(options?: {
    serviceUrl?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }) {
    this.serviceUrl = options?.serviceUrl || process.env.WALT_SERVICE_URL || 'http://localhost:5000';
    this.retryAttempts = options?.retryAttempts || 3;
    this.retryDelay = options?.retryDelay || 1000;

    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout: options?.timeout || 300000, // 5 minutes default
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`🔗 WALT Client initialized: ${this.serviceUrl}`);
  }

  /**
   * Check if WALT service is healthy
   */
  async healthCheck(): Promise<WALTServiceHealth> {
    try {
      const response = await this.client.get<WALTServiceHealth>('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Health check failed');
    }
  }

  /**
   * Discover tools from a website
   */
  async discoverTools(request: ToolDiscoveryRequest): Promise<ToolDiscoveryResponse> {
    console.log(`🔍 Discovering tools from ${request.url}...`);

    try {
      const response = await this.retryRequest(async () => {
        return await this.client.post<ToolDiscoveryResponse>('/discover', request);
      });

      console.log(`✅ Discovered ${response.data.tools_discovered} tools from ${request.url}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Tool discovery failed');
    }
  }

  /**
   * Generate a specific tool from a website
   */
  async generateTool(request: ToolGenerationRequest): Promise<ToolGenerationResponse> {
    console.log(`🔧 Generating tool for "${request.goal}" from ${request.url}...`);

    try {
      const response = await this.retryRequest(async () => {
        return await this.client.post<ToolGenerationResponse>('/generate', request);
      });

      if (response.data.success) {
        console.log(`✅ Generated tool: ${response.data.tool?.name}`);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Tool generation failed');
    }
  }

  /**
   * List all discovered tools
   */
  async listTools(): Promise<ToolListResponse> {
    try {
      const response = await this.client.get<ToolListResponse>('/tools');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list tools');
    }
  }

  /**
   * Get a specific tool
   */
  async getTool(domain: string, toolName: string): Promise<DiscoveredWALTTool> {
    try {
      const response = await this.client.get<{ success: boolean; tool: DiscoveredWALTTool }>(
        `/tools/${domain}/${toolName}`
      );

      if (!response.data.success) {
        throw new Error(`Tool not found: ${domain}/${toolName}`);
      }

      return response.data.tool;
    } catch (error) {
      throw this.handleError(error, 'Failed to get tool');
    }
  }

  /**
   * Delete a tool
   */
  async deleteTool(domain: string, toolName: string): Promise<void> {
    try {
      await this.client.delete(`/tools/${domain}/${toolName}`);
      console.log(`🗑️ Deleted tool: ${domain}/${toolName}`);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete tool');
    }
  }

  /**
   * Retry a request with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<{ data: T }>,
    attempt: number = 0
  ): Promise<{ data: T }> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})...`);
        await this.sleep(delay);
        return this.retryRequest(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown, context: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: string }>;
      const errorMessage = axiosError.response?.data?.error || axiosError.message;
      return new Error(`${context}: ${errorMessage}`);
    }
    return new Error(`${context}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let waltClientInstance: WALTClient | undefined;

/**
 * Get the singleton WALT client instance
 */
export function getWALTClient(): WALTClient {
  if (!waltClientInstance) {
    waltClientInstance = new WALTClient();
  }
  return waltClientInstance;
}

/**
 * Initialize WALT client with custom options
 */
export function initializeWALTClient(options: {
  serviceUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}): void {
  waltClientInstance = new WALTClient(options);
}
