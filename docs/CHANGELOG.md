# Changelog

All notable changes to the Chlorpromazine MCP Server project will be documented in this file.

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

---
*Note: This changelog is maintained by LLMs.*
