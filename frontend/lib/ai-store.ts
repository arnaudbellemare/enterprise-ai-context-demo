/**
 * AI Store - Proper Midday AI SDK Tools Implementation
 * Based on: https://github.com/midday-ai/ai-sdk-tools
 * 
 * Zustand-based state management for AI chat and workflows
 * Eliminates prop drilling within chat components
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tool?: string;
    confidence?: number;
    processingTime?: number;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    status?: 'pending' | 'running' | 'completed' | 'error';
    result?: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  status: 'idle' | 'running' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  tools: Array<{
    name: string;
    description: string;
    status: 'pending' | 'active' | 'completed';
  }>;
  workflow: Workflow;
  confidence: number;
  estimatedTime: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AIStoreState {
  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  // Workflows
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;

  // Agents
  agents: Agent[];
  currentAgent: Agent | null;
  createAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  setCurrentAgent: (agent: Agent | null) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  error: string | null;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

export const useAIStore = create<AIStoreState>()(
  devtools(
    (set, get) => ({
      // Messages
      messages: [],
      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };
        
        set((state) => ({
          messages: [...state.messages, newMessage]
        }));
      },
      
      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map(msg => 
            msg.id === id ? { ...msg, ...updates } : msg
          )
        }));
      },
      
      clearMessages: () => {
        set({ messages: [] });
      },

      // Workflows
      workflows: [],
      currentWorkflow: null,
      
      createWorkflow: (workflow) => {
        const newWorkflow: Workflow = {
          ...workflow,
          id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          workflows: [...state.workflows, newWorkflow],
          currentWorkflow: newWorkflow
        }));
      },
      
      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map(workflow =>
            workflow.id === id 
              ? { ...workflow, ...updates, updatedAt: new Date() }
              : workflow
          ),
          currentWorkflow: state.currentWorkflow?.id === id
            ? { ...state.currentWorkflow, ...updates, updatedAt: new Date() }
            : state.currentWorkflow
        }));
      },
      
      setCurrentWorkflow: (workflow) => {
        set({ currentWorkflow: workflow });
      },

      // Agents
      agents: [],
      currentAgent: null,
      
      createAgent: (agent) => {
        const newAgent: Agent = {
          ...agent,
          id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          agents: [...state.agents, newAgent],
          currentAgent: newAgent
        }));
      },
      
      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map(agent =>
            agent.id === id 
              ? { ...agent, ...updates, updatedAt: new Date() }
              : agent
          ),
          currentAgent: state.currentAgent?.id === id
            ? { ...state.currentAgent, ...updates, updatedAt: new Date() }
            : state.currentAgent
        }));
      },
      
      setCurrentAgent: (agent) => {
        set({ currentAgent: agent });
      },

      // UI State
      isLoading: false,
      setIsLoading: (loading) => {
        set({ isLoading: loading });
      },

      error: null,
      setError: (error) => {
        set({ error });
      },

      // Reset
      reset: () => {
        set({
          messages: [],
          workflows: [],
          currentWorkflow: null,
          agents: [],
          currentAgent: null,
          isLoading: false,
          error: null
        });
      }
    }),
    {
      name: 'ai-store',
      partialize: (state: any) => ({
        workflows: state.workflows,
        agents: state.agents,
        currentWorkflow: state.currentWorkflow,
        currentAgent: state.currentAgent
      })
    }
  )
);