import { cn } from '../../lib/utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toBe('base conditional')
    })

    it('handles undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid')
      expect(result).toBe('base valid')
    })

    it('handles empty strings', () => {
      const result = cn('base', '', 'valid')
      expect(result).toBe('base valid')
    })

    it('merges Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4')
    })

    it('handles arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('handles objects with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true
      })
      expect(result).toBe('class1 class3')
    })

    it('returns empty string for no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles complex combinations', () => {
      const isActive = true
      const isDisabled = false
      const result = cn(
        'base-class',
        {
          'active': isActive,
          'disabled': isDisabled
        },
        isActive && 'active-modifier',
        'final-class'
      )
      expect(result).toBe('base-class active active-modifier final-class')
    })

    it('handles nested arrays and objects', () => {
      const result = cn(
        'base',
        ['array1', ['nested', 'array']],
        { 'obj1': true, 'obj2': false }
      )
      expect(result).toBe('base array1 nested array obj1')
    })
  })
})