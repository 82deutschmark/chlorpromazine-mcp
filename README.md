# Chlorpromazine MCP Server

A Model Context Protocol (MCP) server implementation that provides prompts and documentation search capabilities.

## Features

- Two MCP-compliant prompts: `sequential_thinking` and `fact_checked_answer`
- Documentation search tool `kill_trip` powered by SerpAPI
- Structured JSON logging
- Health check endpoint for uptime monitoring
- Optional API key authentication
- Automated testing

## Setup

### Prerequisites

- Node.js 18 or higher
- SerpAPI key (get one at [serpapi.com](https://serpapi.com))

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Create a `.env` file with the following variables:

```env
SERPAPI_KEY=your_serpapi_key_here
SITE_FILTER=platform.openai.com/docs  # Default search domain
PORT=8080                            # Server port
# API_KEY=shared_secret              # Optional: Uncomment for API key auth
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Testing

```bash
npm test
```

## API Endpoints

- `/healthz`: Health check endpoint (GET)
- `/v1/prompts/list`: List available prompts
- `/v1/prompts/get`: Get a specific prompt
- `/v1/tools/list`: List available tools
- `/v1/tools/call`: Call a specific tool

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

ClaudeAI

