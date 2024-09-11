export function nrlcToRlc(nrlcValue: number | undefined) {
  if (nrlcValue == null) {
    return '';
  }
  return nrlcValue / 10 ** 9;
}
