# Changelog

All notable changes to the Chlorpromazine MCP Server project will be documented in this file.

## [0.4.4] - 2025-05-28
*GPT-4.1 (Cascade)*

### Changed
- Updated the descriptions for the `kill_trip` and `sober_thinking` tools in both server.ts and README.md.
- Tool descriptions now include natural language triggers and explicit guidance for use when the user is upset, questioning the agent, or indicating hallucination.
- README updated to accurately document tool usage and triggers for LLMs and users.

## [0.4.3] - 2025-05-18
*Claude 3.5 Sonnet*

### Changed
- Completed robust refactor for MCP SDK v1.11.4 alignment.
- All MCP request handlers now use strict parameter shapes and enforce type safety with defensive type guards.
- Added fallback logic for the `model` field to guarantee a string value (`DEFAULT_ASSISTANT_MODEL` if needed).
- All TypeScript errors resolved; codebase is robust and safe for novice coders.
- Updated documentation in README.md, info.md, and refactor plan to reflect these improvements.

## [0.4.2] - 2025-05-18
*Claude 3.5 Sonnet*

### Fixed
- Refactored all MCP server request handlers to use the correct parameter shape (`(request, extra)`), always accessing `request.params` as required by the MCP SDK.
- Updated `tools/call` handler to use `params.name` (not `params.toolName`), matching the SDK schema.
- Added robust type guards for all user input derived from Zod schemas, including `userContent.text` and `query`, to prevent `unknown` type errors and provide clear, actionable error messages.
- Improved code comments and structure for novice safety and maintainability.
- All TypeScript errors related to handler signatures and Zod type inference are now resolved.

## [0.4.1] - 2025-05-18

*Cascade (Gemini 2.5 Pro)*

### Changed
- Successfully integrated `@modelcontextprotocol/sdk` v1.11.4 using ES Module imports (`.js` extensions, direct paths to `server/index.js`, `server/streamableHttp.js`, `types.js`).
- Refactored server startup in `server.ts` to use Node.js `http.Server` for listening and initial request handling (authentication, `/healthz` route).
- `StreamableHTTPServerTransport` now correctly initialized (removed `port`, `addRoute`, `beforeHandle` options; set `sessionIdGenerator: undefined` for stateless operation).

### Fixed
- Resolved `ERR_PACKAGE_PATH_NOT_EXPORTED`, `ERR_MODULE_NOT_FOUND`, and `SyntaxError` related to SDK module imports.
- Addressed TypeScript lint errors regarding `StreamableHTTPServerTransportOptions` (`port`, `addRoute`, `beforeHandle`, missing `sessionIdGenerator`).
- Ensured server starts reliably after fixing `EADDRINUSE` port conflict issues.

## [0.4.0] - 2025-05-18

### Added
- New `buzzkill` prompt for analyzing and fixing issues in vibe coding sessions
- Enhanced prompt descriptions for better clarity
- Improved system prompts for more effective guidance

### Changed
- Renamed `sequential_thinking` prompt to `sober_thinking` for better clarity
- Standardized server port to 3000 across all configuration files
- Updated README.md with project purpose and usage instructions
- Enhanced error messages for better debugging

## [0.3.2] - 2025-05-18

### Added
- TypeScript type declarations for @modelcontextprotocol/sdk
- Default search sites configuration for common developer resources
- Structured logging with timestamps and log levels
- JSDoc comments for better code documentation
- Type-safe request/response handling

### Changed
- Refactored server implementation for better TypeScript support
- Improved error handling with more descriptive messages
- Updated server startup to use async/await pattern
- Enhanced search functionality with better site filtering
- Simplified configuration with environment variable defaults

### Fixed
- Resolved TypeScript compilation errors
- Fixed module resolution issues
- Addressed type safety concerns in request handlers
- Improved error handling for API responses

## [0.2.0] - 2025-05-18

### Added
- Initial project setup with TypeScript configuration
- Basic MCP server implementation with placeholder endpoints
- Environment variable configuration for SerpAPI and server settings
- Logging functionality for server events
- Health check endpoint for monitoring
- Server startup and graceful shutdown handling
- Process signal handlers for SIGTERM and SIGINT

### Changed
- Switched to CommonJS require for better compatibility
- Updated import statements to use correct module paths
- Fixed TypeScript type definitions for request/response objects
- Improved error handling for tool calls
- Updated TypeScript configuration for Node.js 18+ compatibility
- Enhanced server startup with better error handling

### Fixed
- Resolved module import issues with @modelcontextprotocol/sdk
- Fixed server options type definition for StreamableHTTPServerTransport
- Fixed top-level await issue in server startup

### Removed
- Unused dependencies and imports
- Redundant type definitions
- ESM module imports in favor of CommonJS

## 2024-07-26 - Claude 3.5 Sonnet

- Refactored `server.ts` for compliance with MCP SDK v0.3.2:
    - Corrected SDK imports for `Server` and `StreamableHTTPServerTransport`.
    - Updated prompt and tool handler signatures to align with `(args: Record<string, unknown>) => Promise<PromptResponse | ToolResponse>`.
    - Reworked the `main` function to initialize `Server` and `StreamableHTTPServerTransport` instances once at application startup, rather than per-request.
    - Moved authentication logic into the `beforeHandle` middleware of the transport.

## [Unreleased] - 2025-05-27T23:28:16-04:00
*GPT-4.1 (Cascade)*

### Changed
- Updated `tools/call` handler in `server.ts` so that all tool call results always include BOTH classic `content` (array of text content parts) and `structuredContent` fields. This ensures compatibility with both unstructured and structured MCP clients. Added file/module-level comments explaining this MCP compatibility requirement.
- Registered `sober_thinking` tool, which reads the .env file (truncated values), and fully reads README.md and changelog files for the agent.

    - Configured the `/healthz` endpoint using `transport.addRoute()`.
    - Ensured `mcpServer.connect(transport)` is called once to link the server and transport.
- Integrated Zod for runtime argument validation and type safety in all prompt and tool handlers in `server.ts`:
    - Defined Zod schemas for `SoberThinkingArgs`, `FactCheckedAnswerArgs`, `BuzzkillArgs`, and `KillTripArgs`.
    - Implemented `safeParse` in each handler to validate incoming arguments.
    - Added error handling to return structured error messages if parsing fails, resolving previous TypeScript casting errors.

---
*Note: This changelog is maintained by LLMs.*
