import { describe, it, expect } from 'vitest';
import { normalizeText, matchWords, diffWords } from './listening.utils';

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

describe('matchWords', () => {
  it('should match all words when input matches target exactly', () => {
    const target = ['I', 'wake', 'up', 'at', '7', "o'clock", 'every', 'morning.'];
    const input = ['i', 'wake', 'up', 'at', '7', 'oclock', 'every', 'morning'];
    expect(matchWords(target, input)).toEqual([true, true, true, true, true, true, true, true]);
  });

  it('should keep trailing words green when user types extra or wrong words in the middle', () => {
    const target = ['I', 'wake', 'up', 'at', '7', "o'clock", 'every', 'morning'];
    const input = ['i', 'with', 'up', 'at', 'a', '7', "o'clock", 'every', 'morning'];
    expect(matchWords(target, input)).toEqual([true, false, true, true, true, true, true, true]);
  });

  it('should keep trailing words green when user omits a word in the middle', () => {
    const target = ['She', 'picked', 'a', 'red', 'apple'];
    const input = ['she', 'picked', 'red', 'apple'];
    expect(matchWords(target, input)).toEqual([true, true, false, true, true]);
  });

  it('should mark all false when input is empty', () => {
    expect(matchWords(['Hello', 'world'], [])).toEqual([false, false]);
  });
});

describe('diffWords', () => {
  it('should return extra words when user types extra words in the middle or end', () => {
    const target = ['I', 'wake', 'up', 'at', '7', "o'clock", 'every', 'morning'];
    const input = ['i', 'wake', 'up', 'at', 'a', '7', "o'clock", 'every', 'morning', 'please'];
    expect(diffWords(target, input)).toEqual({
      matched: [true, true, true, true, true, true, true, true],
      extraWords: ['a', 'please'],
    });
  });
});
