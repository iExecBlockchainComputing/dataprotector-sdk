export function pluralize(count: number | string, term: string) {
  if (count === '' || count == null || isNaN(Number(count))) {
    return '';
  }
  if (Number(count) <= 1) {
    return `${count} ${term}`;
  }
  return `${count} ${term}s`;
}
