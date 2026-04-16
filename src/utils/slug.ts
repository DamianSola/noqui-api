import { randomBytes } from 'crypto';

export function slugify(text: string): string {
  const s = text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'negocio';
}

export function uniqueSlugFromName(name: string): string {
  return `${slugify(name)}-${randomBytes(3).toString('hex')}`;
}
