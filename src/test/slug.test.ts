import { describe, it, expect } from 'vitest';
import { generateSlug } from '@/lib/slug';

describe('generateSlug', () => {
  it('converts name to lowercase with hyphens', () => {
    expect(generateSlug('Luxe Beauty Studio')).toBe('luxe-beauty-studio');
  });

  it('removes special characters', () => {
    expect(generateSlug('Glow & Glamour')).toBe('glow-glamour');
    expect(generateSlug("The Cutting Edge!")).toBe('the-cutting-edge');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('My   Salon   Name')).toBe('my-salon-name');
  });

  it('handles leading/trailing spaces', () => {
    expect(generateSlug('  Salon Name  ')).toBe('salon-name');
  });

  it('handles numbers', () => {
    expect(generateSlug('Salon 123')).toBe('salon-123');
  });

  it('handles apostrophes and quotes', () => {
    expect(generateSlug("Maria's Beauty Salon")).toBe('marias-beauty-salon');
  });

  it('handles non-English characters by removing them', () => {
    expect(generateSlug('Café Beauté')).toBe('caf-beaut');
  });

  it('limits length to 100 characters', () => {
    const longName = 'A'.repeat(150);
    expect(generateSlug(longName).length).toBeLessThanOrEqual(100);
  });
});
