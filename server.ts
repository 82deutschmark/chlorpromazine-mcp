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
  'maven.apache.org'
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
        name: 'sequential_thinking',
        description: 'Solve problems step‑by‑step.',
        arguments: [{ name: 'QUESTION_TEXT', description: 'Problem statement', required: true }]
      },
      {
        name: 'fact_checked_answer',
        description: 'Answer with strict fact‑checking.',
        arguments: [{ name: 'USER_QUERY', description: 'User question', required: true }]
      }
    ]
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (req: any) => {
    const { name, arguments: args } = req.params;
    switch (name) {
      case 'sequential_thinking':
        return {
          description: 'Step reasoning',
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
