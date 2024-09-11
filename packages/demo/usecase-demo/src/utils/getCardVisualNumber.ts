export function getCardVisualNumber({ address }: { address: string }) {
  const matches = address.match(/\d/g);
  if (!matches?.[1] || matches[1] === '0') {
    return 'card-visual-bg-1';
  }
  return `card-visual-bg-${matches[1]}`;
}
