/**
 * Chlorpromazine MCP Server - Simple Test Suite
 * 
 * This file implements a lightweight test suite that:
 * 1. Starts the server
 * 2. Tests all four MCP endpoints
 * 3. Asserts HTTP 200 responses with non-empty JSON fields
 * 
 * Author: Claude
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.TEST_PORT || 8081;

// Simple test framework
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
    return false;
  }
  console.log(`✅ PASS: ${message}`);
  testsPassed++;
  return true;
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const status = response.status;
  let json = null;
  
  try {
    json = await response.json();
  } catch (e) {
    // Not JSON or empty response
  }
  
  return { status, json };
}

// Start server for testing
console.log('Starting test server...');
const server = spawn('node', ['dist/server.js'], {
  stdio: 'pipe',
  env: { 
    ...process.env, 
    PORT,
    SITE_FILTER: 'example.com',
    SERPAPI_KEY: 'test_key'
  }
});

let serverOutput = '';

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log(`[Server]: ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  serverOutput += data.toString();
  console.error(`[Server Error]: ${data.toString().trim()}`);
});

// Wait for server to start
await setTimeout(1000);
console.log('Beginning tests...');

try {
  // Test 1: /healthz endpoint
  const healthCheck = await fetch(`http://localhost:${PORT}/healthz`);
  assert(healthCheck.status === 200, 'Health check endpoint returns 200');
  
  // Test 2: /v1/prompts/list
  const { status: promptsListStatus, json: promptsList } = await fetchJSON(`http://localhost:${PORT}/v1/prompts/list`);
  assert(promptsListStatus === 200, 'prompts/list returns 200 status');
  assert(promptsList && promptsList.prompts && promptsList.prompts.length > 0, 'prompts/list returns non-empty prompts array');
  
  // Test 3: /v1/prompts/get
  const promptsGetPayload = {
    name: 'sequential_thinking',
    arguments: { 'QUESTION_TEXT': 'Test question' }
  };
  
  const { status: promptsGetStatus, json: promptsGet } = await fetchJSON(
    `http://localhost:${PORT}/v1/prompts/get`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptsGetPayload)
    }
  );
  
  assert(promptsGetStatus === 200, 'prompts/get returns 200 status');
  assert(promptsGet && promptsGet.messages && promptsGet.messages.length > 0, 'prompts/get returns non-empty messages array');
  
  // Test 4: /v1/tools/list
  const { status: toolsListStatus, json: toolsList } = await fetchJSON(`http://localhost:${PORT}/v1/tools/list`);
  assert(toolsListStatus === 200, 'tools/list returns 200 status');
  assert(toolsList && toolsList.tools && toolsList.tools.length > 0, 'tools/list returns non-empty tools array');
  
  // Test 5: /v1/tools/call
  const toolsCallPayload = {
    name: 'kill_trip',
    arguments: { 'query': 'test query' }
  };
  
  const { status: toolsCallStatus, json: toolsCall } = await fetchJSON(
    `http://localhost:${PORT}/v1/tools/call`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toolsCallPayload)
    }
  );
  
  assert(toolsCallStatus === 200, 'tools/call returns 200 status');
  assert(toolsCall && toolsCall.content && toolsCall.content.length > 0, 'tools/call returns non-empty content array');
  
} catch (error) {
  console.error('Test error:', error);
  testsFailed++;
} finally {
  // Shut down the server
  server.kill();
  console.log(`\nTests completed: ${testsPassed} passed, ${testsFailed} failed`);
  process.exit(testsFailed > 0 ? 1 : 0);
}
