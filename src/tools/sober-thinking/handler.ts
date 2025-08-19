/**
 * Sober Thinking tool implementation
 */

import { fileReaderService } from '../../services/file-reader.js';
import { validateToolInput, sanitizeErrorMessage } from '../../utils/security.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/environment.js';
import type { ToolCallParams, ToolCallResult } from '../../types/mcp-types.js';
import type { SoberThinkingArgs } from '../../types/tool-types.js';
import { soberThinkingArgsValidator } from './schema.js';

export async function executeSoberThinking(
  params: ToolCallParams,
  context: { rateLimitId: string }
): Promise<ToolCallResult> {
  const startTime = Date.now();
  
  try {
    // Validate input (even though no args are required, we still validate the structure)
    const args = validateToolInput(soberThinkingArgsValidator, params.input) as SoberThinkingArgs;
    
    logger.info('Sober thinking tool execution started', { 
      toolRunId: params.toolRunId,
      rateLimitId: context.rateLimitId
    });
    
    // Read project files
    const fileContents = await fileReaderService.readProjectFiles();
    const duration = Date.now() - startTime;
    
    logger.info('Sober thinking tool execution completed', {
      toolRunId: params.toolRunId,
      durationMs: duration,
      contentLength: fileContents.length
    });
    
    return {
      toolName: params.name,
      toolRunId: params.toolRunId,
      isError: false,
      content: [{ type: 'text', text: fileContents }],
      structuredContent: { content: fileContents },
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = sanitizeErrorMessage(error, config.isProduction);
    
    logger.error('Sober thinking tool execution failed', {
      toolRunId: params.toolRunId,
      error: errorMessage,
      durationMs: duration
    });
    
    return {
      toolName: params.name,
      toolRunId: params.toolRunId,
      isError: true,
      error: errorMessage,
      content: [{ type: 'text', text: errorMessage }],
      structuredContent: { error: errorMessage },
    };
  }
}