/**
 * Shared storage for email classification examples
 * In production, replace with database
 */

import { FewShotExample } from './email-template-classifier';

// In-memory storage (replace with database in production)
let examplesStore: Array<FewShotExample & { timestamp: string }> = [];

export function getExamples(userId?: string, templateId?: string, limit: number = 50): FewShotExample[] {
  let examples = [...examplesStore];

  // Filter by user
  if (userId) {
    examples = examples.filter(ex => ex.userId === userId);
  }

  // Filter by template
  if (templateId) {
    examples = examples.filter(ex => ex.template === templateId);
  }

  // Sort by timestamp (newest first) and limit
  examples = examples
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return examples.map(({ timestamp, ...ex }) => ex);
}

export function addExample(example: FewShotExample): void {
  examplesStore.push({
    ...example,
    timestamp: new Date().toISOString()
  });
}

export function updateExample(email: string, example: FewShotExample, userId?: string): boolean {
  const index = examplesStore.findIndex(
    ex => ex.email === email && (!userId || ex.userId === userId)
  );
  
  if (index >= 0) {
    examplesStore[index] = {
      ...example,
      timestamp: new Date().toISOString()
    };
    return true;
  }
  
  return false;
}

export function deleteExample(email: string, userId?: string): number {
  const initialLength = examplesStore.length;
  examplesStore = examplesStore.filter(
    ex => ex.email !== email && (!userId || ex.userId === userId)
  );
  return initialLength - examplesStore.length;
}

export function clearExamples(userId?: string): number {
  const initialLength = examplesStore.length;
  examplesStore = userId
    ? examplesStore.filter(ex => ex.userId !== userId)
    : [];
  return initialLength - examplesStore.length;
}

export function getAllExamples(): Array<FewShotExample & { timestamp: string }> {
  return [...examplesStore];
}

