export function secondsToDays(seconds?: number) {
  if (!seconds) {
    return '';
  }
  return seconds / 24 / 60 / 60;
}

export function daysToSeconds(days: number) {
  return days * 24 * 60 * 60;
}

export function readableSecondsToDays(seconds: number | undefined | null) {
  if (!seconds) {
    return '-';
  }
  const days = Math.round(seconds / 60 / 60 / 24);
  if (days < 1) {
    const hours = Math.round(seconds / 60 / 60);
    if (hours < 1) {
      const minutes = Math.round(seconds / 60);
      if (minutes < 1) {
        return 'less than a minute';
      }
      return minutes > 1 ? `${minutes} minutes` : `${minutes} minute`;
    }
    return hours > 1 ? `${hours} hours` : `${hours} hour`;
  }
  return days > 1 ? `${days} days` : `${days} day`;
}
