import { strategicPlanArgsValidator } from './schema.js';
import type { ToolCallParams, ToolCallResult } from '../../types/mcp-types.js';
import { logger } from '../../utils/logger.js';
import { validateToolInput, sanitizeErrorMessage } from '../../utils/security.js';

export async function executeStrategicPlan(params: ToolCallParams, context: { rateLimitId: string }): Promise<ToolCallResult> {
  const start = Date.now();
  try {
    const args = validateToolInput(strategicPlanArgsValidator, params.arguments) as any;
    logger.info('strategic_plan called', { promptSnippet: args.prompt.substring(0, 30), rateLimitId: context.rateLimitId });
    // Placeholder response – real implementation would call PlanExe API
    return {
      isError: false,
      content: [{ type: 'text', text: 'Strategic plan generation initiated. Status: Queued.' }],
      structuredContent: { status: 'queued', task_id: 'placeholder-uuid' },
    };
  } catch (e) {
    const msg = sanitizeErrorMessage(e, false);
    logger.error('strategic_plan error', { error: msg });
    return { isError: true, content: [{ type: 'text', text: msg }] };
  }
}
