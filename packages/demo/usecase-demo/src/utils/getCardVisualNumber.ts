export function getCardVisualNumber({ address }: { address: string }) {
  const mactches = address.match(/\d/g);
  if (!mactches?.[1] || mactches[1] === '0') {
    return 'card-visual-bg-1';
  }
  return `card-visual-bg-${mactches[1]}`;
}
