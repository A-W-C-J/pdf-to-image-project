import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  }
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useLocale: () => 'en'
}))

// Mock window.URL.createObjectURL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mocked-url'),
    revokeObjectURL: jest.fn()
  }
})

// Mock File API
Object.defineProperty(window, 'File', {
  value: class MockFile {
    constructor(parts, filename, properties) {
      this.parts = parts
      this.name = filename
      this.size = parts.reduce((acc, part) => acc + part.length, 0)
      this.type = properties?.type || ''
      this.lastModified = Date.now()
    }
  }
})

// Mock FileReader
Object.defineProperty(window, 'FileReader', {
  value: class MockFileReader {
    constructor() {
      this.readAsDataURL = jest.fn()
      this.readAsArrayBuffer = jest.fn()
      this.result = null
      this.onload = null
      this.onerror = null
    }
  }
})