import { readableSecondsToDays } from '@/utils/secondsToDays.ts';

export function remainingDays({ endDate }: { endDate: number }) {
  const now = Math.floor(new Date().getTime() / 1000);
  return readableSecondsToDays(endDate - now);
}
