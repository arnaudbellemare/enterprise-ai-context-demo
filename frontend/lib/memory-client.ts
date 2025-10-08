/**
 * Memory System Client SDK
 * Easy-to-use TypeScript client for the Enterprise AI Memory System
 */

export interface MemoryAddOptions {
  text: string;
  collection?: string;
  source?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  userId: string;
}

export interface MemorySearchOptions {
  query: string;
  sources?: string[];
  options?: {
    vault?: {
      collection?: string;
      matchThreshold?: number;
      matchCount?: number;
    };
    indexed?: {
      collection?: string;
      source?: string;
      matchThreshold?: number;
      matchCount?: number;
    };
    web?: {
      recencyFilter?: string;
    };
  };
  answer?: boolean;
  answerModel?: string;
  userId: string;
}

export interface UnifiedSearchOptions {
  query: string;
  userId: string;
  sources?: string[];
  mergeStrategy?: 'hybrid' | 'indexed-first' | 'live-first';
  maxResults?: number;
  answer?: boolean;
  answerModel?: string;
}

export interface Document {
  id: string;
  content: string;
  similarity?: number;
  metadata?: Record<string, any>;
  source?: string;
  llm_summary?: string;
}

export interface SearchResponse {
  documents: Document[];
  errors: Array<{ error: string; message: string; source: string }>;
  query: string;
  answer?: string;
  answerModel?: string;
  totalResults: number;
  processingTime: number;
}

export interface CollectionCreateOptions {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  userId: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  memoriesCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export class MemoryClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '/api';
  }

  /**
   * Add a new memory to the vault
   */
  async addMemory(options: MemoryAddOptions): Promise<{ 
    success: boolean; 
    resource_id: string; 
    collection?: string;
    status: string;
  }> {
    const response = await fetch(`${this.baseUrl}/memories/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add memory');
    }

    return response.json();
  }

  /**
   * Search memories across multiple sources
   */
  async searchMemories(options: MemorySearchOptions): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/memories/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search memories');
    }

    return response.json();
  }

  /**
   * Perform indexed vector similarity search
   */
  async indexedSearch(
    query: string,
    userId: string,
    options?: {
      collection?: string;
      source?: string;
      matchThreshold?: number;
      matchCount?: number;
    }
  ): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/search/indexed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        userId,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to perform indexed search');
    }

    return response.json();
  }

  /**
   * Perform unified search (combines indexed + live)
   */
  async unifiedSearch(options: UnifiedSearchOptions): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/search/unified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to perform unified search');
    }

    return response.json();
  }

  /**
   * Generate an answer using multi-model routing
   */
  async generateAnswer(
    query: string,
    documents?: Document[],
    options?: {
      preferredModel?: string;
      autoSelectModel?: boolean;
    }
  ): Promise<{
    answer: string;
    model: string;
    queryType: string;
    processingTime: number;
  }> {
    const response = await fetch(`${this.baseUrl}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        documents,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate answer');
    }

    return response.json();
  }

  /**
   * List available answer models
   */
  async listModels(): Promise<{
    models: Array<{
      name: string;
      provider: string;
      model: string;
      useCase: string;
      speed: string;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/answer`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to list models');
    }

    return response.json();
  }

  /**
   * Create a new collection
   */
  async createCollection(options: CollectionCreateOptions): Promise<{
    success: boolean;
    collection: Collection;
  }> {
    const response = await fetch(`${this.baseUrl}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create collection');
    }

    return response.json();
  }

  /**
   * List all collections for a user
   */
  async listCollections(userId: string): Promise<{
    collections: Collection[];
    total: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/collections?userId=${userId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list collections');
    }

    return response.json();
  }

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/collections?id=${collectionId}&userId=${userId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete collection');
    }

    return response.json();
  }

  /**
   * Update a collection
   */
  async updateCollection(
    id: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<{
    success: boolean;
    collection: Collection;
  }> {
    const response = await fetch(`${this.baseUrl}/collections`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId, ...updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update collection');
    }

    return response.json();
  }

  /**
   * Upload a document for processing
   */
  async uploadDocument(
    file: File,
    userId: string,
    collection?: string
  ): Promise<{
    success: boolean;
    documentId: string;
    status: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    if (collection) {
      formData.append('collection', collection);
    }

    const response = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload document');
    }

    return response.json();
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(text: string | string[]): Promise<{
    embeddings: number[] | number[][];
    model: string;
    dimensions: number;
  }> {
    const response = await fetch(`${this.baseUrl}/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        Array.isArray(text) ? { texts: text } : { text }
      ),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate embeddings');
    }

    return response.json();
  }
}

// Export a default instance
export const memoryClient = new MemoryClient();

// Export convenience functions
export const addMemory = (options: MemoryAddOptions) => 
  memoryClient.addMemory(options);

export const searchMemories = (options: MemorySearchOptions) => 
  memoryClient.searchMemories(options);

export const unifiedSearch = (options: UnifiedSearchOptions) => 
  memoryClient.unifiedSearch(options);

export const generateAnswer = (
  query: string,
  documents?: Document[],
  options?: { preferredModel?: string; autoSelectModel?: boolean }
) => memoryClient.generateAnswer(query, documents, options);

export const createCollection = (options: CollectionCreateOptions) => 
  memoryClient.createCollection(options);

export const listCollections = (userId: string) => 
  memoryClient.listCollections(userId);

export const uploadDocument = (file: File, userId: string, collection?: string) =>
  memoryClient.uploadDocument(file, userId, collection);

