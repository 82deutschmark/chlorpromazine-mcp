/**
 * Fact-Checked Answer prompt implementation
 */

import type { GetPromptResult } from '../types/mcp-types.js';
import type { FactCheckedAnswerPromptArgs } from '../types/app-types.js';
import { z } from 'zod';

const FactCheckedAnswerArgsSchema = z.object({
  USER_QUERY: z.string().min(1, 'USER_QUERY cannot be empty.'),
});

export const factCheckedAnswerPrompt = {
  name: 'fact_checked_answer',
  description: 'Verify answer against official documentation before responding',
  arguments: [
    { 
      name: 'USER_QUERY', 
      description: 'The query to fact-check against official documentation', 
      required: true 
    }
  ] as Array<{ name: string; description: string; required: boolean }>,
  
  async render(args: unknown): Promise<GetPromptResult> {
    // Validate arguments
    const validatedArgs = FactCheckedAnswerArgsSchema.parse(args) as FactCheckedAnswerPromptArgs;
    
    const promptText = `You need to answer this query: "${validatedArgs.USER_QUERY}"

**Fact-checking process:**
1. First, use the kill_trip tool to search official documentation for relevant information
2. Review the search results carefully for accuracy and relevance
3. If the first search doesn't provide enough information, try different search terms
4. Cross-reference multiple sources when possible
5. Provide your answer based only on verified information from official sources

**Answer format:**
- Start with a clear, direct answer
- Include citations from the documentation you found
- If information is incomplete or conflicting, state this clearly
- Provide links to official sources when available

**Important:** Only provide information that can be verified through official documentation. If you cannot find authoritative sources, say so explicitly.`;

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