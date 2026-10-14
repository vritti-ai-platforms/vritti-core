import { allowedOriginOf, normalizeOrigin, normalizeOrigins } from './allowed-origins';

describe('allowed origins', () => {
  describe('normalizeOrigin', () => {
    it.each([
      ['https://desitaakat.com', 'https://desitaakat.com'],
      ['https://shop.example:8443', 'https://shop.example:8443'],
      ['http://localhost:3000', 'http://localhost:3000'],
      ['http://127.0.0.1:5173', 'http://127.0.0.1:5173'],
      ['https://desitaakat.com/', 'https://desitaakat.com'],
      ['  https://Shop.Example  ', 'https://shop.example'],
    ])('accepts %s as %s', (input, expected) => {
      expect(normalizeOrigin(input)).toBe(expected);
    });

    it.each([
      'http://shop.example',
      'ftp://shop.example',
      'javascript:alert(1)',
      'https://shop.example/checkout',
      'https://shop.example?x=1',
      'https://shop.example#top',
      'https://user:pass@shop.example',
      'https://shop.example:443',
      'shop.example',
      '',
    ])('refuses %s', (input) => {
      expect(normalizeOrigin(input)).toBeNull();
    });

    it('refuses a value that is not a string', () => {
      expect(normalizeOrigin(42)).toBeNull();
    });
  });

  it('normalizes and dedupes a list', () => {
    expect(normalizeOrigins(['https://a.example', 'https://A.example/', 'http://localhost:3000'])).toEqual([
      'https://a.example',
      'http://localhost:3000',
    ]);
  });

  describe('allowedOriginOf', () => {
    const allowed = ['https://shop.example', 'http://localhost:3000'];

    it('matches a page on an allowed origin', () => {
      expect(allowedOriginOf('https://shop.example/thanks?a=1', allowed)).toBe('https://shop.example');
      expect(allowedOriginOf('http://localhost:3000/checkout', allowed)).toBe('http://localhost:3000');
    });

    it('refuses a page on another origin, port or scheme', () => {
      expect(allowedOriginOf('https://evil.example/', allowed)).toBeNull();
      expect(allowedOriginOf('https://shop.example.evil.example/', allowed)).toBeNull();
      expect(allowedOriginOf('http://localhost:4000/', allowed)).toBeNull();
      expect(allowedOriginOf('http://shop.example/', ['http://shop.example'])).toBeNull();
      expect(allowedOriginOf('not a url', allowed)).toBeNull();
    });
  });
});
