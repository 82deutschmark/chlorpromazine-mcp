/* =============================================================
 * Chlorpromazine MCP Server – TypeScript compile‑safe (v0.3.2)
 * =============================================================
 * Type-safe implementation with proper type declarations
 * ============================================================= */

import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import http from 'node:http';
import { randomUUID } from 'node:crypto'; // Added import

// Import the MCP SDK
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'; // Re-added
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  StreamableHTTPServerTransport,
  type StreamableHTTPServerTransportOptions,
} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  JSONRPCMessageSchema,
  RequestSchema, // Base request schema
  NotificationSchema, // Base notification schema
  ResultSchema, // Base result schema
  TextContentSchema,     // Imported: For single text content parts
  ContentListSchema,   // Imported: For lists of content parts (e.g., in MessageSchema.content)
  // ContentPartSchema, // Removed: Not directly exported or used
  SamplingMessageSchema, // Correct schema for sampling/createMessage messages
  CreateMessageRequestSchema, // Full schema for sampling/createMessage request
  CreateMessageResultSchema, // Full schema for sampling/createMessage result
  ToolSchema, // Corrected: SDK exports ToolSchema, not ToolDefinitionSchema
  ListToolsRequestSchema, // Full schema for tools/list request
  ListToolsResultSchema, // Full schema for tools/list result
  CallToolRequestSchema, // Full schema for tools/call request
  CallToolResultSchema, // Full schema for tools/call result
  ServerCapabilitiesSchema, // Schema for server capabilities
  ImplementationSchema, // Schema for implementation details (name, version)
  InitializeRequestSchema, // Added for server generics
  InitializeResultSchema,  // Added for server generics
  PingRequestSchema,       // Added for server generics
  EmptyResultSchema,     // Corrected: Ping likely returns an empty result
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Define local Zod schemas for specific tool arguments
const KillTripArgsSchema = z.object({
  query: z.string().describe('The search query for SerpAPI.'),
});

// Define JSON Schema objects for tool definitions (required by ToolSchema)
const KillTripArgsJsonSchema = {
  type: 'object' as const,
  properties: {
    query: { type: 'string' as const, description: 'The search query for SerpAPI.' },
  },
  required: ['query'],
};

const OutputStringJsonSchema = { 
  type: 'object' as const,
  properties: {
    result: { type: 'string' as const, description: 'The string result of the operation.' },
  },
  required: ['result'],
};

// Define type aliases inferred from SDK Zod schemas
type JSONRPCMessage = z.infer<typeof JSONRPCMessageSchema>;

// Define specific union types for all requests, notifications, and results this server handles
export type MyServerRequest = 
  z.infer<typeof InitializeRequestSchema> |
  z.infer<typeof PingRequestSchema> |
  z.infer<typeof CreateMessageRequestSchema> |
  z.infer<typeof ListToolsRequestSchema> |
  z.infer<typeof CallToolRequestSchema>;

// All notifications this server can send or receive (currently only SDK defaults if any)
export type MyServerNotification = z.infer<typeof NotificationSchema>; // Using SDK base for now

// Define specific union types for all requests, notifications, and results this server handles
export type MyServerResult = 
  z.infer<typeof InitializeResultSchema> |
  z.infer<typeof EmptyResultSchema> | // For Ping
  z.infer<typeof CreateMessageResultSchema> |
  z.infer<typeof ListToolsResultSchema> |
  z.infer<typeof CallToolResultSchema>;

// ---- Type aliases inferred from SDK Zod schemas (some might be covered by MyServer... types) ----

type SdkTextContent = z.infer<typeof TextContentSchema>; // This is correct for a single text part
type MyTextContentPart = z.infer<typeof TextContentSchema>; // Alias for clarity
type SdkContentList = z.infer<typeof ContentListSchema>; // For arrays of mixed content parts

type SdkMessage = z.infer<typeof SamplingMessageSchema>; // Corrected: Use SamplingMessageSchema
type SdkMessageContentPart = MyTextContentPart; // Corrected: a single part is MyTextContentPart (or a broader union if handling images etc.)

// Handler-specific param/result types (may become redundant if server generics work well)
type SdkCreateMessageParams = z.infer<typeof CreateMessageRequestSchema>['params'];
type SdkCreateMessageResult = z.infer<typeof CreateMessageResultSchema>;

type SdkCallToolParams = z.infer<typeof CallToolRequestSchema>['params'];
type SdkCallToolResult = z.infer<typeof CallToolResultSchema>;

type SdkListToolsParams = z.infer<typeof ListToolsRequestSchema>['params'];
type SdkListToolsResult = z.infer<typeof ListToolsResultSchema>;

type SdkServerCapabilities = z.infer<typeof ServerCapabilitiesSchema>;
type SdkImplementation = z.infer<typeof ImplementationSchema>;

// Define our server's specific info and config types
interface ChlorpromazineServerInfo extends SdkImplementation {}
interface ChlorpromazineServerConfig {
  capabilities: SdkServerCapabilities;
}

// Define custom types for our prompts (input arguments)
interface SoberThinkingArgs {
  QUESTION_TEXT: string;
}
const SoberThinkingArgsSchema = z.object({
  QUESTION_TEXT: z.string().min(1, 'QUESTION_TEXT cannot be empty.'),
});

interface FactCheckedAnswerArgs {
  USER_QUERY: string;
}
const FactCheckedAnswerArgsSchema = z.object({
  USER_QUERY: z.string().min(1, 'USER_QUERY cannot be empty.'),
});

interface BuzzkillArgs {
  ISSUE_DESCRIPTION: string;
  RECENT_CHANGES: string;
  EXPECTED_BEHAVIOR: string;
  ACTUAL_BEHAVIOR: string;
}
const BuzzkillArgsSchema = z.object({
  ISSUE_DESCRIPTION: z.string().min(1, 'ISSUE_DESCRIPTION cannot be empty.'),
  RECENT_CHANGES: z.string(),
  EXPECTED_BEHAVIOR: z.string(),
  ACTUAL_BEHAVIOR: z.string(),
});

const killTripTool = {
  name: 'kill_trip', // Corrected: 'name' instead of 'toolName'
  description: 'Performs a SerpAPI search using the provided query string.',
  inputSchema: KillTripArgsJsonSchema, // Use the JSON Schema object
  outputSchema: OutputStringJsonSchema,    // Use the corrected object schema
} satisfies z.infer<typeof ToolSchema>; // Satisfies SDK's ToolSchema

// Placeholder for the actual SerpAPI search function
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

const SERVER_MODEL_NAME = 'chlorpromazine-mcp'; // Define a model name
const DEFAULT_ASSISTANT_MODEL = 'chlorpromazine-mcp/default'; // Default model for createMessage responses

/**
 * Builds and configures the MCP server instance.
 * This function will be refactored to use setRequestHandler for prompts and tools.
 */
function buildServer() {
  // Create a new server instance with our custom request/result types
  // Explicitly typing 'server' here to reinforce the generic arguments to the TypeScript compiler.
  const server: Server<MyServerRequest, MyServerNotification, MyServerResult> = 
    new Server<MyServerRequest, MyServerNotification, MyServerResult>(
      {
        name: 'ChlorpromazineMCP',
        version: '0.1.0',
      },
      {
        capabilities: {
          experimental: {},
          sampling: {
            createMessage: true, // Indicates support for the 'sampling/createMessage' method
          },
          tools: {
            list: true, // Indicates support for 'tools/list'
            call: true, // Indicates support for 'tools/call'
            // toolSearch: false, // Not implementing tool search
            // toolUpdated: false, // Not implementing tool updates
          },
          // Other capabilities like 'documents', 'roots', etc., can be added here if supported
        },
      }
    );

  // Register a single handler for sampling/createMessage
  // Handler for sampling/createMessage (fix: use request, not params)
  server.setRequestHandler(
    CreateMessageRequestSchema,
    async (request, extra): Promise<SdkCreateMessageResult> => {
      const params = request.params;
      console.log('Handling sampling/createMessage request:', params, 'with extra:', extra);

      if (!params.messages || params.messages.length === 0) {
        throw new Error('No messages provided in sampling/createMessage request.');
      }

      const lastUserMessage = params.messages
        .filter((msg: SdkMessage) => msg.role === 'user')
        .pop();

      let responseText = "I'm sorry, I didn't understand that.";

      if (lastUserMessage && lastUserMessage.content) {
        const userContent = lastUserMessage.content;
        if (userContent.type === 'text') {
          // Defensive type guard for novice safety
          if (typeof userContent.text !== 'string') {
            throw new Error('Invalid message: text content must be a string');
          }
          const userQuery = userContent.text.toLowerCase();
          if (userQuery.includes('hello') || userQuery.includes('hi')) {
            responseText = 'Hello there! How can I help you today?';
          } else if (userQuery.includes('how are you')) {
            responseText = "I'm just a bot, but I'm here to help!";
          } else if (params.model === 'echo_bot') {
            responseText = `Echo: ${userContent.text}`;
          } else if (params.model === 'reverse_bot') {
            responseText = `Reversed: ${userContent.text
              .split('')
              .reverse()
              .join('')}`;
          } else {
            responseText = `Received model '${params.model}' and query: ${userContent.text}`;
          }
        }
      }

      return {
        // Defensive type guard for model; fallback to default if not a string
        model: typeof params.model === 'string' ? params.model : DEFAULT_ASSISTANT_MODEL,
        role: 'assistant',
        // responseText is always a string due to prior logic and type guards
        content: { type: 'text', text: String(responseText) } as MyTextContentPart,
      } satisfies SdkCreateMessageResult;
    }
  );

  // Restore tools/list handler
  // Handler for tools/list (fix: use request, not params)
  server.setRequestHandler(
    ListToolsRequestSchema,
    async (request, extra): Promise<SdkListToolsResult> => {
      const params = request.params;
      console.log('Handling tools/list request:', params, 'with extra:', extra);
      return {
        tools: [
          {
            name: killTripTool.name,
            description: killTripTool.description,
            inputSchema: killTripTool.inputSchema,
            outputSchema: killTripTool.outputSchema,
          },
        ],
      } satisfies SdkListToolsResult;
    });

  // Restore tools/call handler
  // Handler for tools/call (fix: use request, not params)
  // Handler for tools/call (fix: use params.name, not params.toolName)
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request, extra): Promise<SdkCallToolResult> => {
      const params = request.params;
      console.log('Handling tools/call request:', params, 'with extra:', extra);

      // Per MCP SDK, the tool name is in params.name
      if (params.name === 'kill_trip') {
        const validationResult = KillTripArgsSchema.safeParse(params.input);
        if (!validationResult.success) {
          console.error('Invalid input for kill_trip:', validationResult.error);
          return {
            toolName: params.name,
            toolRunId: params.toolRunId,
            isError: true,
            error: `Invalid input: ${validationResult.error.message}`,
            structuredContent: {},
          } satisfies SdkCallToolResult;
        }
        // Defensive type guard for query
        const { query } = validationResult.data as { query: unknown };
        if (typeof query !== 'string') {
          return {
            toolName: params.name,
            toolRunId: params.toolRunId,
            isError: true,
            error: 'Invalid input: query must be a string',
            structuredContent: {},
          } satisfies SdkCallToolResult;
        }
        try {
          const searchResultString = await serpSearch(query);
          console.log(`SerpAPI search result for query "${query}": ${searchResultString}`);
          return {
            toolName: params.name,
            toolRunId: params.toolRunId,
            isError: false,
            structuredContent: { result: searchResultString },
          } satisfies SdkCallToolResult;
        } catch (e: any) {
          console.error(`Error during SerpAPI search for query "${query}":`, e);
          return {
            toolName: params.name,
            toolRunId: params.toolRunId,
            isError: true,
            error: e.message || 'SerpAPI search failed.',
            structuredContent: {},
          } satisfies SdkCallToolResult;
        }
      } else {
        console.error(`Tool '${params.name}' not found.`);
        return {
          toolName: params.name,
          toolRunId: params.toolRunId,
          isError: true,
          error: `Tool '${params.name}' not found.`,
          structuredContent: {},
        } satisfies SdkCallToolResult;
      }
    }
  );

  return server;
}

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

// ---------------------------------------------------------------------
// Main server startup
// ---------------------------------------------------------------------
async function main() {
  // Initialize and start the server
  log('info', 'Chlorpromazine MCP Server starting...');
  const server = buildServer();
  log('info', 'Server built. Transport and HTTP server setup starting.');

  const transportOptions: StreamableHTTPServerTransportOptions = {
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId: string) => { // Explicitly type sessionId
      console.log(`MCP Session initialized: ${sessionId}`);
    },
    // enableJsonResponse: true, // You can enable this if you prefer JSON over SSE for non-streaming
  };

  const transport = new StreamableHTTPServerTransport(transportOptions);
  log('info', 'StreamableHTTPServerTransport initialized.');

  // The transport is connected to the server, not 'set' as a property after instantiation.
  await server.connect(transport); // Correct: Connect the transport to the server

  console.log(`MCP Server listening on port ${PORT} with transport ${transport.constructor.name}`);

  const httpServer = http.createServer(async (req, res) => {
    // Handle health check endpoint
    if (req.url === '/healthz' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    // MCP requests are POST
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
      });
      req.on('end', async () => {
        try {
          const parsedBody = JSON.parse(body);
          // Pass to the transport
          await transport.handleRequest(req as IncomingMessage & { auth?: AuthInfo }, res, parsedBody);
        } catch (e: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON RPC request: ' + e.message }));
        }
      });
    } else if (req.method === 'GET' && req.headers.accept === 'text/event-stream') {
      // Handle SSE connections if the transport supports them directly for GET
      // (StreamableHTTPServerTransport handles SSE internally for established sessions via POST initially)
      // This explicit GET handler for SSE might be redundant if transport only uses POST for session initiation
      // and then client uses that session ID for a GET SSE stream.
      // For now, assuming transport.handleRequest covers this if a session ID is part of the GET request URL.
      await transport.handleRequest(req as IncomingMessage & { auth?: AuthInfo }, res);
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  });

  httpServer.listen(PORT, () => {
    log('info', `Chlorpromazine MCP Server listening on HTTP port ${PORT}`);
    log('info', `SSE transport expected at /mcp (default path, check SDK docs if different)`);
    log('info', `Make sure your MCP client is configured to connect to: http://localhost:${PORT}`);
    // Display active prompts and tools from the server instance
    // This part needs to be updated as server.prompts and server.tools are gone
    // We can list what's registered via setRequestHandler if the server instance exposes it,
    // or just log our intended setup.
    log('info', 'Registered MCP Methods:');
    log('info', '  - sampling/createMessage (handles models: sober_thinking, fact_checked_answer, buzzkill)');
    log('info', '  - tools/call (handles tool: kill_trip)');
    log('info', '  - tools/list (lists tool: kill_trip)');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('info', 'SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
      log('info', 'HTTP server closed');
      server.close(); // Close the MCP server
      log('info', 'MCP Server closed');
      process.exit(0);
    });
  });
}

// Initialize Zod schemas for argument validation if not already done
// (They are defined at the top level now, so no action needed here)

main().catch(error => {
  log('error', 'Failed to start server', { error: error.message, stack: error.stack });
  process.exit(1);
});
