export function slugify (text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/\W+/g, '-')
    .replace(/^-+|-+$/g, '')
}
