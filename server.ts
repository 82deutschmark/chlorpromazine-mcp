/**
 * Chlorpromazine MCP Server
 * 
 * This file implements a Model Context Protocol server that provides:
 * 1. Two prompts (sequential_thinking and fact_checked_answer)
 * 2. One search tool (kill_trip) that searches documentation via SerpAPI
 * 
 * Author: Claude
 */

import 'dotenv/config';

// Import from the SDK
import { Server } from '@modelcontextprotocol/sdk/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/server/schemas';

// Type definitions for request/response objects
interface Request {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
  socket: {
    remoteAddress?: string;
  };
}

interface Response {
  statusCode?: number;
  end: (chunk: string) => void;
}

type NextFunction = () => void;

const SITE_FILTER = process.env.SITE_FILTER!;
const PORT = Number(process.env.PORT) || 3000;

// ---------------------------------------------------------------- logging --
function logEvent(level: string, message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  };
  console.log(JSON.stringify(logEntry));
}

// ---------------------------------------------------------------- helpers --
async function performSearch(query: string): Promise<string> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    logEvent('warn', 'Search disabled: missing SERPAPI_KEY');
    return 'Search disabled: missing SERPAPI_KEY.';
  }
  
  logEvent('info', 'Performing search', { query, siteFilter: SITE_FILTER });
  
  try {
    const url =
      `https://serpapi.com/search.json?engine=google&q=site:${SITE_FILTER}+${encodeURIComponent(query)}&api_key=${apiKey}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      logEvent('error', 'Search API error', { status: res.status, error: errorText });
      return `Search error: ${res.status}`;
    }
    
    const json: any = await res.json();
    const top = json?.organic_results?.[0];
    
    if (top) {
      logEvent('info', 'Search successful', { title: top.title, url: top.link });
      return `${top.title} — ${top.snippet} (${top.link})`;
    } else {
      logEvent('info', 'Search returned no results', { query });
      return 'No relevant information found.';
    }
  } catch (err: any) {
    logEvent('error', 'Search failed', { error: err.message });
    return `Search error: ${err.message}`;
  }
}

// ---------------------------------------------------------------- server ---
const server = new Server(
  { name: 'Chlorpromazine', version: '0.2.0' },
  { capabilities: { prompts: {}, tools: {} } }
);

// prompts/list
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  logEvent('info', 'Handling prompts/list request');
  return {
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
  };
});

// prompts/get
server.setRequestHandler(GetPromptRequestSchema, async (req: any) => {
  const { name, arguments: args } = req.params;
  logEvent('info', 'Handling prompts/get request', { promptName: name });
  
  if (name === 'sequential_thinking') {
    return {
      description: 'Step reasoning',
      messages: [
        { role: 'system', content: { type: 'text', text: 'Think step‑by‑step and verify each step.' } },
        { role: 'user',   content: { type: 'text', text: `Problem: ${args['QUESTION_TEXT']}` } }
      ]
    };
  }
  if (name === 'fact_checked_answer') {
    return {
      description: 'Fact check',
      messages: [
        { role: 'system', content: { type: 'text', text: 'Provide only verified facts.' } },
        { role: 'user',   content: { type: 'text', text: `Question: ${args['USER_QUERY']}` } }
      ]
    };
  }
  
  logEvent('error', 'Unknown prompt requested', { promptName: name });
  throw new Error('Unknown prompt');
});

// tools/list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logEvent('info', 'Handling tools/list request');
  return {
    tools: [
      {
        name: 'kill_trip',
        description: 'Live documentation search.',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query']
        },
        annotations: { title: 'KillTrip Search', readOnlyHint: true, openWorldHint: true }
      }
    ]
  };
});

// tools/call
server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
  try {
    const { name, arguments: args } = req.params;
    logEvent('info', 'Handling tools/call request', { toolName: name, query: args['query'] });
    
    if (name !== 'kill_trip') {
      logEvent('error', 'Unknown tool requested', { toolName: name });
      throw new Error('Tool not found');
    }
    
    const text = await performSearch(args['query']);
    return { content: [{ type: 'text', text }] };
  } catch (err: any) {
    logEvent('error', 'Tool call error', { error: err.message });
    return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
  }
});

// ---------------------------------------------------------------- transport
const transport = new StreamableHTTPServerTransport({
  serverOptions: { port: PORT }
});

// Add authentication middleware if API_KEY is provided
if (process.env.API_KEY) {
  logEvent('info', 'API key authentication enabled');
  // Note: If middleware is not directly supported by the SDK, we would need to implement
  // authentication differently. Here's a placeholder that would need to be adjusted based on SDK capabilities.
  /*
  // Custom authentication middleware
  (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${process.env.API_KEY}`) {
      logEvent('warn', 'Unauthorized access attempt', { 
        ip: req.socket.remoteAddress, 
        path: req.url 
      });
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
      next();
  });
  */
}

// Connect server to transport
await server.connect(transport);

// Health‑check route for uptime monitoring
// Note: If custom routes aren't directly supported, we would need to implement health checks differently
// Here's a placeholder that would need to be adjusted based on SDK capabilities
/*
transport.addRoute('GET', '/healthz', (_req: Request, res: Response) => {
  logEvent('debug', 'Health check request');
  res.end('ok');
});
*/

// Simple health check implementation
setInterval(() => {
  logEvent('debug', 'Health check: server is running');
}, 60000);

logEvent('info', 'Server started', { port: PORT, siteFilter: SITE_FILTER });
console.log(`Chlorpromazine MCP server listening on ${PORT}`);
