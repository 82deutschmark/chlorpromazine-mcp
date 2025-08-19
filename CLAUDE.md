# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with hot reload using tsx
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm start` - Run the compiled server from dist/
- `npm test` - Run the simple test suite (starts server on port 8081 and tests endpoints)
- `npm run clean` - Remove dist/ directory

### Environment Setup
Create a `.env` file with:
- `SERPAPI_KEY` (required) - Get from serpapi.com for documentation search
- `SITE_FILTER` (optional) - Comma-separated list of domains to search
- `PORT` (optional) - Server port, defaults to 3000
- `API_KEY` (optional) - Enable API key authentication

## Architecture

This is a Model Context Protocol (MCP) server that provides "trip killing" functionality for LLM agents. The server implements MCP SDK v1.12.0 with TypeScript and ES modules.

### Core Components

**server.ts** - Main server file with:
- Native Node.js HTTP server wrapping StreamableHTTPServerTransport
- MCP request handlers for sampling/createMessage, tools/list, tools/call
- Two primary tools: `kill_trip` (SerpAPI search) and `sober_thinking` (file reading)

**Key MCP Methods:**
- `sampling/createMessage` - Handles basic chat functionality with model routing
- `tools/list` - Returns available tools (kill_trip, sober_thinking)
- `tools/call` - Executes tools with proper error handling and dual content format

### Tool Functions

**kill_trip** - Searches documentation using SerpAPI when users are upset or question agent responses. Searches against configurable sites (defaults to major dev docs).

**sober_thinking** - Reads project files (.env with hidden values, README.md, CHANGELOG) to ground the agent in current project reality.

### Architecture Notes
- Uses strict TypeScript with Zod validation for all inputs
- Dual content format in tool responses (classic array + structured object) for MCP client compatibility  
- ES Module imports with explicit .js extensions required
- Defensive type guards throughout for runtime safety
- Transport handles both POST (JSON-RPC) and GET (SSE) requests

The server is designed to deploy on Smithery.ai platform and help prevent LLM agents from "hallucinating" during development sessions.