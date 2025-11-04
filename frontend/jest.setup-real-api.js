// Jest setup for E2E tests with REAL API calls
// Use this setup when ENABLE_OLLAMA_TESTS=true

import '@testing-library/jest-dom'

// Use real environment variables for tests
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL || ''
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}
if (!process.env.PERPLEXITY_API_KEY) {
  process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || ''
}

// Enable verbose console output for E2E tests
global.console = {
  ...console,
  // Keep all console output for debugging E2E tests
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js server components
global.Request = class MockRequest {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
    this.body = init?.body
  }
}

global.Response = class MockResponse {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Map(Object.entries(init?.headers || {}))
  }

  json() {
    return JSON.parse(this.body)
  }

  static json(data, init) {
    return new MockResponse(JSON.stringify(data), init)
  }
}

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => {
      const response = {
        status: init?.status || 200,
        headers: new Map(Object.entries(init?.headers || {})),
        json: async () => data
      }
      return response
    }
  },
  NextRequest: jest.fn()
}))

// ============================================================================
// REAL FETCH FOR E2E TESTS
// ============================================================================
// IMPORTANT: This setup uses REAL fetch for integration testing
// Tests will make REAL HTTP requests to:
// - Ollama (http://localhost:11434)
// - Perplexity (https://api.perplexity.ai)
// - Other external APIs

// Ensure fetch is available globally (Node.js 18+ native fetch)
if (typeof globalThis.fetch === 'function') {
  // Use native fetch from Node.js 18+
  global.fetch = globalThis.fetch;
  console.log('✅ Using native Node.js fetch for E2E tests');
} else {
  // Try to import node-fetch as fallback
  try {
    const nodeFetch = require('node-fetch');
    global.fetch = nodeFetch;
    console.log('✅ Using node-fetch for E2E tests');
  } catch (e) {
    console.error('❌ ERROR: fetch not available for E2E tests');
    console.error('Node.js 18+ required, or install node-fetch');
    throw new Error('fetch not available - E2E tests cannot run');
  }
}

// Mock Web Streams API (required by AI SDK)
if (!global.TransformStream) {
  global.TransformStream = class TransformStream {
    constructor() {
      this.readable = {
        getReader: jest.fn(() => ({
          read: jest.fn(),
          cancel: jest.fn(),
          releaseLock: jest.fn(),
        })),
      }
      this.writable = {
        getWriter: jest.fn(() => ({
          write: jest.fn(),
          close: jest.fn(),
          abort: jest.fn(),
        })),
      }
    }
  }
}

if (!global.ReadableStream) {
  global.ReadableStream = class ReadableStream {
    constructor() {
      this.getReader = jest.fn(() => ({
        read: jest.fn(),
        cancel: jest.fn(),
        releaseLock: jest.fn(),
      }))
    }
  }
}

if (!global.WritableStream) {
  global.WritableStream = class WritableStream {
    constructor() {
      this.getWriter = jest.fn(() => ({
        write: jest.fn(),
        close: jest.fn(),
        abort: jest.fn(),
      }))
    }
  }
}

// Log test environment setup
console.log('📝 E2E Test Environment:');
console.log(`  - ENABLE_OLLAMA_TESTS: ${process.env.ENABLE_OLLAMA_TESTS || 'false'}`);
console.log(`  - Ollama URL: ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`);
console.log(`  - Real fetch: ${typeof global.fetch === 'function' ? 'YES' : 'NO'}`);
console.log(`  - Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
