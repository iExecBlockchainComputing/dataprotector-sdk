export function daysToSeconds(days: number) {
  return days * 24 * 60 * 60;
}

export function readableSecondsToDays(seconds: number) {
  const days = seconds / 60 / 60 / 24;
  return days >= 1 ? days : 'Less than a day 🤔';
}
