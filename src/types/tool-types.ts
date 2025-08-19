/**
 * Tool-specific type definitions and schemas
 */

import { z } from 'zod';

// Kill Trip Tool Types
export const KillTripArgsSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(200, 'Query too long').describe('The search query for SerpAPI'),
});

export type KillTripArgs = z.infer<typeof KillTripArgsSchema>;

export const KillTripResultSchema = z.object({
  result: z.string().describe('Search result from SerpAPI'),
});

export type KillTripResult = z.infer<typeof KillTripResultSchema>;

// Sober Thinking Tool Types
export const SoberThinkingArgsSchema = z.object({
  // No arguments required for sober thinking tool
});

export type SoberThinkingArgs = z.infer<typeof SoberThinkingArgsSchema>;

export const SoberThinkingResultSchema = z.object({
  content: z.string().describe('Combined file contents from project'),
});

export type SoberThinkingResult = z.infer<typeof SoberThinkingResultSchema>;

// JSON Schema definitions for MCP tool registration
export const KillTripArgsJsonSchema = {
  type: 'object' as const,
  properties: {
    query: { 
      type: 'string' as const, 
      description: 'The search query for SerpAPI',
      minLength: 1,
      maxLength: 200
    },
  },
  required: ['query'],
};

export const KillTripResultJsonSchema = {
  type: 'object' as const,
  properties: {
    result: { 
      type: 'string' as const, 
      description: 'Search result from SerpAPI' 
    },
  },
  required: ['result'],
};

export const SoberThinkingArgsJsonSchema = {
  type: 'object' as const,
  properties: {},
  required: [] as string[],
};

export const SoberThinkingResultJsonSchema = {
  type: 'object' as const,
  properties: {
    content: { 
      type: 'string' as const, 
      description: 'Combined file contents from project' 
    },
  },
  required: ['content'],
};

// Tool registration interfaces
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

// Generic tool handler interface
export interface ToolHandler<TArgs = unknown, TResult = unknown> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  execute(args: TArgs): Promise<TResult>;
}