/**
 * useArtifact Hook - Proper Midday AI SDK Tools Implementation
 * Based on: https://github.com/midday-ai/ai-sdk-tools
 */

import { useState, useEffect } from 'react';
import { Artifact } from '@/lib/artifacts';

/**
 * Hook to consume artifact streams in React components
 * Follows Midday's exact pattern for real-time updates
 */
export function useArtifact<T>(artifact: Artifact<T>) {
  const [data, setData] = useState<T | null>(artifact.data);
  const [status, setStatus] = useState(artifact.metadata.status);
  const [progress, setProgress] = useState(artifact.metadata.progress);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial state
    setData(artifact.data);
    setStatus(artifact.metadata.status);
    setProgress(artifact.metadata.progress);

    // Subscribe to updates
    const unsubscribe = artifact.subscribe((updatedArtifact) => {
      setData(updatedArtifact.data);
      setStatus(updatedArtifact.metadata.status);
      setProgress(updatedArtifact.metadata.progress);
      
      if (updatedArtifact.metadata.status === 'error') {
        setError('An error occurred while processing the artifact');
      } else {
        setError(null);
      }
    });

    return unsubscribe;
  }, [artifact.id]);

  return {
    data,
    status,
    progress,
    error,
    isLoading: status === 'loading' || status === 'streaming',
    isComplete: status === 'complete',
    isError: status === 'error'
  };
}

/**
 * Hook for managing multiple artifacts
 */
export function useArtifacts<T>(artifacts: Artifact<T>[]) {
  const [artifactStates, setArtifactStates] = useState<Map<string, {
    data: T | null;
    status: string;
    progress: number;
    error: string | null;
  }>>(new Map());

  useEffect(() => {
    const unsubscribers = artifacts.map(artifact => {
      return artifact.subscribe((updatedArtifact) => {
        setArtifactStates(prev => {
          const newMap = new Map(prev);
          newMap.set(artifact.id, {
            data: updatedArtifact.data,
            status: updatedArtifact.metadata.status,
            progress: updatedArtifact.metadata.progress,
            error: updatedArtifact.metadata.status === 'error' ? 'An error occurred' : null
          });
          return newMap;
        });
      });
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [artifacts.map(a => a.id).join(',')]);

  return artifactStates;
}