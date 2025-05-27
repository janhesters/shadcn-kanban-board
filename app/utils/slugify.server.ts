export function slugify(string = ''): string {
  return string
    .normalize('NFKD') //for example è decomposes to as e +  ̀
    .replaceAll(/[\u0300-\u036F]/g, '') // removes combining marks
    .replaceAll(/\s+/g, '-') // replaces one or more whitespace characters with a single hyphen
    .replaceAll(/[^\w.-]+/g, '') // removes all non-word characters except for dots and hyphens
    .toLowerCase()
    .replaceAll(/^-+|-+$/g, ''); // removes leading and trailing hyphens
}
