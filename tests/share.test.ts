import { describe, it, expect } from 'vitest';
import { absUrl, shareBase, shareTargets } from '../src/lib/share';

describe('boutons de partage', () => {
  it('utilise toujours le domaine officiel, sauf en local', () => {
    expect(shareBase('https://nexus-m97k-abc.vercel.app')).toBe('https://www.backmarket-ci.com');
    expect(absUrl('/offre/12', 'https://x.vercel.app')).toBe('https://www.backmarket-ci.com/offre/12');
    expect(absUrl('/', 'https://www.backmarket-ci.com')).toBe('https://www.backmarket-ci.com/');
    expect(absUrl('/offre/1', 'http://localhost:5173')).toBe('http://localhost:5173/offre/1');
  });
  it('encode correctement titres et liens', () => {
    const url = 'https://www.backmarket-ci.com/offre/5?a=1&b=2';
    const t = shareTargets(url, 'Thé & café · 1 500 FCFA');
    const get = (n: string) => t.find((x) => x.name === n)!.href;
    expect(get('WhatsApp')).toBe(`https://wa.me/?text=${encodeURIComponent(`Thé & café · 1 500 FCFA\n${url}`)}`);
    expect(get('Facebook')).toContain(encodeURIComponent(url));
    expect(get('X (Twitter)')).toContain('text=Th%C3%A9%20%26%20caf%C3%A9');
    expect(get('E-mail').startsWith('mailto:?subject=')).toBe(true);
    for (const x of t) expect(x.href).not.toMatch(/ |\n/);
  });
});
