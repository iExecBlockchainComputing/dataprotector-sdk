export function secondsToDays(seconds: number) {
  const days = seconds / 60 / 60 / 24;
  return days >= 1 ? days : 'Less than a day 🤔';
}
