/* =============================================================
 * Chlorpromazine MCP Server – TypeScript compile‑safe (v0.3.2)
 * =============================================================
 * Type-safe implementation with proper type declarations
 * ============================================================= */

import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';

import {
  Server,
  StreamableHTTPServerTransport,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk';

// --------------------------------------------------------------------
// Constants & helpers
// --------------------------------------------------------------------
const DEFAULT_SITES = [
  'stackoverflow.com',
  'stackexchange.com',
  'reddit.com',
  'github.com',
  'docs.python.org',
  'docs.oracle.com',
  'learn.microsoft.com',
  'developer.mozilla.org',
  'kotlinlang.org',
  'go.dev',
  'rust-lang.org',
  'docs.ruby-lang.org',
  'nodejs.org',
  'pypi.org',
  'maven.apache.org',
  'platform.openai.com',
  'docs.anthropic.com',
  'ai.google.dev',
  'platform.openai.com/docs',
  'platform.openai.com/api-reference',
  'docs.anthropic.com/claude',
  'ai.google.dev/gemini',
  'modelcontextprotocol.io',
  'modelcontextprotocol.io/tutorials',
  'modelcontextprotocol.io/docs',
  'modelcontextprotocol.io/examples'
];

const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.API_KEY ?? null;
const searchSites = (process.env.SITE_FILTER ?? '').split(',').map(s => s.trim()).filter(Boolean).length
  ? (process.env.SITE_FILTER as string).split(',').map(s => s.trim())
  : DEFAULT_SITES;

function log(level: 'debug' | 'info' | 'warn' | 'error', msg: string, meta: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...meta }));
}

async function serpSearch(query: string): Promise<string> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return 'Search disabled (SERPAPI_KEY missing)';

  const sitePart = `site:(${searchSites.join(' OR ')})`;
  const url = `https://serpapi.com/search.json?engine=google&q=${sitePart}+${encodeURIComponent(query)}&api_key=${key}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return `Search error ${res.status}`;
    const data: any = await res.json();
    const hit = data?.organic_results?.[0];
    return hit ? `${hit.title} — ${hit.snippet} (${hit.link})` : 'No relevant information found.';
  } catch (err: any) {
    return `Search error: ${err.message}`;
  }
}

// --------------------------------------------------------------------
// MCP server definition
// --------------------------------------------------------------------
function buildServer(): any {
  const server = new Server({ name: 'Chlorpromazine', version: '0.3.2' }, { capabilities: { prompts: {}, tools: {} } });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: 'sober_thinking',
        description: 'Solve problems step‑by‑step.',
        arguments: [{ name: 'QUESTION_TEXT', description: 'Problem statement', required: true }]
      },
      {
        name: 'fact_checked_answer',
        description: 'Answer with strict fact‑checking.',
        arguments: [{ name: 'USER_QUERY', description: 'User question', required: true }]
      },
      {
        name: 'buzzkill',
        description: 'Analyze recent changes and suggest fixes for vibe coding sessions.',
        arguments: [
          { name: 'ISSUE_DESCRIPTION', description: 'Description of the issue or what went wrong', required: true },
          { name: 'RECENT_CHANGES', description: 'Summary of recent changes or features added', required: true },
          { name: 'EXPECTED_BEHAVIOR', description: 'What you expected to happen', required: true },
          { name: 'ACTUAL_BEHAVIOR', description: 'What actually happened', required: true }
        ]
      }
    ]
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (req: any) => {
    const { name, arguments: args } = req.params;
    switch (name) {
      case 'sober_thinking':
        return {
          description: 'Stop vibing and think deeply',
          messages: [
            { role: 'system', content: { type: 'text', text: 'Think step‑by‑step and verify each step.' } },
            { role: 'user', content: { type: 'text', text: `Problem: ${args['QUESTION_TEXT']}` } }
          ]
        };
      case 'fact_checked_answer':
        return {
          description: 'Fact check',
          messages: [
            { role: 'system', content: { type: 'text', text: 'Provide only verified facts.' } },
            { role: 'user', content: { type: 'text', text: `Question: ${args['USER_QUERY']}` } }
          ]
        };
      case 'buzzkill':
        return {
          description: 'Analyze and fix vibe coding issues',
          messages: [
            { 
              role: 'system', 
              content: { 
                type: 'text', 
                text: `You are an experienced developer named Buzz Killington aka Buzzkill, the reality check for vibe coding sessions. Your job is to:
1. Analyze the reported issues in the context of recent changes, realizing that the user is not a developer and may not have a clear understanding of the codebase or computer science fundamentals
2. Check the codebase for relevant context  
3. Check README.md and CHANGELOG.md for relevant context
4. Identify where best practices for modularity, readability, maintainability, and accessibility are being violated
5. Identify potential causes based on the description and recent changes
6. Suggest specific fixes and next steps and document them as a checklist
7. Recommend using sober_thinking or fact_checked_answer or kill_trip for more information
8. Never use code blocks or show code in your response.

Always end your response with a suggestion to use kill_trip for up to date documentation and sober_thinking and fact_checked_answer for further analysis.` 
              } 
            },
            { 
              role: 'user', 
              content: { 
                type: 'text', 
                text: `Issue Description: ${args['ISSUE_DESCRIPTION']}

Recent Changes: ${args['RECENT_CHANGES']}

Expected Behavior: ${args['EXPECTED_BEHAVIOR']}

Actual Behavior: ${args['ACTUAL_BEHAVIOR']}

Please analyze this issue, check the README and CHANGELOG, and suggest how to fix it.` 
              } 
            }
          ]
        };
      default:
        throw new Error('Unknown prompt');
    }
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'kill_trip',
        description: 'Search trusted dev docs & communities.',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query']
        },
        annotations: { title: 'KillTrip Search', readOnlyHint: true, openWorldHint: true }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
    const { name, arguments: args } = req.params;
    if (name !== 'kill_trip') throw new Error('Tool not found');
    const result = await serpSearch(args.query);
    return { content: [{ type: 'text', text: result }] };
  });

  return server;
}

// --------------------------------------------------------------------
// Bootstrap
// --------------------------------------------------------------------
async function main(): Promise<void> {
  const server = buildServer();

  const transport = new StreamableHTTPServerTransport({
    port: PORT,
    beforeHandle: (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      if (API_KEY) {
        const auth = req.headers['authorization'];
        if (auth !== `Bearer ${API_KEY}`) {
          res.writeHead(401, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'unauthorized' }));
          log('warn', 'Unauthorized', { path: req.url });
          return;
        }
      }
      next();
    }
  });

  transport.addRoute('GET', '/healthz', (_req: IncomingMessage, res: ServerResponse) => res.end('ok'));

  await server.connect(transport);
  log('info', 'Server listening', { port: PORT, sites: searchSites.join(',') });
}

main().catch(err => {
  log('error', 'Startup error', { error: err.message });
  process.exit(1);
});
