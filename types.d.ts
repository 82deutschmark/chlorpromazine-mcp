// Type definitions for @modelcontextprotocol/sdk
declare module '@modelcontextprotocol/sdk' {
  export class Server {
    constructor(
      options: { name: string; version: string },
      config: { capabilities: { prompts: Record<string, unknown>; tools: Record<string, unknown> } }
    );
    setRequestHandler(schema: any, handler: (req: any) => Promise<any>): void;
    connect(transport: any): Promise<void>;
  }

  export class StreamableHTTPServerTransport {
    constructor(options: {
      port: number;
      beforeHandle?: (req: any, res: any, next: () => void) => void;
    });
    addRoute(method: string, path: string, handler: (req: any, res: any) => void): void;
  }

  export const ListPromptsRequestSchema: any;
  export const GetPromptRequestSchema: any;
  export const ListToolsRequestSchema: any;
  export const CallToolRequestSchema: any;
}
