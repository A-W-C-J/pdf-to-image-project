import { validateFileOrThrow } from '../../lib/validation'
import '@testing-library/jest-dom'

describe('Validation', () => {
  describe('validateFileOrThrow', () => {
    it('validates PDF files correctly', () => {
      const validPdfFile = new File(['dummy content'], 'test.pdf', {
        type: 'application/pdf'
      })
      
      expect(() => validateFileOrThrow(validPdfFile)).not.toThrow()
    })

    it('throws error for non-PDF files', () => {
      const invalidFile = new File(['dummy content'], 'test.txt', {
        type: 'text/plain'
      })
      
      expect(() => validateFileOrThrow(invalidFile)).toThrow()
      expect(() => validateFileOrThrow(invalidFile)).toThrow('Invalid file type')
    })

    it('throws error for files without PDF extension', () => {
      const invalidFile = new File(['dummy content'], 'test.txt', {
        type: 'application/pdf'
      })
      
      expect(() => validateFileOrThrow(invalidFile)).toThrow()
    })

    it('throws error for files that are too large', () => {
      // Create a mock file that appears to be larger than the limit
      const largeFile = new File(['dummy content'], 'test.pdf', {
        type: 'application/pdf'
      })
      
      // Mock the size property
      Object.defineProperty(largeFile, 'size', {
        value: 100 * 1024 * 1024 + 1, // 100MB + 1 byte
        writable: false
      })
      
      expect(() => validateFileOrThrow(largeFile)).toThrow()
      expect(() => validateFileOrThrow(largeFile)).toThrow('File size too large')
    })

    it('accepts files at the size limit', () => {
      const maxSizeFile = new File(['dummy content'], 'test.pdf', {
        type: 'application/pdf'
      })
      
      // Mock the size property to be exactly at the limit
      Object.defineProperty(maxSizeFile, 'size', {
        value: 100 * 1024 * 1024, // Exactly 100MB
        writable: false
      })
      
      expect(() => validateFileOrThrow(maxSizeFile)).not.toThrow()
    })

    it('throws error for empty files', () => {
      const emptyFile = new File([], 'test.pdf', {
        type: 'application/pdf'
      })
      
      expect(() => validateFileOrThrow(emptyFile)).toThrow()
      expect(() => validateFileOrThrow(emptyFile)).toThrow('File is empty')
    })

    it('accepts files with uppercase PDF extension', () => {
      const validFile = new File(['dummy content'], 'test.PDF', {
        type: 'application/pdf'
      })
      
      expect(() => validateFileOrThrow(validFile)).not.toThrow()
    })

    it('throws error for files with no extension', () => {
      const noExtFile = new File(['dummy content'], 'test', {
        type: 'application/pdf'
      })
      
      expect(() => validateFileOrThrow(noExtFile)).toThrow()
    })

    it('throws error for null or undefined files', () => {
      expect(() => validateFileOrThrow(null as any)).toThrow()
      expect(() => validateFileOrThrow(undefined as any)).toThrow()
    })
  })

  describe('FileValidationError', () => {
    it('throws with correct error message', () => {
      const invalidFile = new File(['dummy content'], 'test.txt', {
        type: 'text/plain'
      })
      
      expect(() => validateFileOrThrow(invalidFile)).toThrow('Invalid file type')
    })
  })
})