// Jest setup file for global test configuration
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.PERPLEXITY_API_KEY = 'test-perplexity-key'

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
