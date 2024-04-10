export function pluralize(count: number | '', term: string) {
  if (count === '' || count == null) {
    return '';
  }
  if (count <= 1) {
    return `${count} ${term}`;
  }
  return `${count} ${term}s`;
}
