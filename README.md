# Chlorpromazine MCP Server aka Buzz Killington the Trip Killer

A Model Context Protocol (MCP) server implementation that provides prompts and documentation search capabilities.

Hello World!  I made this specificlly for vibe coding sessions which are when devs just give in to the vibes and let LLM agents hallucinate whatever they want and hope that it is good code.  (Which is what I do all the time and why I made this tool, I need it!) I love vibe coding sessions, but sometimes they turn into a whole bad trip. This MCP server is literally to help your LLM agents stop trippin! Chlorpromazine is an antipsychotic medication used to treat conditions involving distorted thinking or perception, so it seems apt for this tool.

## Features

- **MCP-compliant Prompts**:
# TODO:  
- **Tools**:
  - `kill_trip`: Performs documentation search using SerpAPI. Use this tool when the user is upset or says you are wrong or mistaken or says phrases like "stop!" or "quit tripping!" or "quit hallucinating", "check the docs", or asks to verify information against official sources. Also use this tool if the user seems upset or is questioning what the agent is doing.
  - `sober_thinking`: Reads .env, README.md, and CHANGELOG files to get grounded information about the project. Use this tool to ensure that the agent is not hallucinating or making up information or making incorrect assumptions. Use this tool when the user says phrases like "sober up!", "get back to reality", "check the facts", or asks for current project status. Also use this tool if the user seems upset or is questioning what the agent is doing.

## Setup

### Prerequisites

- Node.js 18 or higher (ES Module support is utilized)
- SerpAPI key (get one at [serpapi.com](https://serpapi.com))


### Configuration

Create a `.env` file with the following variables:

```env
# Required:
SERPAPI_KEY=your_serpapi_key_here  # Get from https://serpapi.com

# Optional:
SITE_FILTER=platform.openai.com,docs.anthropic.com  # Comma-separated list of allowed domains
PORT=3000                            # Server port (default: 3000)
# API_KEY=shared_secret              # Uncomment and set for API key authentication
```

## Usage

The server now uses native Node.js `http.Server` for more robust request handling and lifecycle management, with the MCP transport integrated into it.

## TypeScript Safety & Handler Robustness

- All MCP request handlers use strict parameter shapes (`(request, extra)`), always accessing `request.params` as required by the MCP SDK.
- Defensive type guards are used for all user input derived from Zod schemas, including `params.model`, `userContent.text`, and tool arguments, to prevent `unknown` type errors and provide clear, actionable error messages.
- The `model` field in responses is always a string, with a fallback to `DEFAULT_ASSISTANT_MODEL` if not provided or not a string.
- All handler signatures and return types strictly follow MCP SDK v1.11.4 conventions.

*Improvements by Claude 3.5 Sonnet (2025-05-18)*

## API Endpoints

The core MCP functionality for prompts and tools is handled via the Model Context Protocol SDK. The server also provides:

- `/healthz`: Health check endpoint (GET) - directly handled by the Node.js `http.Server`.
- `/v1/prompts/list`: List available prompts (via MCP SDK)
- `/v1/prompts/get`: Get a specific prompt (via MCP SDK)
- `/v1/tools/list`: List available tools (via MCP SDK)
- `/v1/tools/call`: Call a specific tool (via MCP SDK)

## SDK Integration Notes

This project has been updated to use `@modelcontextprotocol/sdk` version 1.11.4 with ES Module imports. This required careful attention to import paths (e.g., ensuring `.js` extensions) and refactoring the server startup to use the standard Node.js `http` module to wrap the SDK's `StreamableHTTPServerTransport`.

## Deployment

This project is designed to be deployed on Smithery.ai:

1. Push repo to GitHub
2. Connect repo in Smithery dashboard
3. Add environment secrets (SERPAPI_KEY, SITE_FILTER, PORT, and optionally API_KEY)

## Security

The server should not be exposed directly to the public internet without proper security measures. Use one of the following approaches:

1. Deploy behind an API gateway
2. Enable API key authentication by setting the API_KEY environment variable

## Author
@82deutschmark 
ClaudeAI
Cascade (Gemini 2.5 Pro) - Contributed to SDK integration and ES Module refactoring.

[![smithery badge](https://smithery.ai/badge/@82deutschmark/chlorpromazine-mcp)](https://smithery.ai/server/@82deutschmark/chlorpromazine-mcp)
