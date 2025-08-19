/**
 * Sober Thinking prompt implementation
 */

import type { GetPromptResult } from '../types/mcp-types.js';
import type { SoberThinkingPromptArgs } from '../types/app-types.js';
import { z } from 'zod';

const SoberThinkingArgsSchema = z.object({
  QUESTION_TEXT: z.string().min(1, 'QUESTION_TEXT cannot be empty.'),
});

export const soberThinkingPrompt = {
  name: 'sober_thinking',
  description: 'Ground agent in project reality by reading current files before answering',
  arguments: [
    { 
      name: 'QUESTION_TEXT', 
      description: 'The question to answer after grounding in project reality', 
      required: true 
    }
  ] as Array<{ name: string; description: string; required: boolean }>,
  
  async render(args: unknown): Promise<GetPromptResult> {
    // Validate arguments
    const validatedArgs = SoberThinkingArgsSchema.parse(args) as SoberThinkingPromptArgs;
    
    const promptText = `Before answering "${validatedArgs.QUESTION_TEXT}", first read the project files to ground yourself in reality.

**Instructions:**
1. Use the sober_thinking tool to read the current project files (README.md, .env, CHANGELOG, etc.)
2. Analyze the current state based on the actual project files
3. Answer the question using only verified information from the project files
4. If information is missing or uncertain, clearly state what is unknown
5. Cite specific files when referencing information

**Important:** Do not make assumptions or hallucinate information. Only use facts from the actual project files.`;

    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: promptText
        }
      }]
    };
  }
} as const;