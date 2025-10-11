/**
 * AI SDK Tools - Artifact System
 * Inspired by @ai-sdk-tools/artifacts from Midday
 * 
 * Type-safe streaming artifacts for AI workflows
 */

import { z } from 'zod';

export type ArtifactStatus = 'idle' | 'loading' | 'streaming' | 'complete' | 'error';

export interface ArtifactMetadata {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  status: ArtifactStatus;
}

export interface Artifact<T> {
  id: string;
  name: string;
  schema: z.ZodType<T>;
  data: T | null;
  metadata: ArtifactMetadata;
  
  // Streaming methods
  stream: (initial?: Partial<T>) => ArtifactStream<T>;
  update: (data: Partial<T>) => Promise<void>;
  complete: (data?: Partial<T>) => Promise<void>;
  error: (error: Error) => void;
  
  // Subscribers for React hooks
  subscribe: (callback: (artifact: Artifact<T>) => void) => () => void;
}

export interface ArtifactStream<T> {
  update: (data: Partial<T>) => Promise<void>;
  complete: (data?: Partial<T>) => Promise<void>;
  error: (error: Error) => void;
  progress: (value: number) => void;
}

// Global artifact registry
const artifacts = new Map<string, Artifact<any>>();
const subscribers = new Map<string, Set<(artifact: any) => void>>();

/**
 * Create a type-safe artifact definition
 * 
 * @example
 * const WorkflowResult = artifact('workflow-result', z.object({
 *   status: z.string(),
 *   nodes: z.array(z.object({
 *     id: z.string(),
 *     result: z.any()
 *   }))
 * }));
 */
export function artifact<T>(
  name: string,
  schema: z.ZodType<T>
): Artifact<T> {
  const id = `${name}-${Date.now()}`;
  
  const metadata: ArtifactMetadata = {
    id,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 0,
    status: 'idle'
  };

  const artifactInstance: Artifact<T> = {
    id,
    name,
    schema,
    data: null,
    metadata,

    stream(initial?: Partial<T>) {
      metadata.status = 'streaming';
      metadata.progress = 0;
      metadata.updatedAt = new Date();
      
      if (initial) {
        try {
          artifactInstance.data = schema.parse({
            ...artifactInstance.data,
            ...initial
          });
        } catch (error) {
          console.warn('Initial data validation warning:', error);
          artifactInstance.data = initial as T;
        }
      }
      
      notifySubscribers(id);

      return {
        async update(data: Partial<T>) {
          metadata.status = 'streaming';
          metadata.updatedAt = new Date();
          
          try {
            artifactInstance.data = schema.parse({
              ...artifactInstance.data,
              ...data
            });
          } catch (error) {
            console.warn('Update data validation warning:', error);
            artifactInstance.data = {
              ...artifactInstance.data,
              ...data
            } as T;
          }
          
          notifySubscribers(id);
        },

        async complete(data?: Partial<T>) {
          if (data) {
            artifactInstance.data = schema.parse({
              ...artifactInstance.data,
              ...data
            });
          }
          
          metadata.status = 'complete';
          metadata.progress = 1;
          metadata.updatedAt = new Date();
          notifySubscribers(id);
        },

        error(error: Error) {
          metadata.status = 'error';
          metadata.updatedAt = new Date();
          console.error(`Artifact ${name} error:`, error);
          notifySubscribers(id);
        },

        progress(value: number) {
          metadata.progress = Math.max(0, Math.min(1, value));
          metadata.updatedAt = new Date();
          notifySubscribers(id);
        }
      };
    },

    async update(data: Partial<T>) {
      metadata.updatedAt = new Date();
      
      try {
        artifactInstance.data = schema.parse({
          ...artifactInstance.data,
          ...data
        });
      } catch (error) {
        console.warn('Update validation warning:', error);
        artifactInstance.data = {
          ...artifactInstance.data,
          ...data
        } as T;
      }
      
      notifySubscribers(id);
    },

    async complete(data?: Partial<T>) {
      if (data) {
        artifactInstance.data = schema.parse({
          ...artifactInstance.data,
          ...data
        });
      }
      
      metadata.status = 'complete';
      metadata.progress = 1;
      metadata.updatedAt = new Date();
      notifySubscribers(id);
    },

    error(error: Error) {
      metadata.status = 'error';
      metadata.updatedAt = new Date();
      console.error(`Artifact ${name} error:`, error);
      notifySubscribers(id);
    },

    subscribe(callback: (artifact: Artifact<T>) => void) {
      if (!subscribers.has(id)) {
        subscribers.set(id, new Set());
      }
      subscribers.get(id)!.add(callback);
      
      // Return unsubscribe function
      return () => {
        subscribers.get(id)?.delete(callback);
      };
    }
  };

  artifacts.set(id, artifactInstance);
  return artifactInstance;
}

function notifySubscribers(id: string) {
  const subs = subscribers.get(id);
  const art = artifacts.get(id);
  
  if (subs && art) {
    subs.forEach(callback => callback(art));
  }
}

/**
 * Get an existing artifact by ID
 */
export function getArtifact<T>(id: string): Artifact<T> | undefined {
  return artifacts.get(id);
}

/**
 * Clear all artifacts (useful for cleanup)
 */
export function clearArtifacts() {
  artifacts.clear();
  subscribers.clear();
}

