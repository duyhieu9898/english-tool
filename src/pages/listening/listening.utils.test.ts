import { describe, it, expect } from 'vitest';
import { normalizeText } from './listening.utils';

describe('normalizeText', () => {
  it('should convert text to lowercase', () => {
    expect(normalizeText('HELLO')).toBe('hello');
    expect(normalizeText('Hello World')).toBe('hello world');
  });

  it('should remove punctuation', () => {
    expect(normalizeText('Hello, World!')).toBe('hello world');
    expect(normalizeText('apple. banana, orange?')).toBe('apple banana orange');
    expect(normalizeText('it\'s a test')).toBe('its a test');
  });

  it('should remove extra whitespace', () => {
    expect(normalizeText('  hello   world  ')).toBe('hello world');
    expect(normalizeText('multiple    spaces')).toBe('multiple spaces');
  });

  it('should handle combination of all rules', () => {
    expect(normalizeText('  Hello, WORLD!!!  This is... a TEST.  ')).toBe('hello world this is a test');
  });

  it('should return empty string for empty input', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   ')).toBe('');
  });
});
