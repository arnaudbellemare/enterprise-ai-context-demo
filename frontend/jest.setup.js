// Jest setup file for global test configuration
import '@testing-library/jest-dom'

// Use real environment variables for tests (from .env.local or system env)
// These will be used by real Supabase client and API calls
// NOTE: Do not hardcode secrets here - use environment variables or .env.local
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

// Global test utilities
global.console = {
  ...console,
  // Suppress console logs during tests (uncomment to see logs)
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
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

// Mock Next.js server components (Request/Response)
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

// Mock NextResponse specifically
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
// Web Streams API Mocks (Required by AI SDK and Streaming APIs)
// ============================================================================
// These are browser/Web APIs not available in Node.js < 18 or Jest's jsdom
// They're required when importing AI SDK code that uses eventsource-parser

// Mock fetch globally (if not already mocked)
// Required by: GAMP agents making Ollama API calls
// Available in: Node.js 18+, browsers
// Returns a proper response object that can be used with real API calls
if (!global.fetch) {
  global.fetch = jest.fn((url, options) => {
    // Return a promise that resolves to a proper Response-like object
    return Promise.resolve({
      ok: false, // Default to false so tests handle errors gracefully
      status: 500,
      statusText: 'Not Implemented',
      json: async () => ({ error: 'fetch not properly configured for tests' }),
      text: async () => 'fetch not properly configured for tests',
      headers: new Map(),
    });
  });
}

// Mock TransformStream for Node.js environment
// Required by: eventsource-parser (AI SDK dependency)
// Available in: Node.js 18+, browsers
// Why: AI SDK imports this immediately when loaded, causing test failures
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

// Mock ReadableStream for Node.js environment
// Required by: AI SDK streaming responses, TransformStream
// Available in: Node.js 18+, browsers
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

// Mock WritableStream for completeness (if needed by streaming APIs)
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
